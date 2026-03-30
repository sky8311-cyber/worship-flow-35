import { useState } from "react";
import { useWorshipRoomById, useWorshipRoom } from "@/hooks/useWorshipRoom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StudioOnboarding } from "./onboarding/StudioOnboarding";
import { StudioLockedState } from "./StudioLockedState";

import { StudioPostList } from "./PostDisplayCard";
import { PostDetailDialog } from "./PostDetailDialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudioPost } from "@/hooks/useStudioPosts";

interface StudioViewProps {
  roomId?: string;
  isOwnRoom?: boolean;
}

export function StudioView({ roomId, isOwnRoom = false }: StudioViewProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState<StudioPost | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
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
  
  const handlePostClick = (post: StudioPost) => {
    setSelectedPost(post);
    setDetailOpen(true);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  
  // No room or onboarding not completed - show onboarding for own studio
  if (isOwnRoom && (!room || !room.onboarding_completed)) {
    return (
      <StudioOnboarding
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["worship-room"] });
        }}
      />
    );
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
  
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* Space canvas area (cover removed in v2) */}
        
        {/* Post List (replaces widget grid) */}
        <StudioPostList 
          roomId={room.id} 
          includeDrafts={isActuallyOwnRoom}
          onPostClick={handlePostClick}
        />
      </div>
      
      {/* Post Detail Dialog */}
      <PostDetailDialog
        post={selectedPost}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
