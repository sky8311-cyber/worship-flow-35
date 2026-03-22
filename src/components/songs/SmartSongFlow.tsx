import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { ArtistSelector } from "@/components/ArtistSelector";
import { TopicSelector } from "@/components/TopicSelector";
import { toast } from "sonner";
import { 
  Lock, Loader2, ExternalLink, Check, Search, Plus, 
  Music, FileText, Pen, ChevronRight, ChevronLeft, Save, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 6;

interface ScoreVariation {
  id?: string;
  key: string;
  files: Array<{ url: string; page: number; id?: string }>;
}

interface YouTubeLink {
  id?: string;
  label: string;
  url: string;
}

interface YouTubeResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  url: string;
}

interface SmartSongFlowProps {
  /** Existing draft song to resume, or null for brand new */
  draftSong?: any;
  onComplete: (songData: any, scoreVariations: ScoreVariation[], youtubeLinks: YouTubeLink[]) => Promise<void>;
  onDraftSave: (songData: any, scoreVariations: ScoreVariation[], youtubeLinks: YouTubeLink[], currentStep: number) => Promise<void>;
  onClose: () => void;
  onCancel?: () => void;
}

export interface SmartSongFlowRef {
  triggerDraftSave: () => Promise<void>;
}

export const SmartSongFlow = forwardRef<SmartSongFlowRef, SmartSongFlowProps>(({ draftSong, onComplete, onDraftSave, onClose, onCancel }, ref) => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  
  const isKo = language === "ko";
  
  // Current step (1-indexed)
  const [currentStep, setCurrentStep] = useState(draftSong?.draft_step || 1);
  
  const [loading, setLoading] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);

  // === STEP 1: Basic Info ===
  const [title, setTitle] = useState(draftSong?.title || "");
  const [subtitle, setSubtitle] = useState(draftSong?.subtitle || "");
  const [isPrivate, setIsPrivate] = useState(draftSong?.is_private || false);

  // === STEP 2: YouTube + Artist ===
  const [artist, setArtist] = useState(draftSong?.artist || "");
  const [youtubeResults, setYoutubeResults] = useState<YouTubeResult[]>([]);
  const [selectedYoutubeResult, setSelectedYoutubeResult] = useState<YouTubeResult | null>(null);
  const [youtubeSearching, setYoutubeSearching] = useState(false);
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState("");
  const [showCustomSearch, setShowCustomSearch] = useState(false);
  const artistSectionRef = useRef<HTMLDivElement>(null);
  const [artistHighlight, setArtistHighlight] = useState(false);

  // === STEP 3: Additional YouTube + Scores ===
  const [youtubeLinks, setYoutubeLinks] = useState<YouTubeLink[]>(
    draftSong ? [] : [{ label: "", url: "" }]
  );
  const [scoreVariations, setScoreVariations] = useState<ScoreVariation[]>(
    [{ key: "", files: [] }]
  );
  const [uploadingVariationIndex, setUploadingVariationIndex] = useState<number | null>(null);
  const [scoreUrlInput, setScoreUrlInput] = useState("");
  const [downloadingScore, setDownloadingScore] = useState(false);

  // === STEP 4: Lyrics ===
  const [originalComposer, setOriginalComposer] = useState(draftSong?.original_composer || "");
  const [lyrics, setLyrics] = useState(draftSong?.lyrics || "");
  const [notes, setNotes] = useState(draftSong?.notes || "");
  const [lyricsSearching, setLyricsSearching] = useState(false);
  const [lyricsSource, setLyricsSource] = useState<string | null>(null);
  const [lyricsSearchDone, setLyricsSearchDone] = useState(false);
  const [lyricsCandidates, setLyricsCandidates] = useState<Array<{ url: string; title: string; source: string }>>([]);

  // === STEP 5: Language & Topics ===
  const [songLanguage, setSongLanguage] = useState(draftSong?.language || "");
  const [topics, setTopics] = useState<string[]>(
    draftSong?.tags ? draftSong.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : []
  );
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsSuggested, setTopicsSuggested] = useState(false);

  // Load draft youtube links and scores
  useEffect(() => {
    if (draftSong?.id) {
      loadDraftData(draftSong.id);
    }
  }, [draftSong?.id]);

  const loadDraftData = async (songId: string) => {
    const [linksRes, scoresRes] = await Promise.all([
      supabase.from("song_youtube_links").select("*").eq("song_id", songId).order("position"),
      supabase.from("song_scores").select("*").eq("song_id", songId).order("key").order("page_number"),
    ]);

    if (linksRes.data && linksRes.data.length > 0) {
      setYoutubeLinks(linksRes.data.map(l => ({ id: l.id, label: l.label, url: l.url })));
    } else if (draftSong?.youtube_url) {
      setYoutubeLinks([{ label: t("songFlow.original"), url: draftSong.youtube_url }]);
    } else {
      setYoutubeLinks([{ label: "", url: "" }]);
    }

    if (scoresRes.data && scoresRes.data.length > 0) {
      const grouped: Record<string, Array<{ url: string; page: number; id: string }>> = {};
      scoresRes.data.forEach(s => {
        if (!grouped[s.key]) grouped[s.key] = [];
        grouped[s.key].push({ url: s.file_url, page: s.page_number, id: s.id });
      });
      setScoreVariations(Object.entries(grouped).map(([key, files]) => ({
        key,
        files: files.sort((a, b) => a.page - b.page),
      })));
    } else {
      setScoreVariations([{ key: draftSong?.default_key || "", files: [] }]);
    }
  };

  // === YouTube Search (Step 2) ===
  const searchYouTube = useCallback(async (query?: string) => {
    const searchQ = query || youtubeSearchQuery || `${title} ${subtitle ? subtitle + " " : ""}찬양`;
    if (!searchQ.trim()) return;
    
    setYoutubeSearching(true);
    setYoutubeSearchQuery(searchQ);
    try {
      const { data, error } = await supabase.functions.invoke("search-youtube", {
        body: { title: searchQ },
      });
      if (error) throw error;
      setYoutubeResults(data.results || []);
    } catch (err) {
      console.error("YouTube search error:", err);
      toast.error(t("songFlow.searchError"));
    } finally {
      setYoutubeSearching(false);
    }
  }, [title, subtitle, youtubeSearchQuery, t]);

  // Auto-search on Step 2 entry
  useEffect(() => {
    if (currentStep === 2 && title.trim() && youtubeResults.length === 0 && !youtubeSearching) {
      const q = `${title} ${subtitle ? subtitle + " " : ""}찬양`;
      searchYouTube(q);
    }
  }, [currentStep]);

  const handleSelectYoutubeResult = (result: YouTubeResult) => {
    setSelectedYoutubeResult(result);
    // Don't auto-fill artist — user must select/enter manually
    // Set first YouTube link
    setYoutubeLinks(prev => {
      const updated = [...prev];
      const defaultLabel = artist || "";
      if (updated.length === 0) updated.push({ label: defaultLabel, url: result.url });
      else { updated[0] = { ...updated[0], label: updated[0].label || defaultLabel, url: result.url }; }
      return updated;
    });
  };

  // === Lyrics Search (Step 4) ===
  const searchLyrics = async () => {
    if (!title.trim()) return;
    const previousLyrics = lyrics;
    setLyricsSearching(true);
    setLyricsSearchDone(false);
    setLyricsCandidates([]);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 30000)
      );
      const invokePromise = supabase.functions.invoke("match-lyrics", {
        body: {
          title: title.trim(),
          artist: artist.trim() || undefined,
          original_composer: originalComposer.trim() || undefined,
        },
      });
      const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;
      if (error) throw error;
      if (data?.found && data?.lyrics) {
        setLyrics(data.lyrics);
        setLyricsSource(data.source);
      } else if (data?.candidates && data.candidates.length > 0) {
        setLyricsCandidates(data.candidates);
        if (!previousLyrics) {
          toast.info(t("songFlow.candidatesFailed"));
        }
      } else {
        if (!previousLyrics) {
          toast.info(`${t("songFlow.noLyricsFound")} ${t("songFlow.noLyricsFoundHint")}`);
        }
      }
      setLyricsSearchDone(true);
    } catch (err: any) {
      console.error("Lyrics search error:", err);
      if (err?.message === 'TIMEOUT') {
        toast.error(t("songFlow.searchTimeout"));
      } else {
        toast.error(t("songFlow.lyricsSearchError"));
      }
      if (previousLyrics && !lyrics) {
        setLyrics(previousLyrics);
      }
      setLyricsSearchDone(true);
    } finally {
      setLyricsSearching(false);
    }
  };

  // === Language Detection + Topic Suggestion (Step 4→5 transition) ===
  const detectLanguageAndSuggestTopics = async () => {
    if (lyrics.trim()) {
      const hasKorean = /[가-힣]/.test(lyrics);
      const hasEnglish = /[a-zA-Z]{2,}/.test(lyrics);
      if (hasKorean && hasEnglish) setSongLanguage("KO/EN");
      else if (hasKorean) setSongLanguage("KO");
      else if (hasEnglish) setSongLanguage("EN");
    }

    if (lyrics.trim() && !topicsSuggested) {
      setTopicsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("suggest-song-topics", {
          body: { lyrics: lyrics.trim() },
        });
        if (error) throw error;
        if (data.topics && data.topics.length > 0) {
          setTopics(data.topics);
          setTopicsSuggested(true);
        }
      } catch (err) {
        console.error("Topic suggestion error:", err);
      } finally {
        setTopicsLoading(false);
      }
    }
  };

  // === Score Upload ===
  const uploadScoreFile = async (file: File, variationIndex: number) => {
    try {
      setUploadingVariationIndex(variationIndex);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("scores").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("scores").getPublicUrl(fileName);
      setScoreVariations(prev => {
        const updated = [...prev];
        updated[variationIndex].files.push({ url: publicUrl, page: updated[variationIndex].files.length + 1 });
        return updated;
      });
      toast.success(t("songFlow.uploadComplete"));
    } catch (error: any) {
      toast.error(t("songFlow.uploadError").replace("{message}", error.message));
    } finally {
      setUploadingVariationIndex(null);
    }
  };

  const handleDownloadFromUrl = async (variationIndex: number, url: string) => {
    if (!url.trim()) return;
    setDownloadingScore(true);
    try {
      const { data, error } = await supabase.functions.invoke("download-score-image", { body: { url } });
      if (error) throw error;
      setScoreVariations(prev => {
        const updated = [...prev];
        updated[variationIndex].files.push({ url: data.url, page: updated[variationIndex].files.length + 1 });
        return updated;
      });
      setScoreUrlInput("");
      toast.success(t("songFlow.downloadComplete"));
    } catch (error) {
      toast.error(t("songFlow.downloadFailed"));
    } finally {
      setDownloadingScore(false);
    }
  };

  // === Navigation ===
  const canGoNext = () => {
    switch (currentStep) {
      case 1: return title.trim().length > 0;
      case 2: return !!selectedYoutubeResult && artist.trim().length > 0;
      case 3: return scoreVariations.some(v => v.files.length > 0 && v.key);
      case 5: return songLanguage && topics.length >= 2;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (!canGoNext()) {
      if (currentStep === 1) toast.error(t("songFlow.enterTitle"));
      if (currentStep === 2) toast.error(t("songFlow.selectYoutubeAndArtist"));
      if (currentStep === 3) {
        const hasFiles = scoreVariations.some(v => v.files.length > 0);
        const hasKey = scoreVariations.some(v => v.key);
        if (!hasKey) toast.error(language === "ko" ? "키를 선택하세요" : "Please select a key");
        if (!hasFiles) toast.error(t("songFlow.uploadScoreRequired"));
      }
      if (currentStep === 5) {
        if (!songLanguage) toast.error(t("songFlow.selectLanguage"));
        else if (topics.length < 2) toast.error(t("songFlow.minTopics"));
      }
      return;
    }

    if (currentStep === 4) {
      await detectLanguageAndSuggestTopics();
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinalSave();
    }
  };

  const handleFinalSave = async () => {
    if (!title.trim()) { toast.error(t("songFlow.enterTitle")); setCurrentStep(1); return; }
    if (!songLanguage) { toast.error(t("songFlow.selectLanguage")); setCurrentStep(5); return; }
    if (topics.length < 2) { toast.error(t("songFlow.minTopics")); setCurrentStep(5); return; }

    setLoading(true);
    try {
      const songData = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        artist: artist.trim() || null,
        original_composer: originalComposer.trim() || null,
        language: songLanguage,
        tags: topics.join(", "),
        lyrics: lyrics.trim() || null,
        notes: notes.trim() || null,
        is_private: isPrivate,
        default_key: scoreVariations[0]?.key || "",
        score_file_url: scoreVariations[0]?.files[0]?.url || "",
        youtube_url: youtubeLinks[0]?.url || "",
        status: "published",
        draft_step: null,
      };
      await onComplete(songData, scoreVariations, youtubeLinks);
    } catch (error: any) {
      toast.error(t("songFlow.saveError").replace("{message}", error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDraftSave = async () => {
    setDraftSaving(true);
    try {
      const songData = {
        title: title.trim() || t("songFlow.untitled"),
        subtitle: subtitle.trim() || null,
        artist: artist.trim() || null,
        original_composer: originalComposer.trim() || null,
        language: songLanguage || null,
        tags: topics.length > 0 ? topics.join(", ") : null,
        lyrics: lyrics.trim() || null,
        notes: notes.trim() || null,
        is_private: isPrivate,
        default_key: scoreVariations[0]?.key || "",
        score_file_url: scoreVariations[0]?.files[0]?.url || "",
        youtube_url: youtubeLinks[0]?.url || "",
        status: "draft",
        draft_step: currentStep,
      };
      await onDraftSave(songData, scoreVariations, youtubeLinks, currentStep);
      toast.success(t("songFlow.draftSaved"));
    } catch (error: any) {
      toast.error(t("songFlow.draftSaveError").replace("{message}", error.message));
    } finally {
      setDraftSaving(false);
    }
  };

  // === RENDER ===
  const stepLabels = [
    t("songFlow.steps.songInfo"),
    t("songFlow.steps.youtube"),
    t("songFlow.steps.scoresLinks"),
    t("songFlow.steps.lyrics"),
    t("songFlow.steps.languageTopics"),
    t("songFlow.steps.review"),
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold truncate">
            {title.trim() || t("songFlow.newSong")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {currentStep} / {TOTAL_STEPS} · {stepLabels[currentStep - 1]}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onCancel ? onCancel() : onClose()}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress */}
      <div className="px-4 py-2 shrink-0">
        <div className="flex gap-1 mb-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <button
              key={i}
              onClick={() => i < currentStep && setCurrentStep(i + 1)}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                i < currentStep ? "bg-primary cursor-pointer" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3">
        {currentStep === 1 && <Step1_BasicInfo 
          title={title} setTitle={setTitle}
          subtitle={subtitle} setSubtitle={setSubtitle}
          isPrivate={isPrivate} setIsPrivate={setIsPrivate}
          t={t}
        />}
        {currentStep === 2 && <Step2_YouTube
          youtubeResults={youtubeResults}
          youtubeSearching={youtubeSearching}
          selectedResult={selectedYoutubeResult}
          onSelect={handleSelectYoutubeResult}
          searchQuery={youtubeSearchQuery}
          onSearchQueryChange={setYoutubeSearchQuery}
          onSearch={() => searchYouTube()}
          showCustomSearch={showCustomSearch}
          setShowCustomSearch={setShowCustomSearch}
          artist={artist}
          setArtist={setArtist}
          artistSectionRef={artistSectionRef}
          artistHighlight={artistHighlight}
          setArtistHighlight={setArtistHighlight}
          title={title}
          setTitle={setTitle}
          t={t}
        />}
        {currentStep === 3 && <Step3_LinksScores
          youtubeLinks={youtubeLinks}
          setYoutubeLinks={setYoutubeLinks}
          scoreVariations={scoreVariations}
          setScoreVariations={setScoreVariations}
          uploadScoreFile={uploadScoreFile}
          uploadingVariationIndex={uploadingVariationIndex}
          handleDownloadFromUrl={handleDownloadFromUrl}
          downloadingScore={downloadingScore}
          scoreUrlInput={scoreUrlInput}
          setScoreUrlInput={setScoreUrlInput}
          t={t}
        />}
        {currentStep === 4 && <Step4_Lyrics
          originalComposer={originalComposer}
          setOriginalComposer={setOriginalComposer}
          lyrics={lyrics}
          setLyrics={setLyrics}
          notes={notes}
          setNotes={setNotes}
          onSearchLyrics={searchLyrics}
          lyricsSearching={lyricsSearching}
          lyricsSource={lyricsSource}
          lyricsSearchDone={lyricsSearchDone}
          lyricsCandidates={lyricsCandidates}
          t={t}
        />}
        {currentStep === 5 && <Step5_LanguageTopics
          songLanguage={songLanguage}
          setSongLanguage={setSongLanguage}
          topics={topics}
          setTopics={setTopics}
          topicsLoading={topicsLoading}
          t={t}
        />}
        {currentStep === 6 && <Step6_Review
          title={title} subtitle={subtitle} isPrivate={isPrivate}
          artist={artist} originalComposer={originalComposer}
          youtubeLinks={youtubeLinks} scoreVariations={scoreVariations}
          lyrics={lyrics} notes={notes}
          songLanguage={songLanguage} topics={topics}
          onEditStep={setCurrentStep}
          t={t}
        />}
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-t shrink-0 bg-background" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onCancel ? onCancel() : onClose()}>
            {t("songFlow.cancel")}
          </Button>
          {currentStep > 1 && (
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(currentStep - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t("songFlow.previous")}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDraftSave}
            disabled={draftSaving}
          >
            {draftSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            {t("songFlow.draftSave")}
          </Button>
          <Button 
            size="sm" 
            onClick={handleNext}
            disabled={loading || !canGoNext()}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {currentStep === TOTAL_STEPS ? t("songFlow.save") : t("songFlow.next")}
            {currentStep < TOTAL_STEPS && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>

    </div>
  );
});

SmartSongFlow.displayName = "SmartSongFlow";

// ========== STEP COMPONENTS ==========

function Step1_BasicInfo({ title, setTitle, subtitle, setSubtitle, isPrivate, setIsPrivate, t }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="flow-title">{t("songFlow.songTitle")} <span className="text-destructive">*</span></Label>
        <Input
          id="flow-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("songFlow.songTitlePlaceholder")}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="flow-subtitle">{t("songFlow.subtitle")}</Label>
        <Input
          id="flow-subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder={t("songFlow.subtitlePlaceholder")}
        />
        <p className="text-xs text-muted-foreground">{t("songFlow.subtitleHint")}</p>
      </div>
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <div>
            <Label htmlFor="flow-private" className="font-medium">{t("songFlow.privateSong")}</Label>
            <p className="text-xs text-muted-foreground mt-0.5">{t("songFlow.privateDesc")}</p>
          </div>
        </div>
        <Switch id="flow-private" checked={isPrivate} onCheckedChange={setIsPrivate} />
      </div>
    </div>
  );
}

function Step2_YouTube({ youtubeResults, youtubeSearching, selectedResult, onSelect, searchQuery, onSearchQueryChange, onSearch, showCustomSearch, setShowCustomSearch, artist, setArtist, artistSectionRef, artistHighlight, setArtistHighlight, title, setTitle, t }: any) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(title);

  const handleSelectAndScroll = (result: YouTubeResult) => {
    onSelect(result);
    setTimeout(() => {
      artistSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setArtistHighlight(true);
      setTimeout(() => setArtistHighlight(false), 2000);
    }, 100);
  };

  return (
    <div className="space-y-4">
      {/* Search status */}
      {youtubeSearching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("songFlow.searchingYoutube")}
        </div>
      )}

      {/* Custom search */}
      {!youtubeSearching && (
        <div className="flex gap-2">
          {showCustomSearch ? (
            <>
              <Input
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder={t("songFlow.searchPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
                className="flex-1"
              />
              <Button size="sm" onClick={onSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowCustomSearch(true)}>
              <Search className="w-4 h-4 mr-1" />
              {t("songFlow.editSearch")}
            </Button>
          )}
        </div>
      )}

      {/* Results */}
      {youtubeResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t("songFlow.searchResults").replace("{count}", String(youtubeResults.length))}</p>
          {youtubeResults.map((r: YouTubeResult) => (
            <Card
              key={r.videoId}
              className={cn(
                "cursor-pointer transition-all",
                selectedResult?.videoId === r.videoId
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50"
              )}
              onClick={() => handleSelectAndScroll(r)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <img src={r.thumbnailUrl} alt={r.title} className="w-24 h-16 object-cover rounded flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2" dangerouslySetInnerHTML={{ __html: r.title }} />
                  <p className="text-xs text-muted-foreground mt-1">{r.channelTitle}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); window.open(r.url, "_blank"); }}>
                    <ExternalLink className="w-3 h-3" /> {t("songFlow.open")}
                  </Button>
                  {selectedResult?.videoId === r.videoId && (
                    <span className="text-xs text-primary font-medium flex items-center gap-1 justify-center">
                      <Check className="w-3 h-3" /> {t("songFlow.selected")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Title confirmation */}
      {selectedResult && (
        <div className="space-y-2 pt-3 border-t">
          <Label>{t("songFlow.confirmTitle")}</Label>
          {editingTitle ? (
            <div className="flex gap-2">
              <Input
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                autoFocus
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && editTitleValue.trim()) {
                    setTitle(editTitleValue.trim());
                    setEditingTitle(false);
                  }
                }}
              />
              <Button size="sm" onClick={() => { if (editTitleValue.trim()) { setTitle(editTitleValue.trim()); setEditingTitle(false); } }}>
                {t("songFlow.titleConfirmed")}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium flex-1">"{title}"</p>
              <Button variant="outline" size="sm" onClick={() => { setEditTitleValue(title); setEditingTitle(true); }}>
                <Pen className="w-3 h-3 mr-1" /> {t("songFlow.editTitle")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Artist */}
      <div 
        ref={artistSectionRef}
        className={cn(
          "space-y-2 pt-3 border-t transition-all duration-500",
          artistHighlight && "bg-primary/10 -mx-2 px-2 py-3 rounded-lg ring-2 ring-primary/30"
        )}
      >
        <Label>{t("songFlow.artist")} <span className="text-destructive">*</span></Label>
        {selectedResult && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            ℹ️ {t("songFlow.youtubeChannel").replace("{name}", selectedResult.channelTitle)}
          </p>
        )}
        <ArtistSelector value={artist} onValueChange={setArtist} />
        {!artist && selectedResult && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {t("songFlow.selectArtist")}
          </p>
        )}
      </div>
    </div>
  );
}

function Step3_LinksScores({ youtubeLinks, setYoutubeLinks, scoreVariations, setScoreVariations, uploadScoreFile, uploadingVariationIndex, handleDownloadFromUrl, downloadingScore, scoreUrlInput, setScoreUrlInput, t }: any) {
  const MUSICAL_KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

  const addYoutubeLink = () => setYoutubeLinks([...youtubeLinks, { label: "", url: "" }]);
  const removeYoutubeLink = (index: number) => setYoutubeLinks(youtubeLinks.filter((_: any, i: number) => i !== index));
  const updateYoutubeLink = (index: number, field: "label" | "url", value: string) => {
    setYoutubeLinks((prev: YouTubeLink[]) => prev.map((link, i) => i === index ? { ...link, [field]: value } : link));
  };

  return (
    <div className="space-y-6">
      {/* YouTube Links Section */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2"><Music className="w-4 h-4" /> {t("songFlow.youtubeLinks")}</Label>
        {youtubeLinks.map((link: YouTubeLink, index: number) => {
          const videoId = link.url?.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^#&?]+)/)?.[1];
          return (
            <div key={index} className="p-3 border rounded-lg bg-muted/30 space-y-2">
              <Input placeholder={t("songFlow.labelPlaceholder")} value={link.label} onChange={(e) => updateYoutubeLink(index, "label", e.target.value)} className="text-sm" />
              <div className="flex gap-2 items-center">
                <Input type="url" placeholder="https://youtube.com/..." value={link.url} onChange={(e) => updateYoutubeLink(index, "url", e.target.value)} className="flex-1 text-sm" />
                {youtubeLinks.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeYoutubeLink(index)}><X className="h-4 w-4" /></Button>
                )}
              </div>
              {videoId && (
                <div className="flex justify-center">
                  <div className="relative w-28 h-20 rounded overflow-hidden cursor-pointer" onClick={() => window.open(link.url, "_blank")}>
                    <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <Button type="button" variant="outline" size="sm" onClick={addYoutubeLink}>
          <Plus className="h-4 w-4 mr-1" /> {t("songFlow.addYoutubeLink")}
        </Button>
      </div>

      {/* Scores Section */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2"><FileText className="w-4 h-4" /> {t("songFlow.scores")}</Label>
        {scoreVariations.map((variation: ScoreVariation, index: number) => (
          <div key={index} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Select value={variation.key} onValueChange={(v) => {
                const updated = [...scoreVariations];
                updated[index].key = v;
                setScoreVariations(updated);
              }}>
                <SelectTrigger className="w-28"><SelectValue placeholder={t("songFlow.keySelect")} /></SelectTrigger>
                <SelectContent>{MUSICAL_KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
              <label htmlFor={`score-upload-${index}`} className="flex-1 cursor-pointer">
                <Button type="button" variant="outline" size="sm" asChild disabled={uploadingVariationIndex === index} className="w-full">
                  <span>{uploadingVariationIndex === index ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{t("songFlow.uploading")}</> : t("songFlow.scoreUpload")}</span>
                </Button>
              </label>
              <Input id={`score-upload-${index}`} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={async (e) => {
                const files = e.target.files;
                if (files) await Promise.all(Array.from(files).map(f => uploadScoreFile(f, index)));
                e.target.value = "";
              }} />
              {index > 0 && <Button type="button" variant="ghost" size="icon" onClick={() => setScoreVariations(scoreVariations.filter((_: any, i: number) => i !== index))}><X className="h-4 w-4" /></Button>}
            </div>
            {/* URL download */}
            <div className="flex gap-2">
              <Input type="url" placeholder={t("songFlow.imageUrlPaste")} value={index === 0 ? scoreUrlInput : ""} onChange={(e) => index === 0 && setScoreUrlInput(e.target.value)} className="flex-1 text-sm" />
              <Button type="button" variant="outline" size="sm" onClick={() => handleDownloadFromUrl(index, scoreUrlInput)} disabled={downloadingScore}>
                {downloadingScore ? <Loader2 className="w-4 h-4 animate-spin" /> : t("songFlow.download")}
              </Button>
            </div>
            {/* File thumbnails */}
            {variation.files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {variation.files.map((file: any, fi: number) => (
                  <div key={fi} className="relative group">
                    <div className="w-20 h-16 rounded border overflow-hidden">
                      {file.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                        <img src={file.url} alt={`Page ${fi + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center"><FileText className="w-6 h-6 text-muted-foreground" /></div>
                      )}
                    </div>
                    <button type="button" onClick={() => {
                      const updated = [...scoreVariations];
                      updated[index].files.splice(fi, 1);
                      updated[index].files = updated[index].files.map((f: any, i: number) => ({ ...f, page: i + 1 }));
                      setScoreVariations(updated);
                    }} className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center text-xs">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setScoreVariations([...scoreVariations, { key: "", files: [] }])}>
          <Plus className="h-4 w-4 mr-1" /> {t("songFlow.addScoreVariation")}
        </Button>
        
      </div>
    </div>
  );
}

function Step4_Lyrics({ originalComposer, setOriginalComposer, lyrics, setLyrics, notes, setNotes, onSearchLyrics, lyricsSearching, lyricsSource, lyricsSearchDone, lyricsCandidates, t }: any) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("songFlow.originalComposer")}</Label>
        <Input value={originalComposer} onChange={(e: any) => setOriginalComposer(e.target.value)} placeholder={t("songFlow.composerPlaceholder")} />
        <p className="text-xs text-muted-foreground">{t("songFlow.composerHint")}</p>
      </div>

      <Button type="button" variant="outline" onClick={onSearchLyrics} disabled={lyricsSearching} className="w-full">
        {lyricsSearching ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t("songFlow.searchingLyrics")}</> : <><Search className="w-4 h-4 mr-2" />{t("songFlow.autoSearchLyrics")}</>}
      </Button>

      {lyricsSearchDone && lyrics && lyricsSource && (
        <p className="text-sm text-primary flex items-center gap-1"><Check className="w-4 h-4" /> {t("songFlow.lyricsFound").replace("{source}", lyricsSource)}</p>
      )}
      
      {/* Candidate links when auto-search fails */}
      {lyricsSearchDone && !lyrics && lyricsCandidates && lyricsCandidates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ExternalLink className="w-4 h-4" />
            {t("songFlow.candidatesFound")}
          </div>
          <p className="text-xs text-muted-foreground">{t("songFlow.candidatesHint")}</p>
          <div className="space-y-2">
            {lyricsCandidates.slice(0, 5).map((c: any, i: number) => (
              <Card key={i} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => window.open(c.url, '_blank')}>
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.title || t("songFlow.lyricsPage")}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.source === 'gasazip' ? 'gasazip.com' : c.source === 'bugs' ? 'music.bugs.co.kr' : c.source}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0 gap-1 text-xs">
                    <ExternalLink className="w-3 h-3" /> {t("songFlow.open")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {lyricsSearchDone && !lyrics && (!lyricsCandidates || lyricsCandidates.length === 0) && !originalComposer && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>{t("songFlow.noLyricsFound")}</p>
          <p className="text-primary">{t("songFlow.composerTip")}</p>
        </div>
      )}
      {lyricsSearchDone && !lyrics && (!lyricsCandidates || lyricsCandidates.length === 0) && originalComposer && (
        <p className="text-sm text-muted-foreground">{t("songFlow.noLyricsFound")} {t("songFlow.noLyricsFoundHint")}</p>
      )}

      <div className="space-y-2">
        <Label>{t("songFlow.lyricsLabel")}</Label>
        <Textarea value={lyrics} onChange={(e: any) => setLyrics(e.target.value)} placeholder={t("songFlow.lyricsPlaceholder")} rows={6} className="font-mono text-sm" />
      </div>

      <div className="space-y-2">
        <Label>{t("songFlow.notesLabel")}</Label>
        <Textarea value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder={t("songFlow.notesPlaceholder")} rows={3} />
      </div>
    </div>
  );
}

function Step5_LanguageTopics({ songLanguage, setSongLanguage, topics, setTopics, topicsLoading, t }: any) {
  return (
    <div className="space-y-6">
      {topicsLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("songFlow.analyzingTopics")}
        </div>
      )}

      <div className="space-y-2">
        <Label>{t("songFlow.language")} <span className="text-destructive">*</span></Label>
        <Select value={songLanguage} onValueChange={setSongLanguage}>
          <SelectTrigger><SelectValue placeholder={t("songFlow.languageSelect")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="KO">한국어</SelectItem>
            <SelectItem value="EN">English</SelectItem>
            <SelectItem value="KO/EN">한국어/English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("songFlow.topicsLabel")} <span className="text-destructive">*</span> {t("songFlow.topicsHint")}</Label>
        <TopicSelector selectedTopics={topics} onTopicsChange={setTopics} minTopics={2} maxTopics={3} />
      </div>
    </div>
  );
}

function Step6_Review({ title, subtitle, isPrivate, artist, originalComposer, youtubeLinks, scoreVariations, lyrics, notes, songLanguage, topics, onEditStep, t }: any) {
  const langLabel = songLanguage === "KO" ? "한국어" : songLanguage === "EN" ? "English" : songLanguage === "KO/EN" ? "한국어/English" : t("songFlow.notEntered");

  const Section = ({ label, step, children }: { label: string; step: number; children: React.ReactNode }) => (
    <div className="py-3 border-b last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => onEditStep(step)}>
          {t("songFlow.edit")} <ChevronRight className="w-3 h-3 ml-0.5" />
        </Button>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-0">
      <Section label={t("songFlow.reviewSongInfo")} step={1}>
        <p className="text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {isPrivate && <Badge variant="outline" className="mt-1 text-xs">{t("songFlow.private")}</Badge>}
      </Section>

      <Section label={t("songFlow.reviewArtistComposer")} step={2}>
        <p className="text-sm">{artist || t("songFlow.notEntered")}</p>
        {originalComposer && <p className="text-xs text-muted-foreground">{t("songFlow.reviewComposer").replace("{name}", originalComposer)}</p>}
      </Section>

      <Section label="YouTube" step={3}>
        {youtubeLinks.filter((l: any) => l.url.trim()).length > 0 ? (
          youtubeLinks.filter((l: any) => l.url.trim()).map((link: any, i: number) => (
            <p key={i} className="text-xs text-muted-foreground truncate">{link.label || t("songFlow.link")}: {link.url}</p>
          ))
        ) : <p className="text-xs text-muted-foreground">{t("songFlow.none")}</p>}
      </Section>

      <Section label={t("songFlow.scores")} step={3}>
        {scoreVariations.some((v: any) => v.files.length > 0) ? (
          scoreVariations.filter((v: any) => v.files.length > 0).map((v: any, i: number) => (
            <p key={i} className="text-xs text-muted-foreground">{v.key || t("songFlow.noKey")} · {t("songFlow.pages").replace("{count}", String(v.files.length))}</p>
          ))
        ) : <p className="text-xs text-muted-foreground">{t("songFlow.none")}</p>}
      </Section>

      <Section label={t("songFlow.lyricsLabel")} step={4}>
        {lyrics ? (
          <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">{lyrics}</p>
        ) : <p className="text-xs text-muted-foreground">{t("songFlow.notEntered")}</p>}
      </Section>

      <Section label={t("songFlow.languageTopicsLabel")} step={5}>
        <div className="flex flex-wrap gap-1 mt-1">
          <Badge variant="secondary" className="text-xs">{langLabel}</Badge>
          {topics.map((tp: string) => <Badge key={tp} variant="outline" className="text-xs">{tp}</Badge>)}
        </div>
      </Section>

      {notes && (
        <Section label={t("songFlow.notesLabel")} step={4}>
          <p className="text-xs text-muted-foreground line-clamp-2">{notes}</p>
        </Section>
      )}
    </div>
  );
}
