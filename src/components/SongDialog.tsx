import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Youtube, Loader2, Trash2, FileText, Plus, GripVertical, Sparkles, Calendar, Link as LinkIcon, Download, X, ListMusic, Lock, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";
import { useTutorial } from "@/components/tutorial/useTutorial";
import { SONG_ADD_STEPS } from "@/components/tutorial/tutorialSteps";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { TopicSelector } from "@/components/TopicSelector";
import { ArtistSelector } from "@/components/ArtistSelector";
import { YouTubeSearchBar } from "@/components/YouTubeSearchBar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AIEnrichmentDialog } from "@/components/AIEnrichmentDialog";
import { SongUsageHistoryDialog } from "@/components/SongUsageHistoryDialog";
import { AddToSetDialog } from "@/components/AddToSetDialog";
import { SmartSongFlow, type SmartSongFlowRef } from "@/components/songs/SmartSongFlow";
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
  
  // Tutorial for editing existing songs
  const songTutorial = useTutorial({ 
    key: "song-edit", 
    steps: SONG_ADD_STEPS, 
    autoStart: false, // Only manual trigger for edit dialog
  });

const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const submittingRef = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [setUsageCount, setSetUsageCount] = useState<number>(0);
  const [usageHistoryExpanded, setUsageHistoryExpanded] = useState(false);
  const { data: usageData } = useSongUsage(song?.id || "");
  const [scoreVariations, setScoreVariations] = useState<Array<{
    id?: string;
    key: string;
    files: Array<{ url: string; page: number; id?: string }>;
  }>>([]);
  const [uploadingVariationIndex, setUploadingVariationIndex] = useState<number | null>(null);
  const [youtubeLinks, setYoutubeLinks] = useState<Array<{ id?: string; label: string; url: string }>>([]);
  
  const [scoreUrlInput, setScoreUrlInput] = useState("");
  const [downloadingScore, setDownloadingScore] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    artist: "",
    language: "",
    default_key: "",
    topics: [] as string[],
    youtube_url: "",
    score_file_url: "",
    notes: "",
    interpretation: "",
    lyrics: "",
    is_private: false,
  });

// Check how many worship sets use this song
  useEffect(() => {
    const checkSetUsage = async () => {
      if (!song?.id) {
        setSetUsageCount(0);
        return;
      }
      const { count } = await supabase
        .from("set_songs")
        .select("*", { count: "exact", head: true })
        .eq("song_id", song.id);
      setSetUsageCount(count || 0);
    };
    checkSetUsage();
  }, [song?.id, open]);

  useEffect(() => {
    if (song) {
      setFormData({
        title: song.title || "",
        subtitle: song.subtitle || "",
        artist: song.artist || "",
        language: song.language || "",
        default_key: song.default_key || "",
        topics: song.tags ? song.tags.split(",").map((t: string) => t.trim()) : [],
        youtube_url: song.youtube_url || "",
        score_file_url: song.score_file_url || "",
        notes: song.notes || "",
        interpretation: song.interpretation || "",
        lyrics: song.lyrics || "",
        is_private: song.is_private || false,
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
        topics: [],
        youtube_url: "",
        score_file_url: "",
        notes: "",
        interpretation: "",
        lyrics: "",
        is_private: false,
      });
      setScoreVariations([{ key: "", files: [] }]);
      setYoutubeLinks([{ label: "", url: "" }]);
      setSaveStatus('idle');
    }
  }, [song, open]);

  // Sync formData.youtube_url with first youtubeLink for backward compatibility
  useEffect(() => {
    const firstUrl = youtubeLinks[0]?.url || "";
    // Use functional update to avoid infinite render loop
    setFormData(prev => {
      if (prev.youtube_url === firstUrl) {
        return prev; // No change → prevent re-render
      }
      return { ...prev, youtube_url: firstUrl };
    });
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
  
  // State for "Add to Worship Set?" prompt after creating a new song
  const [showAddToSetPrompt, setShowAddToSetPrompt] = useState(false);
  const [newlyCreatedSong, setNewlyCreatedSong] = useState<any>(null);
  
  // State for in-app score preview dialog
  const [scorePreviewOpen, setScorePreviewOpen] = useState(false);
  const [previewVariationIndex, setPreviewVariationIndex] = useState(0);
  const [previewFileIndex, setPreviewFileIndex] = useState(0);
  
  // State for close confirmation dialog
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Reset close confirm state when dialog closes to prevent stale overlay
  useEffect(() => {
    if (!open) {
      setShowCloseConfirm(false);
    }
  }, [open]);
  
  // Track draft song ID for SmartSongFlow upsert
  const draftSongIdRef = useRef<string | null>(null);
  const smartFlowRef = useRef<SmartSongFlowRef>(null);
  
  // Reset draft ID when dialog opens/closes or song changes
  useEffect(() => {
    if (!open) draftSongIdRef.current = null;
    if (song?.id && song?.status === 'draft') draftSongIdRef.current = song.id;
  }, [open, song]);

  // SmartSongFlow: final save handler (status = published)
  const handleSmartFlowComplete = useCallback(async (
    songData: any,
    flowScoreVariations: any[],
    flowYoutubeLinks: any[]
  ) => {
    if (!user?.id) return;
    
    let songId: string;
    
    if (draftSongIdRef.current) {
      // Update existing draft → published
      const { error } = await supabase
        .from("songs")
        .update({ ...songData, status: "published", draft_step: null })
        .eq("id", draftSongIdRef.current);
      if (error) throw error;
      songId = draftSongIdRef.current;
    } else {
      // Insert new song as published
      const { data: newSong, error } = await supabase
        .from("songs")
        .insert([{ ...songData, created_by: user.id, status: "published", draft_step: null }])
        .select()
        .single();
      if (error) throw error;
      songId = newSong.id;
    }
    
    // Save scores and youtube links (reuse existing functions)
    // Inline save logic identical to saveScoreVariations/saveYoutubeLinks
    await supabase.from("song_scores").delete().eq("song_id", songId);
    const scoresToInsert = flowScoreVariations.flatMap((variation: any, varIndex: number) =>
      variation.files.map((file: any, fileIndex: number) => ({
        song_id: songId,
        key: variation.key,
        file_url: file.url,
        page_number: fileIndex + 1,
        position: varIndex + 1,
      }))
    );
    if (scoresToInsert.length > 0) {
      await supabase.from("song_scores").insert(scoresToInsert);
    }

    await supabase.from("song_youtube_links").delete().eq("song_id", songId);
    const linksToInsert = flowYoutubeLinks
      .filter((link: any) => link.url.trim())
      .map((link: any, index: number) => ({
        song_id: songId,
        label: link.label || "YouTube",
        url: link.url,
        position: index + 1,
      }));
    if (linksToInsert.length > 0) {
      await supabase.from("song_youtube_links").insert(linksToInsert);
    }

    // K-Seed rewards (fire-and-forget)
    import("@/lib/rewardsHelper").then(({ creditSongAddedReward, creditSongMetadataCompleteReward, isSongMetadataComplete }) => {
      creditSongAddedReward(user.id, songId, songData.title);
      if (isSongMetadataComplete({
        title: songData.title,
        default_key: songData.default_key,
        lyrics: songData.lyrics,
        youtube_url: flowYoutubeLinks[0]?.url || songData.youtube_url,
        language: songData.language,
        score_file_url: flowScoreVariations[0]?.files[0]?.url || songData.score_file_url,
      })) {
        creditSongMetadataCompleteReward(user.id, songId, songData.title);
      }
    });

    toast.success(t("songDialog.songAdded"));
    queryClient.invalidateQueries({ queryKey: ["songs"] });
    
    // Show "Add to Set" prompt
    setNewlyCreatedSong({
      id: songId,
      title: songData.title,
      artist: songData.artist,
      default_key: songData.default_key,
    });
    setShowAddToSetPrompt(true);
  }, [user, queryClient, t]);

  // SmartSongFlow: draft save handler
  const handleSmartFlowDraftSave = useCallback(async (
    songData: any,
    flowScoreVariations: any[],
    flowYoutubeLinks: any[],
    currentStep: number
  ) => {
    if (!user?.id) return;
    
    let songId: string;
    
    if (draftSongIdRef.current) {
      const { error } = await supabase
        .from("songs")
        .update({ ...songData, draft_step: currentStep })
        .eq("id", draftSongIdRef.current);
      if (error) throw error;
      songId = draftSongIdRef.current;
    } else {
      const { data: newSong, error } = await supabase
        .from("songs")
        .insert([{ ...songData, created_by: user.id, draft_step: currentStep }])
        .select()
        .single();
      if (error) throw error;
      songId = newSong.id;
      draftSongIdRef.current = songId;
    }

    // Save scores and youtube links
    await supabase.from("song_scores").delete().eq("song_id", songId);
    const scoresToInsert = flowScoreVariations.flatMap((variation: any, varIndex: number) =>
      variation.files.map((file: any, fileIndex: number) => ({
        song_id: songId,
        key: variation.key,
        file_url: file.url,
        page_number: fileIndex + 1,
        position: varIndex + 1,
      }))
    );
    if (scoresToInsert.length > 0) {
      await supabase.from("song_scores").insert(scoresToInsert);
    }

    await supabase.from("song_youtube_links").delete().eq("song_id", songId);
    const linksToInsert = flowYoutubeLinks
      .filter((link: any) => link.url.trim())
      .map((link: any, index: number) => ({
        song_id: songId,
        label: link.label || "YouTube",
        url: link.url,
        position: index + 1,
      }));
    if (linksToInsert.length > 0) {
      await supabase.from("song_youtube_links").insert(linksToInsert);
    }

    queryClient.invalidateQueries({ queryKey: ["songs"] });
    onClose();
  }, [user, queryClient, onClose]);
  
  // Check if form has unsaved changes
  const hasUnsavedChanges = () => {
    // For new song: check if any field has been filled
    if (!song) {
      return !!(
        formData.title.trim() ||
        formData.artist.trim() ||
        formData.subtitle.trim() ||
        formData.notes.trim() ||
        formData.lyrics.trim() ||
        formData.topics.length > 0 ||
        youtubeLinks.some(link => link.url.trim()) ||
        scoreVariations.some(v => v.files.length > 0)
      );
    }
    // For existing song: check if any field has changed
    const originalTopics = song.tags ? song.tags.split(",").map((t: string) => t.trim()) : [];
    return (
      formData.title !== (song.title || "") ||
      formData.artist !== (song.artist || "") ||
      formData.subtitle !== (song.subtitle || "") ||
      formData.notes !== (song.notes || "") ||
      formData.lyrics !== (song.lyrics || "") ||
      formData.language !== (song.language || "") ||
      formData.is_private !== (song.is_private || false) ||
      JSON.stringify(formData.topics.sort()) !== JSON.stringify(originalTopics.sort())
    );
  };
  
  // Handle dialog close with confirmation
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && open) {
      // SmartSongFlow mode: show close confirmation
      const isSmartFlowMode = !song || song?.status === 'draft';
      if (isSmartFlowMode) {
        setShowCloseConfirm(true);
        return;
      }
      // Edit mode: check unsaved changes
      if (!justSaved && hasUnsavedChanges()) {
        setShowCloseConfirm(true);
        return;
      }
    }
    setJustSaved(false);
    onOpenChange(newOpen);
  };
  
  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    onOpenChange(false);
    onClose();
  };
  const [showAddToSetDialog, setShowAddToSetDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
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
    
    // Synchronous double-submit guard
    if (submittingRef.current) return;
    
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

    submittingRef.current = true;
    setLoading(true);
    setSaveStatus('idle');
    try {
      const data: any = {
        ...formData,
        default_key: scoreVariations[0]?.key || "",
        score_file_url: scoreVariations[0]?.files[0]?.url || "",
        tags: formData.topics.join(", "),
      };
      // Remove topics from data since DB uses 'tags' column
      delete data.topics;

      let songId: string;
      let isNewSong = false;

      if (song) {
        const { error } = await supabase
          .from("songs")
          .update(data)
          .eq("id", song.id);
        if (error) throw error;
        songId = song.id;
        toast.success(t("songDialog.songUpdated"));
        setSaveStatus('saved');
      } else {
        const { data: newSong, error } = await supabase
          .from("songs")
          .insert([{ ...data, created_by: user?.id }])
          .select()
          .single();
        if (error) throw error;
        songId = newSong.id;
        isNewSong = true;
        
        // Immediate feedback — user sees confirmation right after INSERT
        toast.success(t("songDialog.songAdded"));
        setSaveStatus('saved');
        
        // Credit K-Seed reward for adding a new song (fire-and-forget)
        if (user?.id) {
          import("@/lib/rewardsHelper").then(({ creditSongAddedReward, creditSongMetadataCompleteReward, isSongMetadataComplete }) => {
            creditSongAddedReward(user.id, newSong.id, newSong.title);
            
            // Check if metadata is complete for bonus reward
            if (isSongMetadataComplete({
              title: newSong.title,
              default_key: newSong.default_key,
              lyrics: newSong.lyrics,
              youtube_url: youtubeLinks[0]?.url || newSong.youtube_url,
              language: newSong.language,
              score_file_url: scoreVariations[0]?.files[0]?.url || newSong.score_file_url,
            })) {
              creditSongMetadataCompleteReward(user.id, newSong.id, newSong.title);
            }
          });
        }
        
        // Store the newly created song for the "Add to Set" prompt
        setNewlyCreatedSong({
          id: newSong.id,
          title: newSong.title,
          artist: newSong.artist,
          default_key: newSong.default_key,
        });
      }

      // Save score variations and youtube links in parallel
      await Promise.all([
        saveScoreVariations(songId),
        saveYoutubeLinks(songId),
      ]);

      // Fire-and-forget — don't block UI waiting for refetch
      queryClient.invalidateQueries({ queryKey: ["songs"] });

      // For new songs, show the "Add to Worship Set?" prompt
      // For editing, just close
      if (isNewSong) {
        setShowAddToSetPrompt(true);
      } else {
        setJustSaved(true);
        onClose();
      }
    } catch (error: any) {
      toast.error("Error: " + error.message);
      setSaveStatus('idle');
    } finally {
      setLoading(false);
      submittingRef.current = false;
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
    // Use immutable update pattern to prevent mutation issues
    setYoutubeLinks(prev => prev.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ));
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
    if (selectedFields.tags && selectedFields.tags.length > 0) {
      // Merge with existing topics
      const existingTopics = new Set(formData.topics);
      selectedFields.tags.forEach((tag: string) => existingTopics.add(tag));
      updates.topics = Array.from(existingTopics);
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
          {/* Android/tablet fix: use opacity-0 instead of hidden, and capture attribute for camera */}
          <Input
            type="file"
            multiple
            onChange={async (e) => {
              console.log('[Score Upload] File input changed, files:', e.target.files);
              const files = e.target.files;
              if (files && files.length > 0) {
                console.log('[Score Upload] Processing', files.length, 'files');
                // Process all files in parallel for speed
                await Promise.all(
                  Array.from(files).map(file => onFileUpload(file, index))
                );
                // Reset input value to allow re-selecting the same file
                e.target.value = '';
              } else {
                console.log('[Score Upload] No files selected');
              }
            }}
            accept="image/*,.pdf,application/pdf,.jpg,.jpeg,.png,.webp"
            className="absolute opacity-0 w-0 h-0 overflow-hidden"
            style={{ pointerEvents: 'none' }}
            id={`file-upload-${index}`}
          />
          
          {/* Upload button using label for better mobile compatibility */}
          <label htmlFor={`file-upload-${index}`} className="cursor-pointer flex-1">
            <Button
              type="button"
              variant={isDragging ? "default" : "outline"}
              size="sm"
              asChild
              disabled={uploadingVariationIndex === index}
              className={`${isDragging ? "border-2 border-dashed border-primary" : ""} w-full`}
            >
              <span>
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
              </span>
            </Button>
          </label>
          
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

                  {/* URL input for downloading from external link - pl-8 aligns with drag handle */}
                  <div className="flex items-center gap-2 mt-3 pl-8">
          <Input
            type="url"
            placeholder={t('songDialog.pasteScoreUrl') || "이미지 URL 붙여넣기 (예: https://...)"}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1"
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
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
        
        {/* Score file thumbnails - matching YouTube thumbnail style */}
        {variation.files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {variation.files.map((file, fileIndex) => {
              const isImage = file.url.match(/\.(jpg|jpeg|png|webp|gif)$/i);
              return (
                <div key={fileIndex} className="relative group">
                  <div 
                    className="relative w-32 h-24 rounded-lg overflow-hidden cursor-pointer border"
                    onClick={() => {
                      setPreviewVariationIndex(index);
                      setPreviewFileIndex(fileIndex);
                      setScorePreviewOpen(true);
                    }}
                  >
                    {isImage ? (
                      <img 
                        src={file.url}
                        alt={`Page ${fileIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Eye icon overlay - always visible with hover effect */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center group-hover:bg-white transition-colors">
                        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Page number */}
                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      {fileIndex + 1}
                    </div>
                  </div>
                  
                  {/* Delete button - top right */}
                  <button
                    type="button"
                    onClick={() => onFileRemove(index, fileIndex)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className={cn(
          "w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] max-w-lg sm:max-w-2xl",
          !song || song?.status === 'draft' 
            ? "h-[90dvh] max-h-[90dvh] sm:h-[85vh] sm:max-h-[85vh] p-0 overflow-hidden flex flex-col" 
            : "max-h-[70vh] sm:max-h-[85vh] overflow-y-auto"
        )}
        hideCloseButton
        onPointerDownOutside={(e) => {
          if (!song || song?.status === 'draft') {
            e.preventDefault();
            setShowCloseConfirm(true);
          }
        }}
        onInteractOutside={(e) => {
          if (!song || song?.status === 'draft') {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!song || song?.status === 'draft') {
            e.preventDefault();
            setShowCloseConfirm(true);
          }
        }}
        style={{
          paddingTop: !song ? '0' : 'max(1rem, env(safe-area-inset-top, 0px))',
          paddingBottom: !song ? '0' : 'max(1rem, env(safe-area-inset-bottom, 0px))'
        }}
      >
        {/* New song → SmartSongFlow | Edit → existing form */}
        {!song || (song && song.status === 'draft') ? (
          <SmartSongFlow
            ref={smartFlowRef}
            draftSong={song?.status === 'draft' ? song : undefined}
            onComplete={handleSmartFlowComplete}
            onDraftSave={handleSmartFlowDraftSave}
            onClose={() => { onOpenChange(false); onClose(); }}
            onCancel={() => setShowCloseConfirm(true)}
          />
        ) : (
          <>
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex-1 min-w-0">
              {song ? t("songDialog.editSong") : t("songDialog.addSong")}
            </DialogTitle>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={songTutorial.start}>
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleAIEnrich}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      disabled={aiEnriching || !formData.title.trim()}
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
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {language === "ko" ? "AI가 곡 정보(가사, 키, 태그)를 자동으로 채워줍니다" : "AI auto-fills song info (lyrics, key, tags)"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
          <div data-tutorial="song-title-input">
            <Label htmlFor="title">{t("songDialog.title")} *</Label>
            <Label htmlFor="title">{t("songDialog.title")} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* 2. Subtitle */}
          <div>
            <Label htmlFor="subtitle">{t("songDialog.subtitle")}</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder={t("songDialog.subtitlePlaceholder")}
            />
          </div>

          {/* 3. Private Song Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="is_private" className="font-medium">{t("songDialog.privateToggle")}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{t("songDialog.privateDescription")}</p>
              </div>
            </div>
            <Switch
              id="is_private"
              checked={formData.is_private}
              onCheckedChange={(checked) => setFormData({...formData, is_private: checked})}
              disabled={setUsageCount > 0 && !formData.is_private}
            />
          </div>
          {setUsageCount > 0 && !formData.is_private && (
            <p className="text-xs text-amber-600 mt-1">
              {language === "ko" 
                ? `이 곡은 ${setUsageCount}개의 워십세트에서 사용 중이므로 비공개로 전환할 수 없습니다.`
                : `This song is used in ${setUsageCount} worship set(s) and cannot be made private.`}
            </p>
          )}

          {/* 4. Artist */}
          <div className="space-y-1.5">
            <Label htmlFor="artist">{t("songDialog.artist")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("songDialog.artistTooltip")}
            </p>
            <ArtistSelector
              value={formData.artist}
              onValueChange={(artist) => setFormData({ ...formData, artist })}
            />
          </div>

          <div data-tutorial="song-youtube-section">
            <Label>{t("songDialog.youtubeLinks")} <span className="text-destructive">*</span></Label>
            <Label>{t("songDialog.youtubeLinks")} <span className="text-destructive">*</span></Label>
            <p className="text-xs text-muted-foreground mb-2">{t("songDialog.youtubeLabelPlaceholder")}</p>
            
            <div className="space-y-3">
              {youtubeLinks.map((link, index) => {
                const videoId = link.url?.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^#&?]+)/)?.[1];
                
                return (
                  <div key={index} className="p-3 border rounded-lg bg-muted/30 space-y-2">
                    <Input
                      placeholder={t("songDialog.youtubeLabel")}
                      value={link.label}
                      onChange={(e) => updateYoutubeLink(index, 'label', e.target.value)}
                      className="text-sm"
                    />
                    
                    <div className="flex gap-2 items-center">
                      <Input
                        type="url"
                        placeholder="https://youtube.com/..."
                        value={link.url}
                        onChange={(e) => updateYoutubeLink(index, 'url', e.target.value)}
                        className="flex-1 text-sm"
                      />
                      {youtubeLinks.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeYoutubeLink(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {videoId && (
                      <div className="flex justify-center">
                        <div 
                          className="relative w-32 h-24 rounded-lg overflow-hidden cursor-pointer group"
                          onClick={() => window.open(link.url, "_blank")}
                        >
                          <img 
                            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                            alt="YouTube thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center group-hover:bg-white transition-colors">
                              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-red-600 border-b-[6px] border-b-transparent ml-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="pl-3 border-l-2 border-primary/50">
                      <YouTubeSearchBar
                        defaultQuery={formData.title + (formData.artist ? ` ${formData.artist}` : "")}
                        onSelectVideo={(url) => {
                          updateYoutubeLink(index, 'url', url);
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={addYoutubeLink}>
                <Plus className="h-4 w-4 mr-2" />
                {t("songDialog.addYoutubeLink")}
              </Button>
            </div>
          </div>

          <div data-tutorial="song-score-section">
            <Label>{t("songDialog.key")}</Label>
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
            
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={addVariation}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("songDialog.addKeyVariation")}
            </Button>
          </div>

          {/* 7. Lyrics */}
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

          {/* 8. Notes */}
          <div>
            <Label htmlFor="notes">{t("songDialog.notes")}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* 9. Language */}
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

          {/* 10. Topics */}
          <div>
            <Label htmlFor="topics">{t("songDialog.topics")}</Label>
            <TopicSelector 
              selectedTopics={formData.topics} 
              onTopicsChange={(topics) => setFormData({ ...formData, topics })} 
              minTopics={2}
              maxTopics={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading || saveStatus === 'saved'} className={saveStatus === 'saved' ? 'bg-green-600 hover:bg-green-600 text-white' : ''}>
              {loading ? t("common.loading") : saveStatus === 'saved' ? '✓ 저장됨' : t("common.save")}
            </Button>
          </div>
        </form>
        </>
        )}
      </DialogContent>

      {aiSuggestions && (
        <AIEnrichmentDialog
          open={showAIDialog}
          onOpenChange={setShowAIDialog}
          suggestions={aiSuggestions}
          currentValues={{
            lyrics: formData.lyrics,
            default_key: formData.default_key,
            topics: formData.topics
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

      {/* "Add to Worship Set?" prompt after creating a new song */}
      <AlertDialog open={showAddToSetPrompt} onOpenChange={setShowAddToSetPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ListMusic className="w-5 h-5 text-primary" />
              </div>
              <AlertDialogTitle>
                {language === "ko" ? "워십세트에 추가하시겠습니까?" : "Add to Worship Set?"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {language === "ko" 
                ? `"${newlyCreatedSong?.title}" 곡이 라이브러리에 추가되었습니다. 이 곡을 워십세트에 바로 추가하시겠습니까?`
                : `"${newlyCreatedSong?.title}" has been added to the library. Would you like to add it to a worship set now?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowAddToSetPrompt(false);
              setNewlyCreatedSong(null);
              onClose();
            }}>
              {language === "ko" ? "나중에" : "Later"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              // Close AlertDialog first, then open AddToSetDialog in next frame
              setShowAddToSetPrompt(false);
              requestAnimationFrame(() => {
                setShowAddToSetDialog(true);
              });
            }}>
              {language === "ko" ? "워십세트에 추가" : "Add to Set"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AddToSetDialog for the newly created song */}
      <AddToSetDialog
        open={showAddToSetDialog}
        onOpenChange={(open) => {
          setShowAddToSetDialog(open);
          if (!open) {
            // User cancelled - clean up and close SongDialog
            setNewlyCreatedSong(null);
            onClose();
          }
        }}
        song={newlyCreatedSong}
        onSuccess={() => {
          // Success - close dialog first, then clean up
          setShowAddToSetDialog(false);
          setNewlyCreatedSong(null);
          onClose();
        }}
      />
      
      {/* Close confirmation dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ko" ? "창을 닫으시겠습니까?" : "Close this window?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ko" 
                ? "작성 중인 내용이 저장되지 않습니다. 정말 닫으시겠습니까?" 
                : "Your unsaved changes will be lost. Are you sure?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>
              {language === "ko" ? "계속 작성" : "Stay"}
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await smartFlowRef.current?.triggerDraftSave();
                  setShowCloseConfirm(false);
                  onOpenChange(false);
                  onClose();
                } catch (e) {
                  // Error already toasted in handleDraftSave
                }
              }}
            >
              {language === "ko" ? "임시저장" : "Save Draft"}
            </Button>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === "ko" ? "닫기" : "Close"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* In-app Score Preview Dialog */}
      <Dialog open={scorePreviewOpen} onOpenChange={setScorePreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {language === "ko" ? "악보 미리보기" : "Score Preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            {scoreVariations[previewVariationIndex]?.files[previewFileIndex] && (
              <img 
                src={scoreVariations[previewVariationIndex].files[previewFileIndex].url}
                alt="Score preview"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
          {/* Page navigation for multiple pages */}
          {scoreVariations[previewVariationIndex]?.files.length > 1 && (
            <div className="flex items-center justify-center gap-4 py-2 border-t">
              <Button 
                variant="outline" 
                size="sm"
                disabled={previewFileIndex === 0}
                onClick={() => setPreviewFileIndex(prev => prev - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                {previewFileIndex + 1} / {scoreVariations[previewVariationIndex].files.length}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                disabled={previewFileIndex >= scoreVariations[previewVariationIndex].files.length - 1}
                onClick={() => setPreviewFileIndex(prev => prev + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
