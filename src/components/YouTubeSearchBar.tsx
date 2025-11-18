import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";

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
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      
      if (!apiKey) {
        toast.error(t("songDialog.youtubeApiKeyMissing"));
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&q=${encodeURIComponent(query)}&` +
        `type=video&maxResults=5&key=${apiKey}`
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
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("songDialog.youtubeSearchPlaceholder")}
          onKeyDown={(e) => e.key === "Enter" && searchYouTube()}
        />
        <Button
          type="button"
          variant="outline"
          onClick={searchYouTube}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {searched && results.length > 0 && (
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="space-y-3">
            {results.map((video) => (
              <div
                key={video.id}
                className="flex gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleSelect(video.id)}
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-32 h-20 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
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
