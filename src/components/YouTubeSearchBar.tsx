import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Youtube, Loader2, ExternalLink, Check } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";
import { getYouTubeAnchorProps } from "@/lib/youtubeHelper";

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

interface YouTubeSearchBarProps {
  onSelectVideo: (url: string) => void;
  defaultQuery?: string;
}

export const YouTubeSearchBar = ({ onSelectVideo, defaultQuery = "" }: YouTubeSearchBarProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchYouTube = async () => {
    if (!query.trim()) {
      toast.error(t("songDialog.enterSearchQuery"));
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const apiKey = "AIzaSyDebIF_jHyj9p4Gx5m4GFnGNpOValfToWs";

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&q=${encodeURIComponent(query)}&` +
        `type=video&maxResults=10&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error("YouTube API request failed");
      }

      const data = await response.json();

      const videos: YouTubeVideo[] = data.items?.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
      })) || [];

      setResults(videos);
      
      if (videos.length === 0) {
        toast.info(t("songDialog.noResultsFound"));
      }
    } catch (error: any) {
      console.error("YouTube search error:", error);
      toast.error(t("songDialog.youtubeSearchError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (videoId: string) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    onSelectVideo(url);
    toast.success(t("songDialog.youtubeUrlSelected"));
    
    // Reset search state after selection
    setResults([]);
    setSearched(false);
    setQuery("");
  };

  const getPreviewProps = (videoId: string) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    return getYouTubeAnchorProps(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="유튜브 검색어 입력하여 검색"
          onKeyDown={(e) => e.key === "Enter" && searchYouTube()}
        />
        <Button
          type="button"
          onClick={searchYouTube}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white border-red-600"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Youtube className="w-4 h-4" />
          )}
        </Button>
      </div>

      {searched && results.length > 0 && (
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="space-y-3">
            {results.map((video) => (
              <div
                key={video.id}
                className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg border bg-card"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full sm:w-32 h-40 sm:h-20 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(video.id)}
                      className="w-full sm:flex-1"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {t("songDialog.previewVideo")}
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => handleSelect(video.id)}
                      className="w-full sm:flex-1"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      {t("songDialog.selectVideo")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {searched && results.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t("songDialog.noResultsFound")}
        </p>
      )}
    </div>
  );
};
