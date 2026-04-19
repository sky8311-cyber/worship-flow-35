import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GripVertical, X, Youtube, Copy, ChevronDown, ChevronUp, Download, Pencil } from "lucide-react";
import { FileMusic } from "lucide-react";
import { useState, useMemo, lazy, Suspense, useEffect } from "react";
import { computeTranspose, formatTranspose } from "@/lib/transpose";
import { Metronome } from "./Metronome";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { SongDialog } from "./SongDialog";
import { ScorePreviewDialog } from "./ScorePreviewDialog";
import { Badge } from "@/components/ui/badge";
import { SongProgressionSettings } from "./set-builder/SongProgressionSettings";
const SetSongScoreDialog = lazy(() =>
  import("./SetSongScoreDialog").then((m) => ({ default: m.SetSongScoreDialog }))
);
import { openYouTubeUrl } from "@/lib/youtubeHelper";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SetSongItemProps {
  setSong: any;
  index: number;
  totalCount: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: any) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  dbId?: string;
  status?: "draft" | "published";
}

export const SetSongItem = ({ setSong, index, totalCount, onRemove, onUpdate, onMoveUp, onMoveDown, dbId, status }: SetSongItemProps) => {
  // Use the setSong's id if available, otherwise fallback to index-based id
  const sortableId = setSong.id ? `song-${setSong.id}` : `song-new-${index}`;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: sortableId });
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showScorePreview, setShowScorePreview] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const song = setSong.song || setSong.songs;
  const hasImportedLyrics = Boolean(setSong.lyrics && setSong.lyrics.trim());
  const songHasLyrics = Boolean(song?.lyrics && song.lyrics.trim());

  // Get available key variations from song_scores (only keys with actual score files)
  const keyVariations = useMemo(() => {
    const variations: { key: string; scoreUrl: string }[] = [];
    
    // Add variations from song_scores - only include keys with actual file_url
    if (song?.song_scores && song.song_scores.length > 0) {
      const uniqueKeys = new Map<string, string>();
      song.song_scores.forEach((score: any) => {
        if (score.key && score.file_url && !uniqueKeys.has(score.key)) {
          uniqueKeys.set(score.key, score.file_url);
        }
      });
      uniqueKeys.forEach((url, key) => {
        variations.push({ key, scoreUrl: url });
      });
    }
    
    // Add default key only if it has a legacy score_file_url
    if (song?.default_key && song?.score_file_url && !variations.find(v => v.key === song.default_key)) {
      variations.unshift({ key: song.default_key, scoreUrl: song.score_file_url });
    }
    
    return variations;
  }, [song]);

  // Standard 12 musical keys for performance key selection
  const MUSICAL_KEYS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

  // Score key (read-only) is auto-populated from primary score in set_song_scores
  const scoreKey: string | null = setSong.score_key || null;
  // Performance key — fall back to legacy `key` column for backward compat
  const performanceKey: string | null = setSong.performance_key || setSong.key || null;

  // Auto-compute transpose whenever score_key or performance_key changes
  const transposeNumber = useMemo(
    () => computeTranspose(scoreKey, performanceKey),
    [scoreKey, performanceKey]
  );
  const transposeDisplay = transposeNumber === null ? "-" : formatTranspose(transposeNumber);

  // Persist transpose_amount to DB when it changes (display-only, but kept in sync)
  useEffect(() => {
    if (!dbId) return;
    const newTranspose = transposeNumber === null ? null : formatTranspose(transposeNumber);
    if ((setSong.transpose_amount ?? null) === newTranspose) return;
    onUpdate(index, { transpose_amount: newTranspose });
    if (status === "published") {
      supabase
        .from("set_songs")
        .update({ transpose_amount: newTranspose })
        .eq("id", dbId);
    }
  }, [transposeNumber, dbId, status]);

  const handleKeyVariationChange = async (selectedKey: string) => {
    const variation = keyVariations.find(v => v.key === selectedKey);
    
    // Update local state
    onUpdate(index, { 
      override_score_file_url: variation?.scoreUrl || null,
      score_key: selectedKey  // Save the selected score key for BandView
    });
    
    // For published sets, save directly to DB since auto-save is disabled
    if (dbId && status === "published") {
      const { error } = await supabase
        .from("set_songs")
        .update({ 
          score_key: selectedKey,
          override_score_file_url: variation?.scoreUrl || null
        })
        .eq("id", dbId);
      
      if (!error) {
        toast.success("악보 키가 저장되었습니다");
        queryClient.invalidateQueries({ queryKey: ["band-view-songs"] });
      } else {
        console.error("Failed to save score_key:", error);
        toast.error("악보 키 저장에 실패했습니다");
      }
    }
  };

  const handlePerformanceKeyChange = async (newKey: string) => {
    const value = newKey === "none" ? null : newKey;
    // Update local state — keep legacy `key` in sync for backward compat
    onUpdate(index, { performance_key: value, key: value });

    if (dbId) {
      const { error } = await supabase
        .from("set_songs")
        .update({ performance_key: value, key: value })
        .eq("id", dbId);
      if (error) {
        console.error("Failed to save performance_key:", error);
        toast.error("연주 키 저장에 실패했습니다");
      } else {
        queryClient.invalidateQueries({ queryKey: ["band-view-songs"] });
      }
    }
  };

  const handleKeyChangeToChange = (keyChangeTo: string) => {
    if (keyChangeTo === "none") {
      onUpdate(index, { key_change_to: null });
    } else {
      onUpdate(index, { key_change_to: keyChangeTo });
    }
  };

  const handleEditDialogClose = () => {
    setShowEditDialog(false);
    queryClient.invalidateQueries({ queryKey: ["set-songs"] });
    queryClient.invalidateQueries({ queryKey: ["songs"] });
  };

  // Get the current score URL (override or default)
  const currentScoreUrl = setSong.override_score_file_url || song?.score_file_url;
  const handleCopyLyrics = () => {
    if (setSong.lyrics) {
      navigator.clipboard.writeText(setSong.lyrics);
      toast.success(t("setSongItem.lyricsCopied"));
    }
  };

  const handleLyricsToggle = (checked: boolean) => {
    if (checked && songHasLyrics) {
      // Import lyrics from song library
      onUpdate(index, { lyrics: song.lyrics });
      toast.success("가사를 가져왔습니다");
    } else {
      // Clear lyrics
      onUpdate(index, { lyrics: "" });
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex flex-col items-center justify-start pt-1 gap-1">
              <button {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
                <GripVertical className="w-5 h-5" />
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onMoveUp(index)}
                disabled={index === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <div className="text-2xl font-bold text-primary">
                {index + 1}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onMoveDown(index)}
                disabled={index === totalCount - 1}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-foreground">{song?.title}</h4>
                  {song?.artist && (
                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                  )}
                  {(() => {
                    const tagsList: string[] = Array.isArray(song?.tags)
                      ? song.tags
                      : typeof song?.tags === "string" && song.tags.trim()
                        ? song.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
                        : [];
                    const hasMeta = song?.language || song?.tempo || tagsList.length > 0;
                    if (!hasMeta) return null;
                    return (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {song?.language && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5">
                            {song.language}
                          </Badge>
                        )}
                        {song?.tempo && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5">
                            {song.tempo}
                          </Badge>
                        )}
                        {tagsList.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5 h-5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowEditDialog(true)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>곡 편집</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* 악보키 — read-only, auto-populated from primary score in set_song_scores */}
                <div>
                  <label className="text-xs text-muted-foreground">악보키</label>
                  <div className="mt-1 h-10 px-3 flex items-center rounded-md border border-input bg-muted/40 text-sm">
                    {scoreKey || song?.default_key || "-"}
                  </div>
                </div>

                {/* 연주키 — user-editable, persisted immediately */}
                <div>
                  <label className="text-xs text-muted-foreground">연주키</label>
                  <Select
                    value={performanceKey || "none"}
                    onValueChange={handlePerformanceKeyChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-</SelectItem>
                      {MUSICAL_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 전조 — read-only, auto-computed */}
                <div>
                  <label className="text-xs text-muted-foreground">전조</label>
                  <div className="mt-1 h-10 px-3 flex items-center rounded-md border border-input bg-muted/40 text-sm">
                    {transposeDisplay}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">BPM</label>
                  <div className="mt-1">
                    <Metronome
                      bpm={setSong.bpm}
                      timeSignature={setSong.time_signature}
                      onBpmChange={(newBpm) => onUpdate(index, { bpm: newBpm })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">박자</label>
                  <Input
                    value={setSong.time_signature || ""}
                    onChange={(e) => onUpdate(index, { time_signature: e.target.value })}
                    placeholder="4/4"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">에너지 레벨</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={setSong.energy_level || ""}
                    onChange={(e) => onUpdate(index, { energy_level: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="1-5"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">진행설명</label>
                <Textarea
                  value={setSong.custom_notes || ""}
                  onChange={(e) => onUpdate(index, { custom_notes: e.target.value })}
                  placeholder="예: 후렴 2번 반복, 브리지 생략"
                  rows={2}
                  className="mt-1"
                />
              </div>

              {/* Lyrics Section */}
              <Collapsible open={lyricsOpen} onOpenChange={setLyricsOpen}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                        <span className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                          {t("setSongItem.lyrics")}
                          {lyricsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    
                    {/* Import Lyrics Toggle */}
                    {songHasLyrics && (
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`lyrics-toggle-${index}`}
                          checked={hasImportedLyrics}
                          onCheckedChange={handleLyricsToggle}
                        />
                        <Label 
                          htmlFor={`lyrics-toggle-${index}`} 
                          className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          가사 가져오기
                        </Label>
                      </div>
                    )}
                  </div>
                  
                  {hasImportedLyrics && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLyrics}
                      className="h-6 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      {t("setSongItem.copyLyrics")}
                    </Button>
                  )}
                </div>
                <CollapsibleContent>
                  <Textarea
                    value={setSong.lyrics || ""}
                    onChange={(e) => onUpdate(index, { lyrics: e.target.value })}
                    placeholder={songHasLyrics ? "토글을 켜서 가사를 가져오거나 직접 입력하세요" : t("setSongItem.lyricsPlaceholder")}
                    rows={6}
                    className="mt-1 font-mono text-sm"
                  />
                </CollapsibleContent>
              </Collapsible>

              <div className="flex gap-2">
                {song?.youtube_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openYouTubeUrl(song.youtube_url)}
                    className="group hover:bg-accent hover:text-white hover:border-accent"
                  >
                    <Youtube className="w-4 h-4 mr-1 text-accent group-hover:text-white" />
                    유튜브
                  </Button>
                )}
                {(() => {
                  const hasScoreRef = Boolean(setSong.score_ref_url || setSong.private_score_file_url);
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScoreDialog(true)}
                      className="relative"
                    >
                      <FileMusic className="w-4 h-4 mr-1 text-blue-500" />
                      악보
                      {hasScoreRef && (
                        <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-primary" />
                      )}
                    </Button>
                  );
                })()}
              </div>
            </div>

            <div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SongDialog 
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        song={song}
        onClose={handleEditDialogClose}
      />

      <ScorePreviewDialog
        open={showScorePreview}
        onOpenChange={setShowScorePreview}
        scoreUrl={currentScoreUrl}
        songTitle={song?.title || ""}
        songId={song?.id}
        setSongId={dbId}
      />

      {showScoreDialog && (
        <Suspense fallback={null}>
          <SetSongScoreDialog
            open={showScoreDialog}
            onOpenChange={setShowScoreDialog}
            setSongId={dbId}
            songId={song?.id}
            defaultQuery={song?.title ? `${song.title} 악보` : ""}
            scoreRefUrl={setSong.score_ref_url}
            scoreRefThumbnail={setSong.score_ref_thumbnail}
            privateScoreFileUrl={setSong.private_score_file_url}
            onSaved={(updates) => onUpdate(index, updates)}
          />
        </Suspense>
      )}
    </div>
  );
};
