import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { parseWorshipSetCSV, ParsedWorshipSet } from "@/lib/csvSetParser";
import { matchAllSongs, MatchResult, Song } from "@/lib/songMatcher";
import { SetImportUploadStep } from "./SetImportUploadStep";
import { SetImportMatchingStep } from "./SetImportMatchingStep";
import { SetImportConfigStep } from "./SetImportConfigStep";
import { SetImportConflictStep } from "./SetImportConflictStep";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface SetImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export const SetImportDialog = ({
  open,
  onOpenChange,
  onImportComplete,
}: SetImportDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [step, setStep] = useState<"upload" | "matching" | "config" | "conflict">("upload");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedSets, setParsedSets] = useState<ParsedWorshipSet[]>([]);
  const [matchResults, setMatchResults] = useState<Map<string, MatchResult>>(new Map());
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [defaultWorshipLeader, setDefaultWorshipLeader] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [conflictResolutions, setConflictResolutions] = useState<Map<number, "skip" | "overwrite" | "duplicate">>(new Map());
  const [importing, setImporting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: communities = [] } = useQuery({
    queryKey: ["user-communities", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("worship_communities")
        .select("id, name")
        .eq("leader_id", user.id)
        .eq("is_active", true);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: songLibrary = [] } = useQuery({
    queryKey: ["song-library"],
    queryFn: async () => {
      const { data } = await supabase
        .from("songs")
        .select("id, title, artist, category, language, default_key")
        .order("title");
      return (data || []) as Song[];
    },
  });

  const handleFileSelect = async (file: File) => {
    setCsvFile(file);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsed = parseWorshipSetCSV(results.data);
        setParsedSets(parsed);

        // Auto-match songs
        const allParsedSongs = parsed.flatMap((set) => set.parsedSongs);
        const matches = await matchAllSongs(allParsedSongs, songLibrary);
        setMatchResults(matches);
        
        toast({
          title: t("setImport.csvParsed"),
          description: `${parsed.length} ${t("setImport.setsFound")}`,
        });
      },
      error: (error) => {
        toast({
          title: t("setImport.parseError"),
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleDownloadTemplate = () => {
    const template = `Date,ServiceName,WorshipLeader,BandName,Theme,ScriptureReference,TargetAudience,ServiceTime,WorshipDuration,Notes,Songs,SongKeys,SongBPMs,SongNotes,WorshipOrder
2024-12-25,성탄 연합예배,최광은,하기오스,성탄의 기쁨,누가복음 2:1-20,장년,12:00,18,,예배합니다 / 주 예수 내 맘에 들어와 / 시선 / 왕이신 나의 하나님,F / G / E / F,120 / 85 / 72 / 90,후렴만 / / / 1-2절만,카운트다운::10 | 환영:담당자:3 | 찬양::18 | 대표기도::5 | 설교:담임목사:45 | 축도::3
2024-04-07,주일 3부예배 찬양,,,,,,,,,우리 보좌앞에 모였네 / 내가 매일기쁘게 / 주만바라볼찌라,D / G / G→A,,,`;
    
    const blob = new Blob(["\uFEFF" + template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "worship_set_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!selectedCommunityId || !user?.id) {
      toast({
        title: t("setImport.error"),
        description: t("setImport.selectCommunityRequired"),
        variant: "destructive",
      });
      return;
    }

    setImporting(true);

    try {
      for (const set of parsedSets) {
        const resolution = conflictResolutions.get(set.rowIndex);
        if (resolution === "skip") continue;

        // Handle overwrite
        if (resolution === "overwrite") {
          const { data: existing } = await supabase
            .from("service_sets")
            .select("id")
            .eq("community_id", selectedCommunityId)
            .eq("date", set.date)
            .eq("service_name", set.title)
            .single();

          if (existing) {
            await supabase.from("set_songs").delete().eq("service_set_id", existing.id);
            await supabase.from("service_sets").delete().eq("id", existing.id);
          }
        }

        // Insert service set
        const setName = resolution === "duplicate" 
          ? `${set.title} (${new Date().getTime()})`
          : set.title;

        const { data: insertedSet, error: setError } = await supabase
          .from("service_sets")
          .insert({
            service_name: setName,
            date: set.date,
            scripture_reference: set.passage,
            theme: set.theme || set.series,
            community_id: selectedCommunityId,
            worship_leader: set.worshipLeader || defaultWorshipLeader || null,
            band_name: set.bandName || null,
            target_audience: set.targetAudience || null,
            service_time: set.serviceTime || null,
            worship_duration: set.worshipDuration || null,
            notes: set.notes || null,
            status: status,
            created_by: user.id,
          })
          .select()
          .single();

        if (setError) throw setError;

        // Insert songs
        let songPosition = 1;
        for (const parsedSong of set.parsedSongs) {
          const matchResult = matchResults.get(parsedSong.originalText);
          if (!matchResult?.matchedSong) continue;

          await supabase.from("set_songs").insert({
            service_set_id: insertedSet.id,
            song_id: matchResult.matchedSong.id,
            position: songPosition++,
            key: parsedSong.key || null,
            bpm: parsedSong.bpm || null,
            custom_notes: parsedSong.notes || 
              (parsedSong.keyTransition ? `Key transition: ${parsedSong.keyTransition}` : null),
          });
        }

        // Insert worship order components
        let componentPosition = 1;
        for (const component of set.parsedComponents) {
          await supabase.from("set_components").insert({
            service_set_id: insertedSet.id,
            component_type: component.type,
            label: component.label,
            assigned_to: component.assignedTo || null,
            duration_minutes: component.durationMinutes || null,
            content: component.content || null,
            position: componentPosition++,
          });
        }
      }

      toast({
        title: t("setImport.success"),
        description: `${parsedSets.length} ${t("setImport.setsImported")}`,
      });

      onImportComplete();
      handleReset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t("setImport.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setCsvFile(null);
    setParsedSets([]);
    setMatchResults(new Map());
    setSelectedCommunityId("");
    setDefaultWorshipLeader("");
    setStatus("draft");
    setConflictResolutions(new Map());
  };

  const canProceedFromUpload = csvFile && parsedSets.length > 0;
  const canProceedFromMatching = true;
  const canProceedFromConfig = selectedCommunityId !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("setImport.title")}</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <SetImportUploadStep
            onFileSelect={handleFileSelect}
            onDownloadTemplate={handleDownloadTemplate}
            fileName={csvFile?.name}
          />
        )}

        {step === "matching" && (
          <SetImportMatchingStep
            parsedSets={parsedSets}
            matchResults={matchResults}
            songLibrary={songLibrary}
            onUpdateMatch={(originalText, matchResult) => {
              setMatchResults((prev) => {
                const updated = new Map(prev);
                updated.set(originalText, matchResult);
                return updated;
              });
            }}
          />
        )}

        {step === "config" && (
          <SetImportConfigStep
            communities={communities}
            selectedCommunityId={selectedCommunityId}
            onCommunityChange={setSelectedCommunityId}
            defaultWorshipLeader={defaultWorshipLeader}
            onWorshipLeaderChange={setDefaultWorshipLeader}
            status={status}
            onStatusChange={setStatus}
          />
        )}

        {step === "conflict" && selectedCommunityId && (
          <SetImportConflictStep
            parsedSets={parsedSets}
            communityId={selectedCommunityId}
            onConflictsResolved={setConflictResolutions}
          />
        )}

        <DialogFooter>
          {step !== "upload" && (
            <Button variant="outline" onClick={() => {
              if (step === "matching") setStep("upload");
              else if (step === "config") setStep("matching");
              else if (step === "conflict") setStep("config");
            }}>
              {t("setImport.back")}
            </Button>
          )}

          {step === "upload" && (
            <Button onClick={() => setStep("matching")} disabled={!canProceedFromUpload}>
              {t("setImport.continue")}
            </Button>
          )}

          {step === "matching" && (
            <Button onClick={() => setStep("config")} disabled={!canProceedFromMatching}>
              {t("setImport.continue")}
            </Button>
          )}

          {step === "config" && (
            <Button onClick={() => setStep("conflict")} disabled={!canProceedFromConfig}>
              {t("setImport.continue")}
            </Button>
          )}

          {step === "conflict" && (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? t("setImport.importing") : t("setImport.confirmImport")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
