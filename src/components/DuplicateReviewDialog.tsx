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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import { findDuplicates, DuplicateGroup } from "@/lib/duplicateFinder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, XCircle, ExternalLink, Eye, AlertCircle, Pencil } from "lucide-react";
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
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());
  const [processedGroups, setProcessedGroups] = useState<Set<string>>(new Set());
  const [skippedGroups, setSkippedGroups] = useState<Set<string>>(new Set());
  const [songUsages, setSongUsages] = useState<Map<string, number>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [scorePreviewOpen, setScorePreviewOpen] = useState(false);
  const [selectedScoreUrl, setSelectedScoreUrl] = useState<string | null>(null);
  const [selectedSongTitle, setSelectedSongTitle] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSongs, setEditedSongs] = useState<Map<string, any>>(new Map());

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
      const groups = findDuplicates(songs);
      
      if (groups.length === 0) {
        toast.info(t("songLibrary.duplicateReview.noDuplicates"));
        onClose();
        return;
      }

      const savedProgress = loadProgressFromLocalStorage();
      if (savedProgress && savedProgress.duplicateGroups.length === groups.length) {
        toast.info(t("songLibrary.duplicateReview.resuming"));
        setDuplicateGroups(groups);
        setCurrentGroupIndex(savedProgress.currentGroupIndex);
        setProcessedGroups(new Set(savedProgress.processedGroups));
        setSkippedGroups(new Set(savedProgress.skippedGroups));
      } else {
        setDuplicateGroups(groups);
        setCurrentGroupIndex(0);
        setProcessedGroups(new Set());
        setSkippedGroups(new Set());
        clearProgress();
        toast.info(t("songLibrary.duplicateReview.foundGroups", { count: groups.length }));
      }
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
    setIsEditMode(false);
    setEditedSongs(new Map());
    onClose();
  };

  const handleFieldChange = (songId: string, field: string, value: any) => {
    const newEditedSongs = new Map(editedSongs);
    const currentEdits = newEditedSongs.get(songId) || {};
    
    newEditedSongs.set(songId, {
      ...currentEdits,
      [field]: value
    });
    
    setEditedSongs(newEditedSongs);
  };

  const handleSaveAllChanges = async () => {
    try {
      setIsProcessing(true);
      
      const updates = Array.from(editedSongs.entries()).map(([songId, changes]) => {
        if (changes.category === 'uncategorized') {
          changes.category = null;
        }
        
        return supabase
          .from('songs')
          .update(changes)
          .eq('id', songId);
      });
      
      await Promise.all(updates);
      
      toast.success(`${editedSongs.size}개 곡 정보가 저장되었습니다`);
      setEditedSongs(new Map());
      setIsEditMode(false);
      onMergeComplete();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('저장 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  if (duplicateGroups.length === 0) {
    return null;
  }

  const currentGroup = duplicateGroups[currentGroupIndex];
  const remainingSongsCount = currentGroup.songs.filter((s) => !selectedToDelete.has(s.id)).length;
  const progressRemaining = duplicateGroups.length - processedGroups.size - skippedGroups.size;

  const getCategoryTranslation = (category: string | null) => {
    if (!category) return t("songLibrary.categories.uncategorized");
    const categoryMap: Record<string, string> = {
      "찬송가": "hymn",
      "모던워십 (한국)": "modernKorean",
      "모던워십 (서양)": "modernWestern",
      "모던워십 (기타)": "modernOther",
      "한국 복음성가": "koreanGospel",
    };
    const key = categoryMap[category] || "uncategorized";
    return t(`songLibrary.categories.${key}` as any);
  };

  const getLanguageTranslation = (language: string | null) => {
    if (!language) return "-";
    const langKey = language.toLowerCase().replace("/", "");
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
        return <Badge variant="secondary">{getLanguageTranslation(value)}</Badge>;
      case "created_at":
      case "updated_at":
        return format(new Date(value), "yyyy-MM-dd");
      case "tags":
        if (!value) return <span className="text-muted-foreground">-</span>;
        const tags = value.split(",").map((tag: string) => tag.trim());
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        );
      default:
        return String(value);
    }
  };

  const renderComparisonRow = (field: string, label: string) => {
    const values = currentGroup.songs.map((song) => song[field]);
    const allSame = values.every((v) => v === values[0]);

    const fieldStyles: Record<string, string> = {
      title: "max-w-[250px] truncate",
      artist: "max-w-[200px] truncate",
      subtitle: "max-w-[180px] truncate",
      interpretation: "max-w-[200px] truncate",
      notes: "max-w-[200px] truncate",
      default_key: "text-center",
      category: "text-center",
      language: "text-center",
      tags: "max-w-[180px]",
      youtube_url: "text-center",
      score_file_url: "text-center",
    };

    const editableTextFields = ['title', 'artist', 'subtitle', 'interpretation', 'notes', 'default_key', 'youtube_url'];
    const readOnlyFields = ['score_file_url', 'created_at', 'updated_at'];

    const renderEditableCell = (song: any) => {
      const editedValue = editedSongs.get(song.id)?.[field];
      const currentValue = editedValue !== undefined ? editedValue : song[field];
      const hasEdits = editedSongs.get(song.id)?.[field] !== undefined;

      if (field === 'category') {
        return (
          <Select 
            value={currentValue || 'uncategorized'} 
            onValueChange={(value) => handleFieldChange(song.id, 'category', value)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uncategorized">Uncategorized</SelectItem>
              <SelectItem value="찬송가">찬송가</SelectItem>
              <SelectItem value="모던워십 (한국)">모던워십 (한국)</SelectItem>
              <SelectItem value="모던워십 (서양)">모던워십 (서양)</SelectItem>
              <SelectItem value="모던워십 (기타)">모던워십 (기타)</SelectItem>
              <SelectItem value="한국 복음성가">한국 복음성가</SelectItem>
            </SelectContent>
          </Select>
        );
      }

      if (field === 'language') {
        return (
          <Select 
            value={currentValue || ''} 
            onValueChange={(value) => handleFieldChange(song.id, 'language', value)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KO">한국어</SelectItem>
              <SelectItem value="EN">English</SelectItem>
              <SelectItem value="KO/EN">한국어/English</SelectItem>
            </SelectContent>
          </Select>
        );
      }

      if (editableTextFields.includes(field)) {
        return (
          <Input 
            value={currentValue || ''} 
            onChange={(e) => handleFieldChange(song.id, field, e.target.value)}
            className={cn("h-8 text-sm", hasEdits && "border-blue-500 border-2")}
            placeholder={field === 'tags' ? "worship, praise" : undefined}
          />
        );
      }

      return formatFieldValue(song[field], field, song);
    };

    return (
      <tr key={field} className={!allSame ? "bg-muted/50" : ""}>
        <td className="border p-2 font-medium">{label}</td>
        {currentGroup.songs.map((song, idx) => {
          const isDifferent = !allSame;
          const hasEdits = editedSongs.get(song.id)?.[field] !== undefined;
          
          return (
            <td
              key={idx}
              className={cn(
                "border p-2",
                isDifferent && "bg-yellow-100 dark:bg-yellow-900/20",
                hasEdits && "bg-blue-50 dark:bg-blue-950/20",
                !isEditMode && fieldStyles[field] || ""
              )}
            >
              {isEditMode && !readOnlyFields.includes(field) ? (
                renderEditableCell(song)
              ) : (
                <div className={fieldStyles[field] || ""}>
                  {formatFieldValue(song[field], field, song)}
                </div>
              )}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("songLibrary.duplicateReview.title")}</DialogTitle>
            <DialogDescription>
              {t("songLibrary.duplicateReview.groupOf", {
                current: currentGroupIndex + 1,
                total: duplicateGroups.length,
              })}{" "}
              - {t("songLibrary.duplicateReview.similarity", { percent: Math.round(currentGroup.confidence * 100) })}
            </DialogDescription>
            <div className="text-sm text-muted-foreground mt-2">
              {t("songLibrary.duplicateReview.progressStatus", {
                processed: processedGroups.size,
                skipped: skippedGroups.size,
                remaining: progressRemaining,
              })}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrevGroup} disabled={currentGroupIndex === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{t("songLibrary.duplicateReview.compareSongs")}</h3>
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsEditMode(!isEditMode);
                    if (isEditMode) {
                      setEditedSongs(new Map());
                    }
                  }}
                  disabled={isProcessing}
                >
                  {isEditMode ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      View Mode
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Mode
                    </>
                  )}
                </Button>
              </div>
              {isEditMode && (
                <Alert>
                  <Pencil className="h-4 w-4" />
                  <AlertDescription>
                    에디터 모드: 모든 필드를 수정할 수 있습니다. 수정 완료 후 "Save All Changes" 버튼을 클릭하세요.
                  </AlertDescription>
                </Alert>
              )}
              <div className="overflow-x-auto">
                <table className="text-sm border-collapse table-fixed">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-2 text-left w-[140px]">Field</th>
                      {currentGroup.songs.map((song, idx) => (
                        <th key={idx} className="border p-2 text-left w-[280px]">
                          Song {idx + 1}
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
                    {renderComparisonRow("bpm", "BPM")}
                    {renderComparisonRow("time_signature", "Time Signature")}
                    {renderComparisonRow("energy_level", "Energy Level")}
                    {renderComparisonRow("tags", "Tags")}
                    {renderComparisonRow("youtube_url", "YouTube")}
                    {renderComparisonRow("score_file_url", "Score")}
                    {renderComparisonRow("interpretation", "Interpretation")}
                    {renderComparisonRow("notes", "Notes")}
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
            {isEditMode ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditMode(false);
                    setEditedSongs(new Map());
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveAllChanges} 
                  disabled={isProcessing || editedSongs.size === 0}
                >
                  {isProcessing ? "Saving..." : `Save All Changes (${editedSongs.size})`}
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
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
