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
    const template = `Title,Date,Passage,Series,Songs
주일 3부예배 찬양,"April 7, 2024",,,"우리 보좌앞에 모였네 / 내가 매일기쁘게 / 내 안에 가장 귀한 것"
엎드림 금요기도회 찬양,"April 12, 2024",,다음세대,"나의 하나님 (D) / 주 이름 큰 능력 (D) / 마음속에 근심있는 사람 (G)"
주일 3부예배 찬양,"May 5, 2024",,,내 평생 사는 동안 (D) / 보아라 즐거운 우리집 (G) / 주만바라볼찌라 (G→A)`;
    
    const blob = new Blob([template], { type: "text/csv" });
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
            theme: set.series,
            community_id: selectedCommunityId,
            worship_leader: defaultWorshipLeader || null,
            status: status,
            created_by: user.id,
          })
          .select()
          .single();

        if (setError) throw setError;

        // Insert songs
        let position = 1;
        for (const parsedSong of set.parsedSongs) {
          const matchResult = matchResults.get(parsedSong.originalText);
          if (!matchResult?.matchedSong) continue;

          await supabase.from("set_songs").insert({
            service_set_id: insertedSet.id,
            song_id: matchResult.matchedSong.id,
            position: position++,
            key: parsedSong.key || null,
            custom_notes: parsedSong.notes || 
              (parsedSong.keyTransition ? `Key transition: ${parsedSong.keyTransition}` : null),
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
