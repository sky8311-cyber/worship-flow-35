import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { ArtistSelector } from "@/components/ArtistSelector";
import { TopicSelector } from "@/components/TopicSelector";
import { toast } from "sonner";
import { 
  Lock, Loader2, ExternalLink, Check, Search, Plus, 
  Music, FileText, Pen, ChevronRight, Save, X
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
}

export const SmartSongFlow = ({ draftSong, onComplete, onDraftSave, onClose }: SmartSongFlowProps) => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  
  // Current step (1-indexed)
  const [currentStep, setCurrentStep] = useState(draftSong?.draft_step || 1);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
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
  const [manualArtistMode, setManualArtistMode] = useState(false);

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
      setYoutubeLinks([{ label: "원곡", url: draftSong.youtube_url }]);
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
      toast.error("YouTube 검색 중 오류가 발생했습니다");
    } finally {
      setYoutubeSearching(false);
    }
  }, [title, subtitle, youtubeSearchQuery]);

  // Auto-search on Step 2 entry
  useEffect(() => {
    if (currentStep === 2 && title.trim() && youtubeResults.length === 0 && !youtubeSearching) {
      const q = `${title} ${subtitle ? subtitle + " " : ""}찬양`;
      searchYouTube(q);
    }
  }, [currentStep]);

  const handleSelectYoutubeResult = (result: YouTubeResult) => {
    setSelectedYoutubeResult(result);
    setArtist(result.channelTitle);
    setManualArtistMode(false);
    // Set first YouTube link
    setYoutubeLinks(prev => {
      const updated = [...prev];
      if (updated.length === 0) updated.push({ label: "원곡", url: result.url });
      else { updated[0] = { ...updated[0], label: updated[0].label || "원곡", url: result.url }; }
      return updated;
    });
  };

  // === Lyrics Search (Step 4) ===
  const searchLyrics = async () => {
    if (!title.trim()) return;
    setLyricsSearching(true);
    setLyricsSearchDone(false);
    setLyricsCandidates([]);
    try {
      const { data, error } = await supabase.functions.invoke("match-lyrics", {
        body: {
          title: title.trim(),
          artist: artist.trim() || undefined,
          original_composer: originalComposer.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data.found && data.lyrics) {
        setLyrics(data.lyrics);
        setLyricsSource(data.source);
      } else if (data.candidates && data.candidates.length > 0) {
        setLyricsCandidates(data.candidates);
      }
      setLyricsSearchDone(true);
    } catch (err) {
      console.error("Lyrics search error:", err);
      toast.error("가사 검색 중 오류가 발생했습니다");
      setLyricsSearchDone(true);
    } finally {
      setLyricsSearching(false);
    }
  };

  // === Language Detection + Topic Suggestion (Step 4→5 transition) ===
  const detectLanguageAndSuggestTopics = async () => {
    // Auto-detect language from lyrics
    if (lyrics.trim()) {
      const hasKorean = /[가-힣]/.test(lyrics);
      const hasEnglish = /[a-zA-Z]{2,}/.test(lyrics);
      if (hasKorean && hasEnglish) setSongLanguage("KO/EN");
      else if (hasKorean) setSongLanguage("KO");
      else if (hasEnglish) setSongLanguage("EN");
    }

    // Suggest topics via AI
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
      toast.success("업로드 완료");
    } catch (error: any) {
      toast.error("업로드 오류: " + error.message);
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
      toast.success("다운로드 완료");
    } catch (error) {
      toast.error("다운로드 실패");
    } finally {
      setDownloadingScore(false);
    }
  };

  // === Navigation ===
  const canGoNext = () => {
    switch (currentStep) {
      case 1: return title.trim().length > 0;
      case 5: return songLanguage && topics.length >= 2;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (!canGoNext()) {
      if (currentStep === 1) toast.error("곡 제목을 입력해주세요");
      if (currentStep === 5) {
        if (!songLanguage) toast.error("언어를 선택해주세요");
        else if (topics.length < 2) toast.error("주제를 최소 2개 선택해주세요");
      }
      return;
    }

    if (currentStep === 4) {
      // Detect language + suggest topics before moving to step 5
      await detectLanguageAndSuggestTopics();
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final save
      handleFinalSave();
    }
  };

  const handleFinalSave = async () => {
    // Validate
    if (!title.trim()) { toast.error("곡 제목을 입력해주세요"); setCurrentStep(1); return; }
    if (!songLanguage) { toast.error("언어를 선택해주세요"); setCurrentStep(5); return; }
    if (topics.length < 2) { toast.error("주제를 최소 2개 선택해주세요"); setCurrentStep(5); return; }

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
      toast.error("저장 오류: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDraftSave = async () => {
    setDraftSaving(true);
    try {
      const songData = {
        title: title.trim() || "제목 없음",
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
      toast.success("임시저장되었습니다");
    } catch (error: any) {
      toast.error("임시저장 오류: " + error.message);
    } finally {
      setDraftSaving(false);
    }
  };

  // === RENDER ===
  const stepLabels = ["곡 정보", "YouTube", "악보·링크", "가사", "언어·주제", "리뷰"];

  return (
    <div className="flex flex-col h-full max-h-[calc(85vh-4rem)] sm:max-h-[calc(85vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold truncate">
            {title.trim() || "새 곡 추가"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {currentStep} / {TOTAL_STEPS} · {stepLabels[currentStep - 1]}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowCancelConfirm(true)}>
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
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {currentStep === 1 && <Step1_BasicInfo 
          title={title} setTitle={setTitle}
          subtitle={subtitle} setSubtitle={setSubtitle}
          isPrivate={isPrivate} setIsPrivate={setIsPrivate}
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
          manualArtistMode={manualArtistMode}
          setManualArtistMode={setManualArtistMode}
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
        />}
        {currentStep === 5 && <Step5_LanguageTopics
          songLanguage={songLanguage}
          setSongLanguage={setSongLanguage}
          topics={topics}
          setTopics={setTopics}
          topicsLoading={topicsLoading}
        />}
        {currentStep === 6 && <Step6_Review
          title={title} subtitle={subtitle} isPrivate={isPrivate}
          artist={artist} originalComposer={originalComposer}
          youtubeLinks={youtubeLinks} scoreVariations={scoreVariations}
          lyrics={lyrics} notes={notes}
          songLanguage={songLanguage} topics={topics}
          onEditStep={setCurrentStep}
        />}
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-t shrink-0 bg-background">
        <Button variant="ghost" size="sm" onClick={() => setShowCancelConfirm(true)}>
          취소
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDraftSave}
            disabled={draftSaving}
          >
            {draftSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            임시저장
          </Button>
          <Button 
            size="sm" 
            onClick={handleNext}
            disabled={loading || !canGoNext()}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {currentStep === TOTAL_STEPS ? "저장" : "다음"}
            {currentStep < TOTAL_STEPS && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>

      {/* Cancel Confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>작성을 취소하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              작성 중인 내용이 사라집니다. 임시저장하려면 "임시저장" 버튼을 눌러주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>계속 작성</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>취소하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ========== STEP COMPONENTS ==========

function Step1_BasicInfo({ title, setTitle, subtitle, setSubtitle, isPrivate, setIsPrivate }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="flow-title">곡 제목 <span className="text-destructive">*</span></Label>
        <Input
          id="flow-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="곡 제목을 입력하세요"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="flow-subtitle">부제 (선택사항)</Label>
        <Input
          id="flow-subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="동명이곡 구분이나 버전 표시"
        />
        <p className="text-xs text-muted-foreground">동명이곡 구분이나 버전 표시에 사용됩니다</p>
      </div>
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <div>
            <Label htmlFor="flow-private" className="font-medium">비공개 곡</Label>
            <p className="text-xs text-muted-foreground mt-0.5">비공개 곡은 본인만 볼 수 있습니다</p>
          </div>
        </div>
        <Switch id="flow-private" checked={isPrivate} onCheckedChange={setIsPrivate} />
      </div>
    </div>
  );
}

function Step2_YouTube({ youtubeResults, youtubeSearching, selectedResult, onSelect, searchQuery, onSearchQueryChange, onSearch, showCustomSearch, setShowCustomSearch, artist, setArtist, manualArtistMode, setManualArtistMode }: any) {
  return (
    <div className="space-y-4">
      {/* Search status */}
      {youtubeSearching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          YouTube에서 검색 중...
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
                placeholder="검색어를 입력하세요"
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
              검색어 수정
            </Button>
          )}
        </div>
      )}

      {/* Results */}
      {youtubeResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">검색 결과 ({youtubeResults.length}개)</p>
          {youtubeResults.map((r: YouTubeResult) => (
            <Card
              key={r.videoId}
              className={cn(
                "cursor-pointer transition-all",
                selectedResult?.videoId === r.videoId
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50"
              )}
              onClick={() => onSelect(r)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <img src={r.thumbnailUrl} alt={r.title} className="w-24 h-16 object-cover rounded flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2" dangerouslySetInnerHTML={{ __html: r.title }} />
                  <p className="text-xs text-muted-foreground mt-1">{r.channelTitle}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); window.open(r.url, "_blank"); }}>
                    <ExternalLink className="w-3 h-3" /> 열기
                  </Button>
                  {selectedResult?.videoId === r.videoId && (
                    <span className="text-xs text-primary font-medium flex items-center gap-1 justify-center">
                      <Check className="w-3 h-3" /> 선택됨
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Artist */}
      <div className="space-y-2 pt-2 border-t">
        <Label>아티스트</Label>
        {selectedResult && !manualArtistMode ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 p-2 bg-primary/5 rounded border border-primary/20 text-sm">
              {artist}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setManualArtistMode(true)}>
              <Pen className="w-3 h-3 mr-1" /> 수정
            </Button>
          </div>
        ) : (
          <ArtistSelector value={artist} onValueChange={setArtist} />
        )}
      </div>

      {/* Skip option */}
      {!selectedResult && !youtubeSearching && youtubeResults.length > 0 && (
        <Button variant="ghost" size="sm" className="w-full" onClick={() => setManualArtistMode(true)}>
          YouTube 선택 없이 직접 입력
        </Button>
      )}
    </div>
  );
}

function Step3_LinksScores({ youtubeLinks, setYoutubeLinks, scoreVariations, setScoreVariations, uploadScoreFile, uploadingVariationIndex, handleDownloadFromUrl, downloadingScore, scoreUrlInput, setScoreUrlInput }: any) {
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
        <Label className="flex items-center gap-2"><Music className="w-4 h-4" /> YouTube 링크</Label>
        {youtubeLinks.map((link: YouTubeLink, index: number) => {
          const videoId = link.url?.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^#&?]+)/)?.[1];
          return (
            <div key={index} className="p-3 border rounded-lg bg-muted/30 space-y-2">
              <Input placeholder="라벨 (예: 원곡, 라이브)" value={link.label} onChange={(e) => updateYoutubeLink(index, "label", e.target.value)} className="text-sm" />
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
          <Plus className="h-4 w-4 mr-1" /> YouTube 링크 추가
        </Button>
      </div>

      {/* Scores Section */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2"><FileText className="w-4 h-4" /> 악보</Label>
        {scoreVariations.map((variation: ScoreVariation, index: number) => (
          <div key={index} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Select value={variation.key} onValueChange={(v) => {
                const updated = [...scoreVariations];
                updated[index].key = v;
                setScoreVariations(updated);
              }}>
                <SelectTrigger className="w-28"><SelectValue placeholder="키 선택" /></SelectTrigger>
                <SelectContent>{MUSICAL_KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
              <label htmlFor={`score-upload-${index}`} className="flex-1 cursor-pointer">
                <Button type="button" variant="outline" size="sm" asChild disabled={uploadingVariationIndex === index} className="w-full">
                  <span>{uploadingVariationIndex === index ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />업로드 중</> : "악보 업로드"}</span>
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
              <Input type="url" placeholder="이미지 URL 붙여넣기" value={index === 0 ? scoreUrlInput : ""} onChange={(e) => index === 0 && setScoreUrlInput(e.target.value)} className="flex-1 text-sm" />
              <Button type="button" variant="outline" size="sm" onClick={() => handleDownloadFromUrl(index, scoreUrlInput)} disabled={downloadingScore}>
                {downloadingScore ? <Loader2 className="w-4 h-4 animate-spin" /> : "다운로드"}
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
          <Plus className="h-4 w-4 mr-1" /> 또 다른 악보 추가 (키 변주)
        </Button>
        <p className="text-xs text-muted-foreground">🔜 악보 자동 스캔 (Phase 3) — 악보 이미지에서 키/코드 자동 추출 예정</p>
      </div>
    </div>
  );
}

function Step4_Lyrics({ originalComposer, setOriginalComposer, lyrics, setLyrics, notes, setNotes, onSearchLyrics, lyricsSearching, lyricsSource, lyricsSearchDone }: any) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>원곡자 (선택사항)</Label>
        <Input value={originalComposer} onChange={(e) => setOriginalComposer(e.target.value)} placeholder="작곡가/작사가를 알면 입력하세요" />
        <p className="text-xs text-muted-foreground">가사 검색 정확도가 높아집니다</p>
      </div>

      <Button type="button" variant="outline" onClick={onSearchLyrics} disabled={lyricsSearching} className="w-full">
        {lyricsSearching ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />가사를 검색하고 있습니다...</> : <><Search className="w-4 h-4 mr-2" />가사 자동 검색</>}
      </Button>

      {lyricsSearchDone && lyrics && lyricsSource && (
        <p className="text-sm text-primary flex items-center gap-1"><Check className="w-4 h-4" /> 가사를 찾았습니다 (출처: {lyricsSource})</p>
      )}
      {lyricsSearchDone && !lyrics && !originalComposer && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>자동으로 가사를 찾지 못했습니다.</p>
          <p className="text-primary">💡 원곡자를 입력하면 검색 정확도가 높아집니다. 입력 후 다시 검색해보세요.</p>
        </div>
      )}
      {lyricsSearchDone && !lyrics && originalComposer && (
        <p className="text-sm text-muted-foreground">가사를 찾지 못했습니다. 직접 입력해주세요.</p>
      )}

      <div className="space-y-2">
        <Label>가사</Label>
        <Textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="가사를 입력하세요" rows={10} className="font-mono text-sm" />
      </div>

      <div className="space-y-2">
        <Label>노트</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="메모, 연주 팁 등" rows={3} />
      </div>
    </div>
  );
}

function Step5_LanguageTopics({ songLanguage, setSongLanguage, topics, setTopics, topicsLoading }: any) {
  return (
    <div className="space-y-6">
      {topicsLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          AI가 주제를 분석하고 있습니다...
        </div>
      )}

      <div className="space-y-2">
        <Label>언어 <span className="text-destructive">*</span></Label>
        <Select value={songLanguage} onValueChange={setSongLanguage}>
          <SelectTrigger><SelectValue placeholder="언어 선택" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="KO">한국어</SelectItem>
            <SelectItem value="EN">English</SelectItem>
            <SelectItem value="KO/EN">한국어/English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>주제 <span className="text-destructive">*</span> (2~3개 선택)</Label>
        <TopicSelector selectedTopics={topics} onTopicsChange={setTopics} minTopics={2} maxTopics={3} />
      </div>
    </div>
  );
}

function Step6_Review({ title, subtitle, isPrivate, artist, originalComposer, youtubeLinks, scoreVariations, lyrics, notes, songLanguage, topics, onEditStep }: any) {
  const langLabel = songLanguage === "KO" ? "한국어" : songLanguage === "EN" ? "English" : songLanguage === "KO/EN" ? "한국어/English" : "미선택";

  const Section = ({ label, step, children }: { label: string; step: number; children: React.ReactNode }) => (
    <div className="py-3 border-b last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => onEditStep(step)}>
          수정 <ChevronRight className="w-3 h-3 ml-0.5" />
        </Button>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-0">
      <Section label="곡 정보" step={1}>
        <p className="text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {isPrivate && <Badge variant="outline" className="mt-1 text-xs">비공개</Badge>}
      </Section>

      <Section label="아티스트 & 원곡자" step={2}>
        <p className="text-sm">{artist || "미입력"}</p>
        {originalComposer && <p className="text-xs text-muted-foreground">원곡자: {originalComposer}</p>}
      </Section>

      <Section label="YouTube" step={3}>
        {youtubeLinks.filter((l: any) => l.url.trim()).length > 0 ? (
          youtubeLinks.filter((l: any) => l.url.trim()).map((link: any, i: number) => (
            <p key={i} className="text-xs text-muted-foreground truncate">{link.label || "링크"}: {link.url}</p>
          ))
        ) : <p className="text-xs text-muted-foreground">없음</p>}
      </Section>

      <Section label="악보" step={3}>
        {scoreVariations.some((v: any) => v.files.length > 0) ? (
          scoreVariations.filter((v: any) => v.files.length > 0).map((v: any, i: number) => (
            <p key={i} className="text-xs text-muted-foreground">{v.key || "키 미설정"} · {v.files.length}페이지</p>
          ))
        ) : <p className="text-xs text-muted-foreground">없음</p>}
      </Section>

      <Section label="가사" step={4}>
        {lyrics ? (
          <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">{lyrics}</p>
        ) : <p className="text-xs text-muted-foreground">미입력</p>}
      </Section>

      <Section label="언어 / 주제" step={5}>
        <div className="flex flex-wrap gap-1 mt-1">
          <Badge variant="secondary" className="text-xs">{langLabel}</Badge>
          {topics.map((t: string) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
        </div>
      </Section>

      {notes && (
        <Section label="노트" step={4}>
          <p className="text-xs text-muted-foreground line-clamp-2">{notes}</p>
        </Section>
      )}
    </div>
  );
}
