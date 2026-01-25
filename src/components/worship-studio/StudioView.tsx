import { useEffect, useState } from "react";
import { useWorshipRoomById, useWorshipRoom } from "@/hooks/useWorshipRoom";
import { useAuth } from "@/contexts/AuthContext";
import { useRoomPosts } from "@/hooks/useRoomPosts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StudioContractPrompt } from "./StudioContractPrompt";
import { StudioLockedState } from "./StudioLockedState";
import { StudioEmptyState } from "./StudioEmptyState";
import { StudioModules } from "./StudioModules";
import { StudioPostComposer } from "./StudioPostComposer";
import { StudioBGMBar } from "./StudioBGMBar";
import { StudioViewHeader } from "./StudioViewHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudioViewProps {
  roomId?: string;
  isOwnRoom?: boolean;
}

function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

export function StudioView({ roomId, isOwnRoom = false }: StudioViewProps) {
  const { user } = useAuth();
  const [showComposer, setShowComposer] = useState(false);
  
  // Fetch own room if no roomId provided
  const { room: ownRoom, isLoading: ownRoomLoading } = useWorshipRoom(user?.id);
  
  // Fetch specific room if roomId is provided
  const { room: targetRoom, isLoading: targetRoomLoading } = useWorshipRoomById(
    roomId && roomId !== ownRoom?.id ? roomId : undefined
  );
  
  const room = roomId ? (roomId === ownRoom?.id ? ownRoom : targetRoom) : ownRoom;
  const isLoading = roomId ? targetRoomLoading : ownRoomLoading;
  const isActuallyOwnRoom = room?.owner_user_id === user?.id;
  
  // Check friend status for access control
  const { data: friendsData } = useQuery({
    queryKey: ["user-friends", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("friends")
        .select("requester_user_id, addressee_user_id")
        .eq("status", "accepted")
        .or(`requester_user_id.eq.${user.id},addressee_user_id.eq.${user.id}`);
      return data || [];
    },
    enabled: !!user,
  });
  
  const friendIds = friendsData?.map(f => 
    f.requester_user_id === user?.id ? f.addressee_user_id : f.requester_user_id
  ) || [];
  
  // Fetch posts for the room
  const { data: posts, isLoading: postsLoading } = useRoomPosts(room?.id);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  
  // No room - show contract prompt for own studio
  if (!room && isOwnRoom) {
    return <StudioContractPrompt />;
  }
  
  // Room not found
  if (!room) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Studio not found
      </div>
    );
  }
  
  // Check access for non-own rooms
  if (!isActuallyOwnRoom) {
    const canAccess = 
      room.visibility === "public" ||
      (room.visibility === "friends" && friendIds.includes(room.owner_user_id));
    
    if (!canAccess) {
      return (
        <StudioLockedState 
          ownerUserId={room.owner_user_id}
          ownerName={room.owner?.full_name || undefined}
        />
      );
    }
  }
  
  // BGM info
  const bgmVideoId = room.bgm_song?.youtube_url 
    ? extractVideoId(room.bgm_song.youtube_url)
    : null;
  
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <StudioViewHeader room={room} isOwnRoom={isActuallyOwnRoom} />
        
        <div className="p-4 space-y-6">
          {/* Post Composer for own room */}
          {isActuallyOwnRoom && (
            <StudioPostComposer 
              roomId={room.id} 
              isOpen={showComposer}
              onOpenChange={setShowComposer}
            />
          )}
          
          {/* Modules */}
          {postsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : posts?.length ? (
            <StudioModules posts={posts} roomId={room.id} isOwnRoom={isActuallyOwnRoom} />
          ) : (
            <StudioEmptyState 
              type="studio" 
              onAction={isActuallyOwnRoom ? () => setShowComposer(true) : undefined} 
            />
          )}
        </div>
      </ScrollArea>
      
      {/* BGM Bar */}
      {bgmVideoId && room.bgm_song && (
        <StudioBGMBar
          songTitle={room.bgm_song.title}
          songArtist={room.bgm_song.artist}
          videoId={bgmVideoId}
          roomId={room.id}
          ownerName={room.owner?.full_name || undefined}
        />
      )}
    </div>
  );
}
