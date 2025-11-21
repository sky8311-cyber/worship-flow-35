import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";
import { findDuplicates, DuplicateGroup } from "@/lib/duplicateFinder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  ChevronRight, 
  XCircle, 
  ExternalLink, 
  Eye, 
  AlertCircle,
  Star,
  Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ScorePreviewDialog } from "@/components/ScorePreviewDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DuplicateReviewDialogProps {
  open: boolean;
  onClose: () => void;
  songs: any[];
  onMergeComplete: () => void;
}

interface DuplicateProgress {
  timestamp: number;
  currentGroupIndex: number;
  processedGroups: string[];
  skippedGroups: string[];
  duplicateGroups: DuplicateGroup[];
}

const STORAGE_KEY = "k-worship-duplicate-progress";

export const DuplicateReviewDialog = ({ open, onClose, songs, onMergeComplete }: DuplicateReviewDialogProps) => {
  const { t } = useTranslation();
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [highConfidenceGroups, setHighConfidenceGroups] = useState<DuplicateGroup[]>([]);
  const [mediumConfidenceGroups, setMediumConfidenceGroups] = useState<DuplicateGroup[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());
  const [batchSelectedGroups, setBatchSelectedGroups] = useState<Set<string>>(new Set());
  const [processedGroups, setProcessedGroups] = useState<Set<string>>(new Set());
  const [skippedGroups, setSkippedGroups] = useState<Set<string>>(new Set());
  const [songUsages, setSongUsages] = useState<Map<string, number>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [scorePreviewOpen, setScorePreviewOpen] = useState(false);
  const [selectedScoreUrl, setSelectedScoreUrl] = useState<string | null>(null);
  const [selectedSongTitle, setSelectedSongTitle] = useState("");
  const [activeTab, setActiveTab] = useState<"high" | "medium">("high");

  const saveProgressToLocalStorage = (
    processed: Set<string>,
    skipped: Set<string>,
    currentIndex: number
  ) => {
    const progress: DuplicateProgress = {
      timestamp: Date.now(),
      currentGroupIndex: currentIndex,
      processedGroups: Array.from(processed),
      skippedGroups: Array.from(skipped),
      duplicateGroups: duplicateGroups,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  };

  const loadProgressFromLocalStorage = (): DuplicateProgress | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      const progress = JSON.parse(stored) as DuplicateProgress;
      
      if (Date.now() - progress.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return progress;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  };

  const clearProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    if (open && songs.length > 0) {
      findDuplicates(songs).then((groups) => {
        if (groups.length === 0) {
          toast.info(t("songLibrary.duplicateReview.noDuplicates"));
          onClose();
          return;
        }

        // Split into high and medium confidence
        const high = groups.filter(g => g.confidence >= 85);
        const medium = groups.filter(g => g.confidence < 85);

        setDuplicateGroups(groups);
        setHighConfidenceGroups(high);
        setMediumConfidenceGroups(medium);

        // Auto-select all high confidence groups for batch processing
        const highGroupIds = new Set(high.map(g => g.id));
        setBatchSelectedGroups(highGroupIds);

        const savedProgress = loadProgressFromLocalStorage();
        if (savedProgress && savedProgress.duplicateGroups.length === groups.length) {
          toast.info(t("songLibrary.duplicateReview.resuming"));
          setCurrentGroupIndex(savedProgress.currentGroupIndex);
          setProcessedGroups(new Set(savedProgress.processedGroups));
          setSkippedGroups(new Set(savedProgress.skippedGroups));
        } else {
          setCurrentGroupIndex(0);
          setProcessedGroups(new Set());
          setSkippedGroups(new Set());
          clearProgress();
          
          // Show summary toast
          const highDuplicates = high.reduce((sum, g) => sum + g.songs.length - 1, 0);
          const mediumDuplicates = medium.reduce((sum, g) => sum + g.songs.length - 1, 0);
          
          toast.success(
            `${t("songLibrary.duplicateReview.foundGroups", { count: groups.length })}\n` +
            `🔴 ${t("songLibrary.duplicateReview.highConfidence")}: ${high.length} (${highDuplicates}개)\n` +
            `🟡 ${t("songLibrary.duplicateReview.mediumConfidence")}: ${medium.length} (${mediumDuplicates}개)`,
            { duration: 5000 }
          );
        }
      });
    }
  }, [open, songs]);

  useEffect(() => {
    if (duplicateGroups.length > 0 && currentGroupIndex < duplicateGroups.length) {
      const currentGroup = duplicateGroups[currentGroupIndex];
      const songIds = currentGroup.songs.map((s) => s.id);

      supabase
        .from("set_songs")
        .select("song_id")
        .in("song_id", songIds)
        .then(({ data }) => {
          const usageMap = new Map<string, number>();
          if (data) {
            data.forEach((row) => {
              usageMap.set(row.song_id, (usageMap.get(row.song_id) || 0) + 1);
            });
          }
          setSongUsages(usageMap);
        });
    }
  }, [currentGroupIndex, duplicateGroups]);

  const handleBatchDelete = async () => {
    if (batchSelectedGroups.size === 0) {
      toast.error("처리할 그룹을 선택하세요");
      return;
    }

    const selectedGroups = highConfidenceGroups.filter(g => batchSelectedGroups.has(g.id));
    const totalDuplicates = selectedGroups.reduce((sum, g) => sum + g.songs.length - 1, 0);
    const totalMasters = selectedGroups.length;

    const confirmed = window.confirm(
      t("songLibrary.duplicateReview.batchDeleteConfirm", { 
        count: totalDuplicates, 
        masters: totalMasters 
      })
    );

    if (!confirmed) return;

    try {
      setIsProcessing(true);
      let successCount = 0;

      for (const group of selectedGroups) {
        const masterSongId = group.suggestedMaster!;
        const deleteIds = group.songs.filter(s => s.id !== masterSongId).map(s => s.id);

        // Update set_songs references
        for (const deleteId of deleteIds) {
          await supabase
            .from("set_songs")
            .update({ song_id: masterSongId })
            .eq("song_id", deleteId);
        }

        // Delete duplicate songs
        const { error } = await supabase
          .from("songs")
          .delete()
          .in("id", deleteIds);

        if (!error) {
          successCount += deleteIds.length;
        }
      }

      toast.success(t("songLibrary.duplicateReview.batchDeleteSuccess", { count: successCount }));
      clearProgress();
      onMergeComplete();
    } catch (error) {
      console.error("Batch delete error:", error);
      toast.error(t("songLibrary.duplicateReview.mergeError"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedToDelete.size === 0) {
      toast.error(t("songLibrary.duplicateReview.noSelection"));
      return;
    }

    const currentGroup = duplicateGroups[currentGroupIndex];
    const remainingSongs = currentGroup.songs.filter((s) => !selectedToDelete.has(s.id));
    
    if (remainingSongs.length === 0) {
      toast.error(t("songLibrary.duplicateReview.mustKeepOne"));
      return;
    }

    setShowConfirmDialog(true);
  };

  const executeDelete = async () => {
    try {
      setIsProcessing(true);
      const currentGroup = duplicateGroups[currentGroupIndex];
      const remainingSongs = currentGroup.songs.filter((s) => !selectedToDelete.has(s.id));
      const masterSongId = remainingSongs[0].id;
      const deleteIds = Array.from(selectedToDelete);

      for (const deleteId of deleteIds) {
        await supabase
          .from("set_songs")
          .update({ song_id: masterSongId })
          .eq("song_id", deleteId);
      }

      const { error } = await supabase
        .from("songs")
        .delete()
        .in("id", deleteIds);

      if (error) throw error;

      const newProcessed = new Set(processedGroups);
      newProcessed.add(currentGroup.id);
      setProcessedGroups(newProcessed);
      saveProgressToLocalStorage(newProcessed, skippedGroups, currentGroupIndex);

      toast.success(t("songLibrary.duplicateReview.deleteSuccess", { count: deleteIds.length }));

      moveToNextGroup(newProcessed);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("songLibrary.duplicateReview.mergeError"));
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
      setSelectedToDelete(new Set());
    }
  };

  const handleSkipGroup = () => {
    const currentGroup = duplicateGroups[currentGroupIndex];
    const newSkipped = new Set(skippedGroups);
    newSkipped.add(currentGroup.id);
    setSkippedGroups(newSkipped);
    setSelectedToDelete(new Set());
    saveProgressToLocalStorage(processedGroups, newSkipped, currentGroupIndex);
    
    moveToNextGroup(processedGroups, newSkipped);
  };

  const moveToNextGroup = (processed: Set<string> = processedGroups, skipped: Set<string> = skippedGroups) => {
    if (currentGroupIndex < duplicateGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else {
      clearProgress();
      onMergeComplete();
    }
  };

  const handlePrevGroup = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
      setSelectedToDelete(new Set());
    }
  };

  const handleNextGroup = () => {
    if (currentGroupIndex < duplicateGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
      setSelectedToDelete(new Set());
    }
  };

  const handleDialogClose = () => {
    saveProgressToLocalStorage(processedGroups, skippedGroups, currentGroupIndex);
    onClose();
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
      case "created_at":
      case "updated_at":
        return format(new Date(value), "yyyy-MM-dd");
      case "tags":
        if (!value) return <span className="text-muted-foreground">-</span>;
        const tags = value.split(",").map((tag: string) => tag.trim());
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">+{tags.length - 2}</Badge>
            )}
          </div>
        );
      default:
        return String(value);
    }
  };

  const renderComparisonRow = (field: string, label: string) => {
    const currentGroup = duplicateGroups[currentGroupIndex];
    const values = currentGroup.songs.map((song) => song[field]);
    const allSame = values.every((v) => v === values[0]);

    return (
      <tr key={field} className={!allSame ? "bg-muted/50" : ""}>
        <td className="border p-2 font-medium text-sm">{label}</td>
        {currentGroup.songs.map((song, idx) => {
          const isDifferent = !allSame;
          const isMaster = song.id === currentGroup.suggestedMaster;
          
          return (
            <td
              key={idx}
              className={cn(
                "border p-2 text-sm",
                isDifferent && "bg-yellow-100 dark:bg-yellow-900/20",
                isMaster && "bg-green-50 dark:bg-green-950/20"
              )}
            >
              <div className="flex items-center gap-2">
                {isMaster && field === "title" && (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                )}
                <div className="truncate max-w-[200px]">
                  {formatFieldValue(song[field], field, song)}
                </div>
              </div>
            </td>
          );
        })}
      </tr>
    );
  };

  if (duplicateGroups.length === 0) {
    return null;
  }

  const currentGroup = duplicateGroups[currentGroupIndex];
  const remainingSongsCount = currentGroup.songs.filter((s) => !selectedToDelete.has(s.id)).length;
  const progressRemaining = duplicateGroups.length - processedGroups.size - skippedGroups.size;

  const highDuplicateCount = highConfidenceGroups.reduce((sum, g) => sum + g.songs.length - 1, 0);
  const mediumDuplicateCount = mediumConfidenceGroups.reduce((sum, g) => sum + g.songs.length - 1, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("songLibrary.duplicateReview.title")}
            </DialogTitle>
            <DialogDescription>
              {t("songLibrary.duplicateReview.summary")}
            </DialogDescription>
          </DialogHeader>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">
                {t("songLibrary.duplicateReview.totalScanned", { count: songs.length })}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                🔴 {t("songLibrary.duplicateReview.highConfidenceGroups", { 
                  count: highConfidenceGroups.length, 
                  songs: highDuplicateCount 
                })}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                🟡 {t("songLibrary.duplicateReview.mediumConfidenceGroups", { 
                  count: mediumConfidenceGroups.length, 
                  songs: mediumDuplicateCount 
                })}
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "high" | "medium")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="high">
                {t("songLibrary.duplicateReview.highConfidence")} ({highConfidenceGroups.length})
              </TabsTrigger>
              <TabsTrigger value="medium">
                {t("songLibrary.duplicateReview.mediumConfidence")} ({mediumConfidenceGroups.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="high" className="space-y-4">
              {highConfidenceGroups.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>높은 신뢰도 중복이 없습니다</AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert className="border-green-500">
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      {t("songLibrary.duplicateReview.quickAction")} - 
                      자동으로 추천된 마스터 곡을 유지하고 나머지를 삭제합니다.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {highConfidenceGroups.map((group, idx) => (
                      <div
                        key={group.id}
                        className={cn(
                          "border rounded-lg p-4 space-y-3",
                          batchSelectedGroups.has(group.id) && "border-primary bg-primary/5"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={batchSelectedGroups.has(group.id)}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(batchSelectedGroups);
                              if (checked) {
                                newSet.add(group.id);
                              } else {
                                newSet.delete(group.id);
                              }
                              setBatchSelectedGroups(newSet);
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="text-xs">
                                {group.confidence}% {t("songLibrary.duplicateReview.similarity")}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {t(`songLibrary.duplicateReview.matchTypes.${group.matchType}` as any)}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {group.songs.map((song) => {
                                const isMaster = song.id === group.suggestedMaster;
                                const usage = songUsages.get(song.id) || 0;
                                
                                return (
                                  <div
                                    key={song.id}
                                    className={cn(
                                      "p-3 rounded border text-sm",
                                      isMaster 
                                        ? "border-green-500 bg-green-50 dark:bg-green-950/20" 
                                        : "border-muted bg-muted/30"
                                    )}
                                  >
                                    <div className="flex items-start gap-2">
                                      {isMaster && (
                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                                      )}
                                      <div className="flex-1 space-y-1">
                                        <div className="font-medium">{song.title}</div>
                                        {song.artist && (
                                          <div className="text-xs text-muted-foreground">{song.artist}</div>
                                        )}
                                        <div className="flex items-center gap-2 text-xs">
                                          {song.youtube_url && (
                                            <Badge variant="outline" className="text-xs">YouTube ✓</Badge>
                                          )}
                                          {song.score_file_url && (
                                            <Badge variant="outline" className="text-xs">Score ✓</Badge>
                                          )}
                                          <Badge variant="outline" className="text-xs">
                                            {usage > 0 ? `${usage}회 사용` : "미사용"}
                                          </Badge>
                                        </div>
                                        {isMaster && (
                                          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                            {t("songLibrary.duplicateReview.recommendedKeep")}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <div className="text-sm text-muted-foreground">
                      {batchSelectedGroups.size}개 그룹 선택됨
                    </div>
                    <Button
                      onClick={handleBatchDelete}
                      disabled={isProcessing || batchSelectedGroups.size === 0}
                      variant="destructive"
                    >
                      {isProcessing 
                        ? t("songLibrary.duplicateReview.processing")
                        : t("songLibrary.duplicateReview.batchDelete") + ` (${highDuplicateCount}개)`
                      }
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="medium" className="space-y-4">
              {mediumConfidenceGroups.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>중간 신뢰도 중복이 없습니다</AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert className="border-yellow-500">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      중간 신뢰도 그룹은 수동으로 하나씩 검토해주세요.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handlePrevGroup} 
                        disabled={currentGroupIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        {t("songLibrary.duplicateReview.groupOf", {
                          current: currentGroupIndex + 1,
                          total: duplicateGroups.length,
                        })} - {t("songLibrary.duplicateReview.similarity", { 
                          percent: Math.round(currentGroup.confidence) 
                        })}
                      </div>
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

                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        {t("songLibrary.duplicateReview.compareSongs")}
                      </h3>
                      
                      <div className="overflow-x-auto">
                        <table className="text-sm border-collapse table-fixed w-full">
                          <thead>
                            <tr className="bg-muted">
                              <th className="border p-2 text-left w-[140px]">Field</th>
                              {currentGroup.songs.map((song, idx) => (
                                <th key={idx} className="border p-2 text-left w-[280px]">
                                  Song {idx + 1}
                                  {song.id === currentGroup.suggestedMaster && (
                                    <Badge variant="default" className="ml-2 text-xs">
                                      {t("songLibrary.duplicateReview.suggested")}
                                    </Badge>
                                  )}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {renderComparisonRow("title", "Title")}
                            {renderComparisonRow("artist", "Artist")}
                            {renderComparisonRow("subtitle", "Subtitle")}
                            {renderComparisonRow("category", "Category")}
                            {renderComparisonRow("language", "Language")}
                            {renderComparisonRow("default_key", "Key")}
                            {renderComparisonRow("tags", "Tags")}
                            {renderComparisonRow("youtube_url", "YouTube")}
                            {renderComparisonRow("score_file_url", "Score")}
                            <tr className="bg-muted/30">
                              <td className="border p-3 font-semibold text-destructive">
                                {t("songLibrary.duplicateReview.selectToDelete")}
                              </td>
                              {currentGroup.songs.map((song, idx) => {
                                const usage = songUsages.get(song.id) || 0;
                                return (
                                  <td key={idx} className="border p-3">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-center">
                                        <Checkbox
                                          id={`delete-${song.id}`}
                                          checked={selectedToDelete.has(song.id)}
                                          onCheckedChange={(checked) => {
                                            const newSet = new Set(selectedToDelete);
                                            if (checked) {
                                              newSet.add(song.id);
                                            } else {
                                              newSet.delete(song.id);
                                            }
                                            setSelectedToDelete(newSet);
                                          }}
                                          className="h-5 w-5"
                                        />
                                      </div>
                                      <Label 
                                        htmlFor={`delete-${song.id}`} 
                                        className="text-center block cursor-pointer text-xs font-medium text-destructive"
                                      >
                                        {t("songLibrary.duplicateReview.deleteThisSong")}
                                      </Label>
                                      <Badge variant="outline" className="w-full justify-center text-xs">
                                        {usage > 0
                                          ? `${t("songLibrary.duplicateReview.usedInSets")}: ${usage}`
                                          : t("songLibrary.duplicateReview.never")}
                                      </Badge>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {remainingSongsCount === 1 && selectedToDelete.size > 0 && (
                        <Alert variant="default" className="border-yellow-500 mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Warning: Only 1 song will remain in this group after deletion.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={handleSkipGroup} disabled={isProcessing}>
                      {t("songLibrary.duplicateReview.skipThisGroup")}
                    </Button>
                    <Button
                      onClick={handleDeleteSelected}
                      disabled={isProcessing || selectedToDelete.size === 0}
                      variant="destructive"
                    >
                      {isProcessing
                        ? t("songLibrary.duplicateReview.processing")
                        : t("songLibrary.duplicateReview.deleteSelected", { count: selectedToDelete.size })}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </TabsContent>
          </Tabs>
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
              {t("songLibrary.duplicateReview.warningMessage", { count: selectedToDelete.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
