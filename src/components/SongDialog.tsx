import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Youtube, Loader2, Trash2, FileText, Plus, GripVertical, Sparkles, Calendar, Link as LinkIcon, Download, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { TagSelector } from "@/components/TagSelector";
import { ArtistSelector } from "@/components/ArtistSelector";
import { YouTubeSearchBar } from "@/components/YouTubeSearchBar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AIEnrichmentDialog } from "@/components/AIEnrichmentDialog";
import { SongUsageHistoryDialog } from "@/components/SongUsageHistoryDialog";
import { useSongUsage } from "@/hooks/useSongUsage";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";

const MUSICAL_KEYS = [
  "C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"
];

interface SongDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: any;
  onClose: () => void;
}

export const SongDialog = ({ open, onOpenChange, song, onClose }: SongDialogProps) => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [usageHistoryExpanded, setUsageHistoryExpanded] = useState(false);
  const { data: usageData } = useSongUsage(song?.id || "");
  const [scoreVariations, setScoreVariations] = useState<Array<{
    id?: string;
    key: string;
    files: Array<{ url: string; page: number; id?: string }>;
  }>>([]);
  const [uploadingVariationIndex, setUploadingVariationIndex] = useState<number | null>(null);
  const [youtubeLinks, setYoutubeLinks] = useState<Array<{ id?: string; label: string; url: string }>>([]);
  const [searchingYoutubeIndex, setSearchingYoutubeIndex] = useState<number | null>(null);
  const [scoreUrlInput, setScoreUrlInput] = useState("");
  const [downloadingScore, setDownloadingScore] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    artist: "",
    language: "",
    default_key: "",
    category: "",
    tags: [] as string[],
    youtube_url: "",
    score_file_url: "",
    notes: "",
    interpretation: "",
    lyrics: "",
  });

  useEffect(() => {
    if (song) {
      setFormData({
        title: song.title || "",
        subtitle: song.subtitle || "",
        artist: song.artist || "",
        language: song.language || "",
        default_key: song.default_key || "",
        category: song.category || "",
        tags: song.tags ? song.tags.split(",").map((t: string) => t.trim()) : [],
        youtube_url: song.youtube_url || "",
        score_file_url: song.score_file_url || "",
        notes: song.notes || "",
        interpretation: song.interpretation || "",
        lyrics: song.lyrics || "",
      });
      
      // Load score variations and youtube links
      if (song.id) {
        loadScoreVariations(song.id);
        loadYoutubeLinks(song.id);
      }
    } else {
      setFormData({
        title: "",
        subtitle: "",
        artist: "",
        language: "",
        default_key: "",
        category: "",
        tags: [],
        youtube_url: "",
        score_file_url: "",
        notes: "",
        interpretation: "",
        lyrics: "",
      });
      setScoreVariations([{ key: "", files: [] }]);
      setYoutubeLinks([{ label: "", url: "" }]);
    }
  }, [song, open]);

  // Sync formData.youtube_url with first youtubeLink for backward compatibility
  useEffect(() => {
    const firstUrl = youtubeLinks[0]?.url || "";
    if (formData.youtube_url !== firstUrl) {
      setFormData(prev => ({ ...prev, youtube_url: firstUrl }));
    }
  }, [youtubeLinks]);

  const loadYoutubeLinks = async (songId: string) => {
    try {
      const { data, error } = await supabase
        .from("song_youtube_links")
        .select("*")
        .eq("song_id", songId)
        .order("position", { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setYoutubeLinks(data.map(link => ({ id: link.id, label: link.label, url: link.url })));
      } else {
        // Migrate from old youtube_url field
        setYoutubeLinks(song.youtube_url ? [{ label: "YouTube", url: song.youtube_url }] : [{ label: "", url: "" }]);
      }
    } catch (error) {
      console.error("Error loading youtube links:", error);
      setYoutubeLinks([{ label: "", url: "" }]);
    }
  };

  const loadScoreVariations = async (songId: string) => {
    try {
      const { data, error } = await supabase
        .from("song_scores")
        .select("*")
        .eq("song_id", songId)
        .order("key", { ascending: true })
        .order("page_number", { ascending: true });

      if (error) throw error;

      // If new table has data, use it
      if (data && data.length > 0) {
        const grouped: Record<string, Array<{ url: string; page: number; id: string }>> = {};
        data?.forEach((score) => {
          if (!grouped[score.key]) {
            grouped[score.key] = [];
          }
          grouped[score.key].push({
            url: score.file_url,
            page: score.page_number,
            id: score.id,
          });
        });

        const variations = Object.entries(grouped).map(([key, files]) => ({
          key,
          files: files.sort((a, b) => a.page - b.page),
        }));

        setScoreVariations(variations);
      } else {
        // No data in new table - check old field for backward compatibility
        if (song.score_file_url) {
          setScoreVariations([{
            key: song.default_key || "",
            files: [{ url: song.score_file_url, page: 1 }]
          }]);
        } else {
          // No scores at all - initialize with empty first variation
          setScoreVariations([{ key: song.default_key || "", files: [] }]);
        }
      }
    } catch (error) {
      console.error("Error loading score variations:", error);
      setScoreVariations([{ key: song.default_key || "", files: [] }]);
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [showYouTubeSearch, setShowYouTubeSearch] = useState(false);
  const [aiEnriching, setAiEnriching] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("scores")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("scores")
        .getPublicUrl(filePath);

      setFormData({ ...formData, score_file_url: publicUrl });
      toast.success(t("songDialog.fileUploaded"));
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDropOnVariation = async (e: React.DragEvent<HTMLDivElement>, variationIndex: number) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [".pdf", ".jpg", ".jpeg", ".png"];
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      toast.error(t("songDialog.invalidFileType"));
      return;
    }

    await uploadScoreFile(file, variationIndex);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error(t("songDialog.titleRequired"));
      return;
    }

    const hasValidYoutubeLink = youtubeLinks.some(link => link.url.trim());
    if (!hasValidYoutubeLink) {
      toast.error(t("songDialog.youtubeRequired"));
      return;
    }

    if (scoreVariations.length === 0 || (scoreVariations.length === 1 && scoreVariations[0].files.length === 0)) {
      toast.error(t("songDialog.scoreRequired"));
      return;
    }

    setLoading(true);
    try {
      const normalizedCategory = formData.category === "uncategorized" ? null : formData.category;
      
      const data: any = {
        ...formData,
        default_key: scoreVariations[0]?.key || "",
        score_file_url: scoreVariations[0]?.files[0]?.url || "",
        category: normalizedCategory || null,
        tags: formData.tags.join(", "),
      };

      let songId: string;

      if (song) {
        const { error } = await supabase
          .from("songs")
          .update(data)
          .eq("id", song.id);
        if (error) throw error;
        songId = song.id;
        toast.success(t("songDialog.songUpdated"));
      } else {
        const { data: newSong, error } = await supabase
          .from("songs")
          .insert([{ ...data, created_by: user?.id }])
          .select()
          .single();
        if (error) throw error;
        songId = newSong.id;
        toast.success(t("songDialog.songAdded"));
      }

      // Save score variations and youtube links
      await saveScoreVariations(songId);
      await saveYoutubeLinks(songId);

      // Invalidate queries for real-time UI update
      await queryClient.invalidateQueries({ queryKey: ["songs"] });

      onClose();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveScoreVariations = async (songId: string) => {
    try {
      // Delete existing scores
      await supabase.from("song_scores").delete().eq("song_id", songId);

      // Insert new scores
      const scoresToInsert = scoreVariations.flatMap((variation, varIndex) =>
        variation.files.map((file, fileIndex) => ({
          song_id: songId,
          key: variation.key,
          file_url: file.url,
          page_number: fileIndex + 1,
          position: varIndex + 1,
        }))
      );

      if (scoresToInsert.length > 0) {
        const { error } = await supabase.from("song_scores").insert(scoresToInsert);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error saving score variations:", error);
      throw error;
    }
  };

  const saveYoutubeLinks = async (songId: string) => {
    try {
      await supabase.from("song_youtube_links").delete().eq("song_id", songId);
      
      const linksToInsert = youtubeLinks
        .filter(link => link.url.trim())
        .map((link, index) => ({
          song_id: songId,
          label: link.label || "YouTube",
          url: link.url,
          position: index + 1,
        }));
      
      if (linksToInsert.length > 0) {
        const { error } = await supabase.from("song_youtube_links").insert(linksToInsert);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error saving youtube links:", error);
    }
  };

  const handleDownloadFromUrl = async (variationIndex: number, url: string) => {
    if (!url.trim()) return;
    setDownloadingScore(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('download-score-image', {
        body: { url }
      });
      
      if (error) throw error;
      
      const updated = [...scoreVariations];
      updated[variationIndex].files.push({
        url: data.url,
        page: updated[variationIndex].files.length + 1,
      });
      setScoreVariations(updated);
      toast.success(t("songDialog.scoreDownloaded"));
    } catch (error: any) {
      toast.error(t("songDialog.scoreDownloadError"));
      console.error("Score download error:", error);
    } finally {
      setDownloadingScore(false);
    }
  };

  const addYoutubeLink = () => setYoutubeLinks([...youtubeLinks, { label: "", url: "" }]);
  const removeYoutubeLink = (index: number) => setYoutubeLinks(youtubeLinks.filter((_, i) => i !== index));
  const updateYoutubeLink = (index: number, field: "label" | "url", value: string) => {
    const updated = [...youtubeLinks];
    updated[index][field] = value;
    setYoutubeLinks(updated);
  };

  const addVariation = () => {
    setScoreVariations([...scoreVariations, { key: "", files: [] }]);
  };

  const removeVariation = (index: number) => {
    setScoreVariations(scoreVariations.filter((_, i) => i !== index));
  };

  const updateVariationKey = (index: number, key: string) => {
    const updated = [...scoreVariations];
    updated[index].key = key;
    setScoreVariations(updated);
    
    // Sync first variation with default_key
    if (index === 0) {
      setFormData({ ...formData, default_key: key });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setScoreVariations((items) => {
        const oldIndex = items.findIndex((_, i) => `variation-${i}` === active.id);
        const newIndex = items.findIndex((_, i) => `variation-${i}` === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        
        // Update formData.default_key to reflect new first variation
        if (reordered.length > 0) {
          setFormData({ ...formData, default_key: reordered[0].key });
        }
        
        return reordered;
      });
    }
  };

  const uploadScoreFile = async (file: File, variationIndex: number) => {
    try {
      setUploadingVariationIndex(variationIndex);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("scores")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("scores").getPublicUrl(filePath);

      // Add file to variation
      const updated = [...scoreVariations];
      updated[variationIndex].files.push({
        url: publicUrl,
        page: updated[variationIndex].files.length + 1,
      });
      setScoreVariations(updated);

      toast.success(t("songDialog.fileUploaded"));
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setUploadingVariationIndex(null);
    }
  };

  const removeScoreFile = (variationIndex: number, fileIndex: number) => {
    const updated = [...scoreVariations];
    updated[variationIndex].files.splice(fileIndex, 1);
    // Renumber pages
    updated[variationIndex].files = updated[variationIndex].files.map((f, i) => ({
      ...f,
      page: i + 1,
    }));
    setScoreVariations(updated);
  };

  const handleAIEnrich = async () => {
    if (!formData.title.trim()) {
      toast.error(t('aiEnrich.titleRequired'));
      return;
    }

    setAiEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-song', {
        body: {
          title: formData.title,
          artist: formData.artist,
          language: formData.language
        }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error(t('aiEnrich.rateLimitError'));
        } else if (data.error.includes('Payment required')) {
          toast.error(t('aiEnrich.paymentRequiredError'));
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (!data.suggestions) {
        toast.error(t('aiEnrich.noSuggestionsFound'));
        return;
      }

      setAiSuggestions(data.suggestions);
      setShowAIDialog(true);
    } catch (error: any) {
      console.error('AI enrichment error:', error);
      toast.error(t('aiEnrich.enrichError'));
    } finally {
      setAiEnriching(false);
    }
  };

  const handleApplySuggestions = (selectedFields: any) => {
    const updates: any = {};
    
    if (selectedFields.lyrics) updates.lyrics = selectedFields.lyrics;
    if (selectedFields.default_key) {
      updates.default_key = selectedFields.default_key;
      // Also update first score variation key
      if (scoreVariations.length > 0) {
        const updated = [...scoreVariations];
        updated[0].key = selectedFields.default_key;
        setScoreVariations(updated);
      }
    }
    if (selectedFields.category) updates.category = selectedFields.category;
    if (selectedFields.tags && selectedFields.tags.length > 0) {
      // Merge with existing tags
      const existingTags = new Set(formData.tags);
      selectedFields.tags.forEach((tag: string) => existingTags.add(tag));
      updates.tags = Array.from(existingTags);
    }

    setFormData(prev => ({ ...prev, ...updates }));
    toast.success(t('aiEnrich.appliedSuccess'));
  };

  // Sortable variation item component
  interface ScoreVariationItemProps {
    variation: { key: string; files: Array<{ url: string; page: number; id?: string }> };
    index: number;
    uploadingVariationIndex: number | null;
    onKeyChange: (index: number, key: string) => void;
    onFileUpload: (file: File, index: number) => void;
    onFileRemove: (variationIndex: number, fileIndex: number) => void;
    onRemoveVariation: (index: number) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    isDragging: boolean;
    onDownloadFromUrl: (index: number, url: string) => void;
    downloadingScore: boolean;
  }

  const ScoreVariationItem = ({ 
    variation, 
    index, 
    uploadingVariationIndex,
    onKeyChange,
    onFileUpload,
    onFileRemove,
    onRemoveVariation,
    onDrop,
    onDragOver,
    onDragLeave,
    isDragging,
    onDownloadFromUrl,
    downloadingScore
  }: ScoreVariationItemProps) => {
    const [urlInput, setUrlInput] = useState("");
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
      id: `variation-${index}` 
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const handleDownload = () => {
      if (urlInput.trim()) {
        onDownloadFromUrl(index, urlInput);
        setUrlInput("");
      }
    };

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes}
        className="border border-border rounded-lg p-3 mb-3"
        onDrop={(e) => onDrop(e, index)}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Key Selector */}
          <Select 
            value={variation.key} 
            onValueChange={(value) => onKeyChange(index, value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('songDialog.selectKey') || '키 선택'} />
            </SelectTrigger>
            <SelectContent>
              {MUSICAL_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Hidden file input - supports multiple files */}
          <Input
            type="file"
            multiple
            onChange={async (e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                // Process all files in parallel for speed
                await Promise.all(
                  Array.from(files).map(file => onFileUpload(file, index))
                );
              }
            }}
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            id={`file-upload-${index}`}
          />
          
          {/* Upload button with drag-drop visual feedback */}
          <Button
            type="button"
            variant={isDragging ? "default" : "outline"}
            size="sm"
            onClick={() => document.getElementById(`file-upload-${index}`)?.click()}
            disabled={uploadingVariationIndex === index}
            className={isDragging ? "border-2 border-dashed border-primary" : ""}
          >
            {uploadingVariationIndex === index ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                업로드 중
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                악보 업로드
              </>
            )}
          </Button>
          
          {/* Delete variation (only show if index > 0) */}
          {index > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onRemoveVariation(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* URL input for downloading from external link */}
        <div className="flex items-center gap-2 mt-3">
          <Input
            type="url"
            placeholder={t('songDialog.pasteScoreUrl') || "이미지 URL 붙여넣기 (예: https://...)"}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloadingScore || !urlInput.trim()}
          >
            {downloadingScore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4 mr-1" />
                {t('songDialog.downloadFromUrl') || '다운로드'}
              </>
            )}
          </Button>
        </div>
        
        {/* File preview badges */}
        {variation.files.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mt-3">
            {variation.files.map((file, fileIndex) => (
              <Badge key={fileIndex} variant="secondary" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span className="text-xs">Page {fileIndex + 1}</span>
                <button
                  type="button"
                  onClick={() => window.open(file.url, "_blank")}
                  className="ml-1 hover:text-primary transition-colors"
                >
                  👁️
                </button>
                <button
                  type="button"
                  onClick={() => onFileRemove(index, fileIndex)}
                  className="ml-1 hover:text-destructive transition-colors"
                >
                  ✕
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex-1 min-w-0">
              {song ? t("songDialog.editSong") : t("songDialog.addSong")}
            </DialogTitle>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAIEnrich}
                disabled={aiEnriching || !formData.title.trim()}
                className="flex items-center gap-1"
              >
                {aiEnriching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">{t('aiEnrich.loading')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('aiEnrich.buttonLabel')}</span>
                  </>
                )}
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Usage Statistics Section - Only for existing songs */}
        {song && usageData && usageData.usage_count > 0 && (
          <div className="mb-4 p-4 bg-accent/10 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">{t("songUsage.recentUsage")}</h3>
            </div>
            
            <div className="space-y-2 mb-3">
              <p className="text-sm">
                <span className="font-medium">{t("songUsage.totalUsageCount")}:</span>{" "}
                <span className="text-primary">{usageData.usage_count}{t("songUsage.times")}</span>
              </p>
              {usageData.last_used_at && usageData.last_used_service_name && (
                <p className="text-sm text-muted-foreground">
                  {t("songUsage.lastUsedAt")}: {format(new Date(usageData.last_used_at), language === "ko" ? "yyyy-MM-dd" : "MMM d, yyyy", { locale: language === "ko" ? ko : enUS })} · {usageData.last_used_service_name}
                </p>
              )}
            </div>

            {/* Recent usage list */}
            {usageData.usage_history.slice(0, 3).length > 0 && (
              <div className="space-y-2 mb-3">
                {usageData.usage_history.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground pl-3 border-l-2 border-border">
                    {format(new Date(item.date), language === "ko" ? "yyyy-MM-dd" : "MMM d, yyyy")} · {item.service_name}
                    {item.community_name && ` · ${item.community_name}`}
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => setUsageHistoryExpanded(true)}
              className="h-auto p-0 text-primary"
            >
              {t("songUsage.viewAllHistory")} →
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t("songDialog.title")} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="subtitle">{t("songDialog.subtitle")}</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder={t("songDialog.subtitlePlaceholder")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="artist">{t("songDialog.artist")}</Label>
              <ArtistSelector
                value={formData.artist}
                onValueChange={(artist) => setFormData({ ...formData, artist })}
              />
            </div>

            <div>
              <Label htmlFor="language">{t("songDialog.language")}</Label>
              <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KO">{t("songLibrary.languages.ko")}</SelectItem>
                  <SelectItem value="EN">{t("songLibrary.languages.en")}</SelectItem>
                  <SelectItem value="KO/EN">{t("songLibrary.languages.koen")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="category">
              {t("songDialog.category")}
            </Label>
            <Select value={formData.category || "uncategorized"} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t("songLibrary.selectCategory")} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="uncategorized">{t("songLibrary.categories.uncategorized")}</SelectItem>
                <SelectItem value="찬송가">{t("songLibrary.categories.hymn")}</SelectItem>
                <SelectItem value="모던워십 (한국)">{t("songLibrary.categories.modernKorean")}</SelectItem>
                <SelectItem value="모던워십 (서양)">{t("songLibrary.categories.modernWestern")}</SelectItem>
                <SelectItem value="모던워십 (기타)">{t("songLibrary.categories.modernOther")}</SelectItem>
                <SelectItem value="한국 복음성가">{t("songLibrary.categories.koreanGospel")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("songDialog.key")}</Label>
            <p className="text-xs text-muted-foreground mb-2">
              악보 이미지를 키별로 업로드하세요. 순서를 바꾸려면 드래그하세요.
            </p>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={scoreVariations.map((_, i) => `variation-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                {scoreVariations.map((variation, index) => (
                  <ScoreVariationItem
                    key={`variation-${index}`}
                    variation={variation}
                    index={index}
                    uploadingVariationIndex={uploadingVariationIndex}
                    onKeyChange={updateVariationKey}
                    onFileUpload={uploadScoreFile}
                    onFileRemove={removeScoreFile}
                    onRemoveVariation={removeVariation}
                    onDrop={handleDropOnVariation}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    isDragging={isDragging}
                    onDownloadFromUrl={handleDownloadFromUrl}
                    downloadingScore={downloadingScore}
                  />
                ))}
              </SortableContext>
            </DndContext>
            
            {/* Add Variation button */}
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={addVariation}
            >
              <Plus className="h-4 w-4 mr-2" />
              키 변주 추가
            </Button>
          </div>

          <div>
            <Label htmlFor="tags">{t("songDialog.tags")}</Label>
            <TagSelector 
              selectedTags={formData.tags} 
              onTagsChange={(tags) => setFormData({ ...formData, tags })} 
            />
          </div>

          <div>
            <Label>{t("songDialog.youtubeLinks")} <span className="text-destructive">*</span></Label>
            <p className="text-xs text-muted-foreground mb-2">{t("songDialog.youtubeLabelPlaceholder")}</p>
            
            <div className="space-y-3">
              {youtubeLinks.map((link, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder={t("songDialog.youtubeLabel")}
                      value={link.label}
                      onChange={(e) => updateYoutubeLink(index, 'label', e.target.value)}
                      className="w-1/3"
                    />
                    <Input
                      type="url"
                      placeholder="https://youtube.com/..."
                      value={link.url}
                      onChange={(e) => updateYoutubeLink(index, 'url', e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant={searchingYoutubeIndex === index ? "default" : "outline"}
                      size="icon"
                      onClick={() => setSearchingYoutubeIndex(
                        searchingYoutubeIndex === index ? null : index
                      )}
                      title={t("songDialog.searchYouTube")}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    {youtubeLinks.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeYoutubeLink(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {searchingYoutubeIndex === index && (
                    <div className="pl-4 border-l-2 border-primary">
                      <YouTubeSearchBar
                        defaultQuery={formData.title + (formData.artist ? ` ${formData.artist}` : "")}
                        onSelectVideo={(url) => {
                          updateYoutubeLink(index, 'url', url);
                          setSearchingYoutubeIndex(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addYoutubeLink}>
                <Plus className="h-4 w-4 mr-2" />
                {t("songDialog.addYoutubeLink")}
              </Button>
            </div>
          </div>


          <div>
            <Label htmlFor="notes">{t("songDialog.notes")}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="lyrics">{t("songDialog.lyrics")}</Label>
            <Textarea
              id="lyrics"
              value={formData.lyrics}
              onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
              placeholder={t("songDialog.lyricsPlaceholder")}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>

      {aiSuggestions && (
        <AIEnrichmentDialog
          open={showAIDialog}
          onOpenChange={setShowAIDialog}
          suggestions={aiSuggestions}
          currentValues={{
            lyrics: formData.lyrics,
            default_key: formData.default_key,
            category: formData.category,
            tags: formData.tags
          }}
          onApply={handleApplySuggestions}
        />
      )}

      {song && (
        <SongUsageHistoryDialog
          open={usageHistoryExpanded}
          onOpenChange={setUsageHistoryExpanded}
          songId={song.id}
          songTitle={song.title}
        />
      )}
    </Dialog>
  );
};
