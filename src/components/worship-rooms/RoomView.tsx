import { useEffect } from "react";
import { useWorshipRoomById } from "@/hooks/useWorshipRoom";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useRoomPosts } from "@/hooks/useRoomPosts";
import { RoomHeader } from "./RoomHeader";
import { RoomPostCard } from "./RoomPostCard";
import { RoomPostComposer } from "./RoomPostComposer";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/useTranslation";

interface RoomViewProps {
  roomId: string;
  isOwnRoom?: boolean;
}

// Extract YouTube video ID from URL
function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

export function RoomView({ roomId, isOwnRoom = false }: RoomViewProps) {
  const { t } = useTranslation();
  const { room, isLoading } = useWorshipRoomById(roomId);
  const { data: posts, isLoading: postsLoading } = useRoomPosts(roomId);
  const { startPlaylist, closePlayer, setPlayerState } = useMusicPlayer();

  // Auto-play BGM when entering the room
  useEffect(() => {
    if (room?.bgm_song && room.bgm_song.youtube_url) {
      const videoId = extractVideoId(room.bgm_song.youtube_url);
      if (videoId) {
        startPlaylist(
          [{
            videoId,
            title: room.bgm_song.title,
            artist: room.bgm_song.artist || "",
            position: 0,
          }],
          `${room.owner?.full_name || "Room"} BGM`,
          room.id
        );
        setPlayerState("mini");
      }
    }

    // Stop music when leaving the room
    return () => {
      closePlayer();
    };
  }, [room?.bgm_song?.id, room?.id]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Room not found
      </div>
    );
  }

  // Apply theme background
  const themeConfig = room.theme_config as { backgroundColor?: string; wallpaper?: string } | null;
  const backgroundColor = themeConfig?.backgroundColor || "transparent";

  return (
    <div 
      className="min-h-full"
      style={{ backgroundColor }}
    >
      <RoomHeader room={room} isOwnRoom={isOwnRoom} />
      
      <div className="p-4 space-y-4">
        {/* Post composer - only show for room owner */}
        {isOwnRoom && <RoomPostComposer roomId={room.id} />}
        
        {/* Posts list */}
        {postsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : posts?.length ? (
          <div className="space-y-4">
            {posts.map(post => (
              <RoomPostCard 
                key={post.id} 
                post={post} 
                roomId={room.id} 
                isOwnRoom={isOwnRoom} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>{isOwnRoom ? t("studio.emptyStudio") : t("studio.noPosts")}</p>
            {isOwnRoom && <p className="text-sm mt-1">{t("studio.startPosting")}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
