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
import { Youtube, Loader2, Trash2, Plus, Sparkles, Calendar, Link as LinkIcon, X, ListMusic, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { TopicSelector } from "@/components/TopicSelector";
import { ArtistSelector } from "@/components/ArtistSelector";
import { YouTubeSearchBar } from "@/components/YouTubeSearchBar";
import { Switch } from "@/components/ui/switch";
import { AIEnrichmentDialog } from "@/components/AIEnrichmentDialog";
import { SongUsageHistoryDialog } from "@/components/SongUsageHistoryDialog";
import { AddToSetDialog } from "@/components/AddToSetDialog";
import { SmartSongFlow, type SmartSongFlowRef } from "@/components/songs/SmartSongFlow";
import { useSongUsage } from "@/hooks/useSongUsage";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";

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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const submittingRef = useRef(false);
  const [setUsageCount, setSetUsageCount] = useState<number>(0);
  const [usageHistoryExpanded, setUsageHistoryExpanded] = useState(false);
  const { data: usageData } = useSongUsage(song?.id || "");
  const [youtubeLinks, setYoutubeLinks] = useState<Array<{ id?: string; label: string; url: string }>>([]);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    artist: "",
    language: "",
    default_key: "",
    topics: [] as string[],
    youtube_url: "",
    notes: "",
    interpretation: "",
    lyrics: "",
    is_private: false,
    tempo: "",
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
        notes: song.notes || "",
        interpretation: song.interpretation || "",
        lyrics: song.lyrics || "",
        is_private: song.is_private || false,
        tempo: song.tempo || "",
      });

      // Load youtube links
      if (song.id) {
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
        notes: "",
        interpretation: "",
        lyrics: "",
        is_private: false,
        tempo: "",
      });
      setYoutubeLinks([{ label: "", url: "" }]);
      setSaveStatus('idle');
    }
  }, [song, open]);

  // Sync formData.youtube_url with first youtubeLink for backward compatibility
  useEffect(() => {
    const firstUrl = youtubeLinks[0]?.url || "";
    setFormData(prev => {
      if (prev.youtube_url === firstUrl) {
        return prev;
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
        setYoutubeLinks(song.youtube_url ? [{ label: "YouTube", url: song.youtube_url }] : [{ label: "", url: "" }]);
      }
    } catch (error) {
      console.error("Error loading youtube links:", error);
      setYoutubeLinks([{ label: "", url: "" }]);
    }
  };

  const [aiEnriching, setAiEnriching] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);

  // State for "Add to Worship Set?" prompt after creating a new song
  const [showAddToSetPrompt, setShowAddToSetPrompt] = useState(false);
  const [newlyCreatedSong, setNewlyCreatedSong] = useState<any>(null);

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
    flowYoutubeLinks: any[]
  ) => {
    if (!user?.id) return;

    let songId: string;

    if (draftSongIdRef.current) {
      const { error } = await supabase
        .from("songs")
        .update({ ...songData, status: "published", draft_step: null })
        .eq("id", draftSongIdRef.current);
      if (error) throw error;
      songId = draftSongIdRef.current;
    } else {
      const { data: newSong, error } = await supabase
        .from("songs")
        .insert([{ ...songData, created_by: user.id, status: "published", draft_step: null }])
        .select()
        .single();
      if (error) throw error;
      songId = newSong.id;
    }

    // Save youtube links
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

    // K-Seed reward (fire-and-forget)
    import("@/lib/rewardsHelper").then(({ creditSongAddedReward }) => {
      creditSongAddedReward(user.id, songId, songData.title);
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

    // Save youtube links
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
    if (!song) {
      return !!(
        formData.title.trim() ||
        formData.artist.trim() ||
        formData.subtitle.trim() ||
        formData.notes.trim() ||
        formData.lyrics.trim() ||
        formData.topics.length > 0 ||
        youtubeLinks.some(link => link.url.trim())
      );
    }
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
      const isSmartFlowMode = !song || song?.status === 'draft';
      if (isSmartFlowMode) {
        setShowCloseConfirm(true);
        return;
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    submittingRef.current = true;
    setLoading(true);
    setSaveStatus('idle');
    try {
      const data: any = {
        ...formData,
        tags: formData.topics.join(", "),
      };
      delete data.topics;
      if (!data.tempo) data.tempo = null;

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

        toast.success(t("songDialog.songAdded"));
        setSaveStatus('saved');

        // Credit K-Seed reward (fire-and-forget)
        if (user?.id) {
          import("@/lib/rewardsHelper").then(({ creditSongAddedReward }) => {
            creditSongAddedReward(user.id, newSong.id, newSong.title);
          });
        }

        setNewlyCreatedSong({
          id: newSong.id,
          title: newSong.title,
          artist: newSong.artist,
          default_key: newSong.default_key,
        });
      }

      // Save youtube links
      await saveYoutubeLinks(songId);

      // Fire-and-forget — don't block UI waiting for refetch
      queryClient.invalidateQueries({ queryKey: ["songs"] });

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

  const addYoutubeLink = () => setYoutubeLinks([...youtubeLinks, { label: "", url: "" }]);
  const removeYoutubeLink = (index: number) => setYoutubeLinks(youtubeLinks.filter((_, i) => i !== index));
  const updateYoutubeLink = (index: number, field: "label" | "url", value: string) => {
    setYoutubeLinks(prev => prev.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    ));
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
    }
    if (selectedFields.tags && selectedFields.tags.length > 0) {
      const existingTopics = new Set(formData.topics);
      selectedFields.tags.forEach((tag: string) => existingTopics.add(tag));
      updates.topics = Array.from(existingTopics);
    }

    setFormData(prev => ({ ...prev, ...updates }));
    toast.success(t('aiEnrich.appliedSuccess'));
  };

  return (
    <>
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
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Subtitle */}
          <div>
            <Label htmlFor="subtitle">{t("songDialog.subtitle")}</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder={t("songDialog.subtitlePlaceholder")}
            />
          </div>

          {/* Private Song Toggle */}
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

          {/* Artist */}
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

          <div data-tutorial="song-lyrics-section">
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

          {/* Language */}
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

          {/* Tempo */}
          <div>
            <Label>{language === "ko" ? "템포" : "Tempo"}</Label>
            <Select value={formData.tempo} onValueChange={(value) => setFormData({ ...formData, tempo: value === "__none__" ? "" : value })}>
              <SelectTrigger>
                <SelectValue placeholder={language === "ko" ? "선택 안 함" : "Not selected"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{language === "ko" ? "선택 안 함" : "Not selected"}</SelectItem>
                <SelectItem value="slow">{language === "ko" ? "느림 (Slow)" : "Slow"}</SelectItem>
                <SelectItem value="mid">{language === "ko" ? "미드 (Mid)" : "Mid"}</SelectItem>
                <SelectItem value="fast">{language === "ko" ? "빠름 (Fast)" : "Fast"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Topics */}
          <div>
            <Label htmlFor="topics">{t("songDialog.topics")}</Label>
            <TopicSelector
              selectedTopics={formData.topics}
              onTopicsChange={(topics) => setFormData({ ...formData, topics })}
              minTopics={2}
              maxTopics={3}
            />
          </div>

          <div className="flex justify-end gap-2" data-tutorial="song-save-button">
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
            setNewlyCreatedSong(null);
            onClose();
          }
        }}
        song={newlyCreatedSong}
        onSuccess={() => {
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
    </Dialog>

    </>
  );
};
