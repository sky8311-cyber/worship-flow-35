import { useState } from "react";
import { WorshipRoom } from "@/hooks/useWorshipRoom";
import { RoomPost, useRoomPosts } from "@/hooks/useRoomPosts";
import { useUpdateRoomStatus } from "@/hooks/useRoomStatus";
import { RoomCanvas } from "./RoomCanvas";
import { IsometricRoomSVG } from "./IsometricRoomSVG";
import { EditableFurnitureLayer } from "./EditableFurnitureLayer";
import { IsometricAvatar } from "./IsometricAvatar";
import { IsometricTalkBubble, IsometricThinkBubble } from "./IsometricTalkBubble";
import { IsometricStatusBubble } from "./IsometricStatusBubble";
import { RoomPostDetailDialog } from "./RoomPostDetailDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Sparkles, PenLine, Edit3, Check } from "lucide-react";
import { Z_LAYERS } from "./FloorSlots";

interface RoomSceneProps {
  room: WorshipRoom & { 
    status_emoji?: string | null; 
    status_text?: string | null; 
  };
  isOwnRoom: boolean;
}

export function RoomScene({ room, isOwnRoom }: RoomSceneProps) {
  const { t } = useTranslation();
  const { data: posts, isLoading } = useRoomPosts(room.id);
  const updateStatus = useUpdateRoomStatus();
  const [selectedPost, setSelectedPost] = useState<RoomPost | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Get the latest post for the talk bubble
  const sortedPosts = [...(posts || [])].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
  
  const latestPost = sortedPosts[0];
  const postCount = sortedPosts.length;
  
  const handleSaveStatus = (emoji: string, text: string) => {
    updateStatus.mutate({
      roomId: room.id,
      status_emoji: emoji,
      status_text: text,
    });
  };

  // Determine if post should be think or talk bubble
  const isThinkBubble = latestPost?.post_type === 'prayer' || latestPost?.post_type === 'concern';

  return (
    <>
      {/* Edit mode toggle button (for room owner only) */}
      {isOwnRoom && (
        <div className="flex justify-end mb-2">
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="gap-2"
          >
            {isEditMode ? (
              <>
                <Check className="h-4 w-4" />
                {t("rooms.doneEditing") || "Done"}
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" />
                {t("rooms.editRoom") || "Edit Room"}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Room Scene Container - Fixed 800x500 Canvas */}
      <RoomCanvas className="rounded-xl shadow-xl border-2 border-border/50 bg-slate-100">
        {(canvasScale) => (
          <>
            {/* Layer 1: Isometric Room Background (walls + floor) */}
            <IsometricRoomSVG themeConfig={room.theme_config} />
            
            {/* Layer 2: Status bubble (TODAY IS...) */}
            {!isEditMode && (
              <IsometricStatusBubble
                emoji={room.status_emoji || null}
                text={room.status_text || null}
                isOwnRoom={isOwnRoom}
                onSave={handleSaveStatus}
              />
            )}
            
            {/* Layer 3: Editable Furniture with Grid */}
            <EditableFurnitureLayer 
              roomId={room.id} 
              isEditMode={isEditMode}
              canvasScale={canvasScale}
            />
            
            {/* Layer 4: Avatar (hidden in edit mode) */}
            {room.owner && !isEditMode && (
              <IsometricAvatar owner={room.owner} />
            )}
            
            {/* Layer 5: Talk/Think Bubble (hidden in edit mode) */}
            {latestPost && !isEditMode && (
              isThinkBubble ? (
                <IsometricThinkBubble
                  post={latestPost}
                  onClick={() => setSelectedPost(latestPost)}
                />
              ) : (
                <IsometricTalkBubble
                  post={latestPost}
                  onClick={() => setSelectedPost(latestPost)}
                />
              )
            )}
            
            {/* Edit mode hint */}
            {isEditMode && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 top-4
                           bg-primary/90 text-primary-foreground rounded-full px-4 py-2 
                           shadow-lg text-sm font-medium"
                style={{ zIndex: Z_LAYERS.UI_OVERLAY }}
              >
                {t("rooms.editModeHint") || "Drag furniture to move • Click ↻ to rotate"}
              </div>
            )}
            
            {/* Empty room state overlay */}
            {!isLoading && posts?.length === 0 && !isEditMode && (
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                style={{ zIndex: Z_LAYERS.UI_OVERLAY }}
              >
                <div className="bg-background/85 backdrop-blur-sm rounded-xl p-6 shadow-lg border mb-24">
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
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ zIndex: Z_LAYERS.UI_OVERLAY }}
              >
                <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4">
                  <div className="animate-pulse text-sm text-muted-foreground">
                    {t("common.loading")}
                  </div>
                </div>
              </div>
            )}
            
            {/* Post count indicator */}
            {postCount > 1 && !isEditMode && (
              <div 
                className="absolute right-4 bg-background/90 backdrop-blur-sm 
                           rounded-full px-3 py-1.5 text-xs font-medium shadow-md border"
                style={{ 
                  bottom: 60,
                  zIndex: Z_LAYERS.UI_OVERLAY 
                }}
              >
                📝 {postCount} {t("rooms.posts")}
              </div>
            )}
            
            {/* Room owner badge */}
            {room.owner && !isEditMode && (
              <div 
                className="absolute top-3 left-3 flex items-center gap-2 
                           bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border"
                style={{ zIndex: Z_LAYERS.UI_OVERLAY }}
              >
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
            
            {/* Write hint for own empty room */}
            {isOwnRoom && posts?.length === 0 && !isEditMode && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 
                           bg-primary text-primary-foreground rounded-full px-4 py-2 
                           shadow-lg flex items-center gap-2 text-sm font-medium
                           animate-bounce"
                style={{ 
                  bottom: 80,
                  zIndex: Z_LAYERS.UI_OVERLAY 
                }}
              >
                <PenLine className="h-4 w-4" />
                {t("rooms.writeFirst")}
              </div>
            )}
          </>
        )}
      </RoomCanvas>
      
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