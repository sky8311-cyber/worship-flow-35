import { useState } from "react";
import { WorshipRoom } from "@/hooks/useWorshipRoom";
import { RoomPost, useRoomPosts } from "@/hooks/useRoomPosts";
import { useUpdateRoomStatus } from "@/hooks/useRoomStatus";
import { RoomBackground } from "./RoomBackground";
import { RoomTalkBubble } from "./RoomTalkBubble";
import { RoomPostDetailDialog } from "./RoomPostDetailDialog";
import { RoomStatusBubble } from "./RoomStatusBubble";
import { RoomMiniAvatar } from "./RoomMiniAvatar";
import { RoomFurnitureLayer, useRoomFurniture } from "./RoomFurnitureLayer";
import { getSlotPosition } from "./RoomSceneLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { Sparkles, PenLine } from "lucide-react";

interface RoomSceneProps {
  room: WorshipRoom & { 
    status_emoji?: string | null; 
    status_text?: string | null; 
  };
  isOwnRoom: boolean;
}

// Maximum visible posts in the scene
const MAX_VISIBLE_POSTS = 6;

export function RoomScene({ room, isOwnRoom }: RoomSceneProps) {
  const { t } = useTranslation();
  const { data: posts, isLoading } = useRoomPosts(room.id);
  const { data: furniture } = useRoomFurniture(room.id);
  const updateStatus = useUpdateRoomStatus();
  const [selectedPost, setSelectedPost] = useState<RoomPost | null>(null);
  
  // Sort posts: pinned first, then by date
  const sortedPosts = [...(posts || [])].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
  
  const visiblePosts = sortedPosts.slice(0, MAX_VISIBLE_POSTS);
  const hiddenCount = sortedPosts.length - MAX_VISIBLE_POSTS;
  
  const handleSaveStatus = (emoji: string, text: string) => {
    updateStatus.mutate({
      roomId: room.id,
      status_emoji: emoji,
      status_text: text,
    });
  };

  return (
    <>
      {/* Room Scene Container - Cyworld style */}
      <div 
        className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-xl border-2 border-border/50"
        style={{ perspective: '1000px' }}
      >
        {/* Background layers (wall + floor) */}
        <RoomBackground themeConfig={room.theme_config} />
        
        {/* Status bubble (TODAY IS...) */}
        <RoomStatusBubble
          emoji={room.status_emoji || null}
          text={room.status_text || null}
          isOwnRoom={isOwnRoom}
          onSave={handleSaveStatus}
        />
        
        {/* Furniture layer */}
        <RoomFurnitureLayer roomId={room.id} />
        
        {/* Talk bubbles layer (posts) */}
        <div className="absolute inset-0">
          {visiblePosts.map((post, index) => {
            const position = getSlotPosition(index, post.is_pinned || false);
            return (
              <RoomTalkBubble
                key={post.id}
                post={post}
                position={position}
                onClick={() => setSelectedPost(post)}
              />
            );
          })}
        </div>
        
        {/* Mini avatar at bottom center */}
        {room.owner && (
          <RoomMiniAvatar owner={room.owner} />
        )}
        
        {/* Empty room state */}
        {!isLoading && posts?.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border mb-16">
              <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary/60" />
              <p className="text-sm font-medium text-foreground mb-1">
                {isOwnRoom ? t("rooms.emptyOwnRoom") : t("rooms.emptyRoom")}
              </p>
              <p className="text-xs text-muted-foreground">
                {isOwnRoom ? t("rooms.emptyOwnRoomHint") : t("rooms.emptyRoomHint")}
              </p>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4">
              <div className="animate-pulse text-sm text-muted-foreground">
                {t("common.loading")}
              </div>
            </div>
          </div>
        )}
        
        {/* Hidden posts indicator */}
        {hiddenCount > 0 && (
          <div className="absolute bottom-20 right-3 bg-background/90 backdrop-blur-sm 
                          rounded-full px-3 py-1.5 text-xs font-medium shadow-md border z-40">
            +{hiddenCount} {t("rooms.morePosts")}
          </div>
        )}
        
        {/* Room owner badge (top left) */}
        {room.owner && (
          <div className="absolute top-3 left-3 flex items-center gap-2 
                          bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border z-20">
            <img 
              src={room.owner.avatar_url || '/placeholder.svg'} 
              alt={room.owner.full_name || ''} 
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-xs font-medium">
              {room.owner.full_name || t("rooms.anonymousOwner")}
            </span>
            {room.owner.is_ambassador && (
              <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 rounded-full">
                {t("rooms.ambassador")}
              </span>
            )}
          </div>
        )}
        
        {/* Write hint for own room */}
        {isOwnRoom && posts?.length === 0 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 
                          bg-primary text-primary-foreground rounded-full px-4 py-2 
                          shadow-lg flex items-center gap-2 text-sm font-medium
                          animate-bounce z-40">
            <PenLine className="h-4 w-4" />
            {t("rooms.writeFirst")}
          </div>
        )}
      </div>
      
      {/* Post detail dialog */}
      <RoomPostDetailDialog
        post={selectedPost}
        roomId={room.id}
        isOwnRoom={isOwnRoom}
        open={!!selectedPost}
        onOpenChange={(open) => !open && setSelectedPost(null)}
      />
    </>
  );
}
