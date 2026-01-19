import { useEffect } from "react";
import { useWorshipRoomById } from "@/hooks/useWorshipRoom";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { RoomHeader } from "./RoomHeader";
import { RoomScene } from "./RoomScene";
import { RoomPostComposer } from "./RoomPostComposer";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { room, isLoading } = useWorshipRoomById(roomId);
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
        {/* 2D Room Scene */}
        <RoomScene room={room} isOwnRoom={isOwnRoom} />
        
        {/* Post composer - only show if user can post */}
        <RoomPostComposer roomId={room.id} />
      </div>
    </div>
  );
}
