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
  Sparkles,
  Edit,
  X,
  Save,
  Copy,
  Youtube,
  FileText,
  Music,
  CheckCircle,
  Loader2,
  Check
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [songActions, setSongActions] = useState<Map<string, 'keep' | 'delete'>>(new Map());
  const [batchSelectedGroups, setBatchSelectedGroups] = useState<Set<string>>(new Set());
  const [processedGroups, setProcessedGroups] = useState<Set<string>>(new Set());
  const [skippedGroups, setSkippedGroups] = useState<Set<string>>(new Set());
  const [songUsages, setSongUsages] = useState<Map<string, number>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [scorePreviewOpen, setScorePreviewOpen] = useState(false);
  const [selectedScoreUrl, setSelectedScoreUrl] = useState<string | null>(null);
  const [selectedSongTitle, setSelectedSongTitle] = useState("");
  const [activeTab, setActiveTab] = useState<"high" | "medium">("high");
  const [editingStates, setEditingStates] = useState<Record<string, boolean>>({});
  const [editedData, setEditedData] = useState<Record<string, any>>({});

  const toggleSongAction = (songId: string) => {
    setSongActions(prev => {
      const newMap = new Map(prev);
      const currentAction = newMap.get(songId) || 'keep';
      newMap.set(songId, currentAction === 'keep' ? 'delete' : 'keep');
      return newMap;
    });
  };

  const getSongAction = (songId: string): 'keep' | 'delete' => {
    return songActions.get(songId) || 'keep';
  };

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

        const high = groups.filter(g => g.confidence >= 85);
        const medium = groups.filter(g => g.confidence < 85);

        setDuplicateGroups(groups);
        setHighConfidenceGroups(high);
        setMediumConfidenceGroups(medium);

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

  const handleProcessGroup = async (groupId: string) => {
    const group = duplicateGroups.find(g => g.id === groupId);
    if (!group) return;

    const deleteIds: string[] = [];
    const keepIds: string[] = [];
    
    group.songs.forEach(song => {
      const action = getSongAction(song.id);
      if (action === 'delete') {
        deleteIds.push(song.id);
      } else {
        keepIds.push(song.id);
      }
    });
    
    // Must keep at least one
    if (keepIds.length === 0) {
      toast.error(t("songLibrary.duplicateReview.mustKeepAtLeastOne"));
      return;
    }
    
    // If all kept, not duplicates
    if (deleteIds.length === 0) {
      toast.success(t("songLibrary.duplicateReview.allKeepNotDuplicate"));
      setDuplicateGroups(groups => groups.filter(g => g.id !== groupId));
      saveProgressToLocalStorage(processedGroups, skippedGroups, currentGroupIndex);
      moveToNextGroup();
      return;
    }

    setIsProcessing(true);
    try {
      const targetKeepId = keepIds[0];
      
      // Update set_songs references
      for (const deleteId of deleteIds) {
        const { error: updateError } = await supabase
          .from("set_songs")
          .update({ song_id: targetKeepId })
          .eq("song_id", deleteId);
        
        if (updateError) throw updateError;
      }
      
      // Delete songs
      const { error: deleteError } = await supabase
        .from("songs")
        .delete()
        .in("id", deleteIds);
      
      if (deleteError) throw deleteError;
      
      toast.success(t("songLibrary.duplicateReview.keepAndDeleteSummary", { 
        keep: keepIds.length, 
        delete: deleteIds.length 
      }));
      
      setDuplicateGroups(groups => groups.filter(g => g.id !== groupId));
      const newProcessed = new Set(processedGroups);
      newProcessed.add(groupId);
      setProcessedGroups(newProcessed);
      saveProgressToLocalStorage(newProcessed, skippedGroups, currentGroupIndex);
      moveToNextGroup();
      onMergeComplete?.();
    } catch (error) {
      console.error("Error processing group:", error);
      toast.error(t("songLibrary.duplicateReview.deleteError"));
    } finally {
      setIsProcessing(false);
    }
  };

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

  const handleSkipGroup = () => {
    const currentGroup = duplicateGroups[currentGroupIndex];
    const newSkipped = new Set(skippedGroups);
    newSkipped.add(currentGroup.id);
    setSkippedGroups(newSkipped);
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
    }
  };

  const handleNextGroup = () => {
    if (currentGroupIndex < duplicateGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    }
  };

  const handleDialogClose = () => {
    saveProgressToLocalStorage(processedGroups, skippedGroups, currentGroupIndex);
    onClose();
  };

  const toggleEdit = (songId: string) => {
    setEditingStates(prev => ({
      ...prev,
      [songId]: !prev[songId]
    }));
    
    if (!editingStates[songId]) {
      const song = duplicateGroups.flatMap(g => g.songs).find(s => s.id === songId);
      if (song) {
        setEditedData(prev => ({
          ...prev,
          [songId]: {
            title: song.title,
            artist: song.artist || '',
            youtube_url: song.youtube_url || '',
            score_file_url: song.score_file_url || '',
            default_key: song.default_key || '',
            language: song.language || '',
            category: song.category || ''
          }
        }));
      }
    }
  };

  const handleFieldChange = (songId: string, field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [songId]: {
        ...prev[songId],
        [field]: value
      }
    }));
  };

  const handleSaveEdit = async (songId: string) => {
    const updates = editedData[songId];
    
    if (!updates.title?.trim()) {
      toast.error(t('songLibrary.duplicateReview.titleRequired'));
      return;
    }

    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('songs')
        .update({
          title: updates.title,
          artist: updates.artist || null,
          youtube_url: updates.youtube_url || null,
          score_file_url: updates.score_file_url || null,
          default_key: updates.default_key || null,
          language: updates.language || null,
          category: updates.category || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', songId);

      if (error) throw error;

      setDuplicateGroups(prev =>
        prev.map(group => ({
          ...group,
          songs: group.songs.map(song =>
            song.id === songId ? { ...song, ...updates } : song
          )
        }))
      );

      toggleEdit(songId);
      toast.success(t('songLibrary.duplicateReview.savedSuccessfully'));
    } catch (error) {
      console.error('Error saving song:', error);
      toast.error(t('songLibrary.duplicateReview.saveFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (duplicateGroups.length === 0) {
    return null;
  }

  const currentGroup = mediumConfidenceGroups[currentGroupIndex];
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
                    {highConfidenceGroups.map((group) => (
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
                            
                            <div className="text-xs text-muted-foreground">
                              {group.songs.length}개 곡
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
              ) : currentGroup ? (
                <>
                  <Alert className="border-yellow-500">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      각 곡을 Keep 또는 Delete로 표시한 후 "Process Group" 버튼을 클릭하세요.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
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
                        {currentGroupIndex + 1} / {mediumConfidenceGroups.length} - 
                        {Math.round(currentGroup.confidence)}% similarity
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextGroup}
                        disabled={currentGroupIndex === mediumConfidenceGroups.length - 1}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>

                    {/* Song Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentGroup.songs.map((song) => {
                        const action = getSongAction(song.id);
                        const usage = songUsages.get(song.id) || 0;
                        const isEditing = editingStates[song.id];
                        const editData = editedData[song.id] || song;

                        return (
                          <div
                            key={song.id}
                            className={`border rounded-lg p-4 space-y-3 bg-card hover:shadow-md transition-all ${
                              action === 'delete' ? 'opacity-60 border-destructive' : 'border-border'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                                  action === 'keep' 
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                    : 'bg-destructive/10 text-destructive'
                                }`}>
                                  {action === 'keep' ? '🟢 ' : '🔴 '}
                                  {action === 'keep' ? t("songLibrary.duplicateReview.keepStatus") : t("songLibrary.duplicateReview.deleteStatus")}
                                </div>
                                {!isEditing ? (
                                  <h4 className="font-semibold text-base truncate flex-1">
                                    {song.title}
                                  </h4>
                                ) : (
                                  <Input
                                    value={editData.title}
                                    onChange={(e) => handleFieldChange(song.id, 'title', e.target.value)}
                                    className="flex-1"
                                    autoFocus
                                  />
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!isEditing ? (
                                  <>
                                    {action === 'keep' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleEdit(song.id)}
                                        className="h-8 px-2"
                                      >
                                        <Edit className="w-3 h-3 mr-1" />
                                        {t("common.edit")}
                                      </Button>
                                    )}
                                    <Button
                                      variant={action === 'delete' ? 'default' : 'ghost'}
                                      size="sm"
                                      onClick={() => toggleSongAction(song.id)}
                                      className={`h-8 px-2 ${action === 'delete' ? '' : 'text-destructive hover:text-destructive'}`}
                                    >
                                      {action === 'keep' ? (
                                        <>
                                          <XCircle className="w-3 h-3 mr-1" />
                                          {t("songLibrary.duplicateReview.deleteSong")}
                                        </>
                                      ) : (
                                        <>
                                          <Check className="w-3 h-3 mr-1" />
                                          {t("songLibrary.duplicateReview.keepSong")}
                                        </>
                                      )}
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSaveEdit(song.id)}
                                      disabled={isProcessing}
                                      className="h-8 px-2"
                                    >
                                      <Save className="w-3 h-3 mr-1" />
                                      {t("common.save")}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleEdit(song.id)}
                                      className="h-8 px-2"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Song details */}
                            {!isEditing && (
                              <div className="space-y-2 text-sm">
                                {song.artist && (
                                  <div className="text-muted-foreground">{song.artist}</div>
                                )}
                                <div className="flex items-center gap-3 flex-wrap">
                                  {song.youtube_url && (
                                    <a
                                      href={song.youtube_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-primary hover:underline"
                                    >
                                      <Youtube className="h-3 w-3" />
                                      Watch
                                    </a>
                                  )}
                                  {song.score_file_url && (
                                    <button
                                      onClick={() => {
                                        setSelectedScoreUrl(song.score_file_url);
                                        setSelectedSongTitle(song.title);
                                        setScorePreviewOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 text-primary hover:underline"
                                    >
                                      <Eye className="h-3 w-3" />
                                      Preview
                                    </button>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {usage > 0 ? `${usage}회 사용` : "미사용"}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={handleSkipGroup}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {t("songLibrary.duplicateReview.skipGroup")}
                      </Button>
                      <Button
                        onClick={() => handleProcessGroup(currentGroup.id)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t("songLibrary.duplicateReview.processing")}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {t("songLibrary.duplicateReview.processGroup")}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : null}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Score Preview Dialog */}
      {scorePreviewOpen && selectedScoreUrl && (
        <ScorePreviewDialog
          open={scorePreviewOpen}
          onOpenChange={setScorePreviewOpen}
          scoreUrl={selectedScoreUrl}
          songTitle={selectedSongTitle}
        />
      )}
    </>
  );
};
