import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Search, ExternalLink, Check, SkipForward, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface YouTubeResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  url: string;
}

interface SmartSongEntryProps {
  songId?: string;
  initialTitle?: string;
  initialArtist?: string;
  onSave: (data: { youtubeUrl: string; artist?: string }) => void;
  onSkip?: () => void;
}

export const SmartSongEntry = ({
  songId,
  initialTitle = "",
  initialArtist = "",
  onSave,
  onSkip,
}: SmartSongEntryProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [artist, setArtist] = useState(initialArtist);
  const [results, setResults] = useState<YouTubeResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<YouTubeResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = async () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요");
      return;
    }

    setIsSearching(true);
    setSelectedResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("search-youtube", {
        body: { title: title.trim(), artist: artist.trim() || undefined },
      });

      if (error) throw error;
      setResults(data.results || []);
      if ((data.results || []).length === 0) {
        toast.info("검색 결과가 없습니다");
      }
    } catch (err: any) {
      console.error("YouTube search error:", err);
      toast.error("검색 중 오류가 발생했습니다");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (result: YouTubeResult) => {
    setSelectedResult(result);
    if (!artist.trim()) {
      setArtist(result.channelTitle);
    }
  };

  const handleSave = () => {
    if (!selectedResult) {
      toast.error("YouTube 영상을 선택해주세요");
      return;
    }
    setIsSaving(true);
    onSave({
      youtubeUrl: selectedResult.url,
      artist: artist.trim() || undefined,
    });
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Song Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="smart-title">제목</Label>
          <Input
            id="smart-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="곡 제목"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div>
          <Label htmlFor="smart-artist">아티스트</Label>
          <Input
            id="smart-artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="아티스트 (선택)"
          />
        </div>
      </div>

      {/* Search Button */}
      <div className="flex gap-2">
        <Button onClick={handleSearch} disabled={isSearching} className="gap-2">
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          YouTube 검색
        </Button>
        {onSkip && (
          <Button variant="ghost" onClick={onSkip} className="gap-2">
            <SkipForward className="w-4 h-4" />
            건너뛰기
          </Button>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">검색 결과 ({results.length}개)</p>
          {results.map((r) => (
            <Card
              key={r.videoId}
              className={`cursor-pointer transition-all ${
                selectedResult?.videoId === r.videoId
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => handleSelect(r)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <img
                  src={r.thumbnailUrl}
                  alt={r.title}
                  className="w-28 h-20 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: r.title }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{r.channelTitle}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(r.url, "_blank");
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    미리보기
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

      {/* Selected + Save */}
      {selectedResult && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex-1 text-sm">
            <span className="text-muted-foreground">선택됨: </span>
            <span className="font-medium">{selectedResult.url}</span>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            저장
          </Button>
        </div>
      )}
    </div>
  );
};
