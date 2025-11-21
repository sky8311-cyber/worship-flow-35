import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { findDuplicates, executeMerge, DuplicateGroup, MergeDecision } from "@/lib/duplicateFinder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, ExternalLink, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ScorePreviewDialog } from "@/components/ScorePreviewDialog";

interface DuplicateReviewDialogProps {
  open: boolean;
  onClose: () => void;
  songs: any[];
  onMergeComplete: () => void;
}

export const DuplicateReviewDialog = ({ open, onClose, songs, onMergeComplete }: DuplicateReviewDialogProps) => {
  const { t } = useTranslation();
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [decisions, setDecisions] = useState<Map<string, MergeDecision>>(new Map());
  const [songUsages, setSongUsages] = useState<Map<string, number>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [scorePreviewOpen, setScorePreviewOpen] = useState(false);
  const [selectedScoreUrl, setSelectedScoreUrl] = useState<string | null>(null);
  const [selectedSongTitle, setSelectedSongTitle] = useState("");

  useEffect(() => {
    if (open && songs.length > 0) {
      const groups = findDuplicates(songs);
      setDuplicateGroups(groups);
      setCurrentGroupIndex(0);
      setDecisions(new Map());
      
      if (groups.length === 0) {
        toast.info(t("songLibrary.duplicateReview.noDuplicates"));
        onClose();
      }
    }
  }, [open, songs]);

  useEffect(() => {
    const loadUsages = async () => {
      const usages = new Map();
      for (const group of duplicateGroups) {
        for (const song of group.songs) {
          const { count, error } = await supabase
            .from("set_songs")
            .select("*", { count: "exact", head: true })
            .eq("song_id", song.id);
          
          if (!error) {
            usages.set(song.id, count || 0);
          }
        }
      }
      setSongUsages(usages);
    };

    if (duplicateGroups.length > 0) {
      loadUsages();
    }
  }, [duplicateGroups]);

  const currentGroup = duplicateGroups[currentGroupIndex];

  const handleSelectMaster = (masterSongId: string) => {
    if (!currentGroup) return;

    const newDecisions = new Map(decisions);
    const duplicateIds = currentGroup.songs
      .filter(s => s.id !== masterSongId)
      .map(s => s.id);

    newDecisions.set(currentGroup.id, {
      groupId: currentGroup.id,
      masterSongId,
      duplicateIds,
      action: 'merge'
    });

    setDecisions(newDecisions);
  };

  const handleSkipGroup = () => {
    if (!currentGroup) return;

    const newDecisions = new Map(decisions);
    newDecisions.set(currentGroup.id, {
      groupId: currentGroup.id,
      masterSongId: '',
      duplicateIds: [],
      action: 'skip'
    });

    setDecisions(newDecisions);
  };

  const handlePrevGroup = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
    }
  };

  const handleNextGroup = () => {
    if (currentGroupIndex < duplicateGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    }
  };

  const handleApproveAll = async () => {
    setShowConfirmDialog(false);
    
    try {
      setIsProcessing(true);
      
      const mergeDecisions = Array.from(decisions.values());
      
      if (mergeDecisions.length === 0) {
        toast.info(t("songLibrary.duplicateReview.noDecisions"));
        return;
      }

      const result = await executeMerge(mergeDecisions);
      
      if (result.errors.length > 0) {
        toast.error(t("songLibrary.duplicateReview.mergeError"));
        console.error("Merge errors:", result.errors);
      } else {
        toast.success(t("songLibrary.duplicateReview.mergeSuccess", { 
          count: result.merged 
        }));
        onMergeComplete();
      }
    } catch (error) {
      console.error("Merge error:", error);
      toast.error(t("common.error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const getCategoryTranslation = (category: string | null) => {
    if (!category) return t("songLibrary.categories.uncategorized");
    const key = `songLibrary.categories.${category}` as any;
    return category;
  };

  const getLanguageTranslation = (language: string | null) => {
    if (!language) return "-";
    const langKey = language.toLowerCase().replace("/", "") as any;
    return t(`songLibrary.languages.${langKey}` as any);
  };

  const formatFieldValue = (value: any, field: string, song?: any): React.ReactNode => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-muted-foreground">-</span>;
    }

    switch (field) {
      case "youtube_url":
        return value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="text-xs">Watch</span>
          </a>
        ) : (
          <XCircle className="h-4 w-4 text-destructive" />
        );
      case "score_file_url":
        return value ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedScoreUrl(value);
              setSelectedSongTitle(song?.title || "Unknown");
              setScorePreviewOpen(true);
            }}
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 hover:underline"
          >
            <Eye className="h-4 w-4" />
            <span className="text-xs">Preview</span>
          </button>
        ) : (
          <XCircle className="h-4 w-4 text-destructive" />
        );
      case "energy_level":
        return <Badge variant="outline">{value}/5</Badge>;
      case "category":
        return <Badge variant="secondary">{getCategoryTranslation(value)}</Badge>;
      case "language":
        return <Badge variant="outline">{getLanguageTranslation(value)}</Badge>;
      case "tags":
        return value ? value.split(",").slice(0, 2).map((tag: string) => (
          <Badge key={tag} variant="secondary" className="mr-1 text-xs">{tag.trim()}</Badge>
        )) : "-";
      case "created_at":
        return format(new Date(value), "yyyy-MM-dd");
      case "bpm":
        return value || "-";
      default:
        return <span>{value}</span>;
    }
  };

  const renderComparisonRow = (label: string, field: string, songs: any[]) => {
    const values = songs.map(s => s[field]);
    const isDifferent = !values.every(v => v === values[0]);

    return (
      <tr key={field}>
        <td className="px-4 py-2 font-medium text-muted-foreground border-r">{label}</td>
        {songs.map((song, idx) => (
          <td 
            key={idx}
            className={cn(
              "px-4 py-2 border-r last:border-r-0",
              isDifferent && "bg-yellow-100 dark:bg-yellow-900/20"
            )}
          >
            {formatFieldValue(song[field], field, song)}
          </td>
        ))}
      </tr>
    );
  };

  const currentDecision = currentGroup ? decisions.get(currentGroup.id) : undefined;
  const mergeCount = Array.from(decisions.values()).filter(d => d.action === 'merge').length;
  const skipCount = Array.from(decisions.values()).filter(d => d.action === 'skip').length;
  const pendingCount = duplicateGroups.length - decisions.size;

  if (!currentGroup) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("songLibrary.duplicateReview.title")}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {t("songLibrary.duplicateReview.foundGroups", { count: duplicateGroups.length })}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">
                  {t("songLibrary.duplicateReview.groupOf", { 
                    current: currentGroupIndex + 1, 
                    total: duplicateGroups.length 
                  })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("songLibrary.duplicateReview.similarity", { percent: currentGroup.confidence })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevGroup}
                  disabled={currentGroupIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextGroup}
                  disabled={currentGroupIndex === duplicateGroups.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-2 text-left border-r">Field</th>
                    {currentGroup.songs.map((song, idx) => (
                      <th key={idx} className="px-4 py-2 text-left border-r last:border-r-0">
                        Song {idx + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {renderComparisonRow("Title", "title", currentGroup.songs)}
                  {renderComparisonRow("Artist", "artist", currentGroup.songs)}
                  {renderComparisonRow("Category", "category", currentGroup.songs)}
                  {renderComparisonRow("Language", "language", currentGroup.songs)}
                  {renderComparisonRow("Key", "default_key", currentGroup.songs)}
                  {renderComparisonRow("BPM", "bpm", currentGroup.songs)}
                  {renderComparisonRow("Energy", "energy_level", currentGroup.songs)}
                  {renderComparisonRow("Tags", "tags", currentGroup.songs)}
                  {renderComparisonRow("YouTube", "youtube_url", currentGroup.songs)}
                  {renderComparisonRow("Score", "score_file_url", currentGroup.songs)}
                  <tr>
                    <td className="px-4 py-2 font-medium text-muted-foreground border-r">
                      {t("songLibrary.duplicateReview.usedInSets")}
                    </td>
                    {currentGroup.songs.map((song, idx) => {
                      const usageCount = songUsages.get(song.id) || 0;
                      return (
                        <td key={idx} className="px-4 py-2 border-r last:border-r-0">
                          {usageCount > 0 ? (
                            <Badge variant="secondary">{usageCount}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              {t("songLibrary.duplicateReview.never")}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {renderComparisonRow("Created", "created_at", currentGroup.songs)}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  {t("songLibrary.duplicateReview.selectMaster")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("songLibrary.duplicateReview.masterNote")}
                </p>
              </div>
              
              <RadioGroup
                value={currentDecision?.masterSongId || ''}
                onValueChange={handleSelectMaster}
                className="space-y-2"
              >
                {currentGroup.songs.map((song, idx) => (
                  <div key={song.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={song.id} id={`song-${song.id}`} />
                    <Label htmlFor={`song-${song.id}`} className="cursor-pointer flex-1">
                      <span className="font-medium">
                        {t("songLibrary.duplicateReview.keepSong")} {idx + 1}
                      </span>
                      {" - "}
                      <span className="text-muted-foreground">{song.title}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSkipGroup}
                className="w-full"
              >
                {t("songLibrary.duplicateReview.skipGroup")}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground border-t pt-3">
              {t("songLibrary.duplicateReview.decisions", { 
                merged: mergeCount, 
                skipped: skipCount, 
                pending: pendingCount 
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              {t("common.cancel")}
            </Button>
            <Button 
              onClick={() => setShowConfirmDialog(true)} 
              disabled={isProcessing || mergeCount === 0}
            >
              {isProcessing ? t("songLibrary.duplicateReview.processing") : t("songLibrary.duplicateReview.approveAll")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScorePreviewDialog
        open={scorePreviewOpen}
        onOpenChange={setScorePreviewOpen}
        scoreUrl={selectedScoreUrl}
        songTitle={selectedSongTitle}
      />

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("songLibrary.duplicateReview.warningTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("songLibrary.duplicateReview.warningMessage", { count: mergeCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveAll}>
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
