import { useEffect, useState } from "react";
import { useWorshipRoomById, useWorshipRoom } from "@/hooks/useWorshipRoom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StudioContractPrompt } from "./StudioContractPrompt";
import { StudioLockedState } from "./StudioLockedState";
import { StudioCoverEditor } from "./StudioCoverEditor";
import { StudioGrid } from "./grid/StudioGrid";
import { Skeleton } from "@/components/ui/skeleton";

interface StudioViewProps {
  roomId?: string;
  isOwnRoom?: boolean;
}

export function StudioView({ roomId, isOwnRoom = false }: StudioViewProps) {
  const { user } = useAuth();
  
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
  
  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
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
  
  const gridColumns = (room as any).grid_columns || 3;
  
  return (
    <div className="h-full overflow-y-auto">
      {/* Cover & Profile */}
      <StudioCoverEditor room={room} isOwner={isActuallyOwnRoom} />
      
      {/* Grid */}
      <StudioGrid 
        roomId={room.id} 
        isOwner={isActuallyOwnRoom} 
        gridColumns={gridColumns}
      />
    </div>
  );
}
