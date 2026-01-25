import { useRoomPosts } from "@/hooks/useRoomPosts";
import { useTranslation } from "@/hooks/useTranslation";
import { RoomPostCard } from "./RoomPostCard";
import { Skeleton } from "@/components/ui/skeleton";

interface RoomPostFeedProps {
  roomId: string;
  isOwnRoom?: boolean;
}

export function RoomPostFeed({ roomId, isOwnRoom = false }: RoomPostFeedProps) {
  const { t } = useTranslation();
  const { data: posts, isLoading } = useRoomPosts(roomId);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  
  if (!posts?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t("studio.noPosts")}</p>
        {isOwnRoom && (
          <p className="text-sm mt-2">{t("studio.startPosting")}</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <RoomPostCard 
          key={post.id} 
          post={post} 
          roomId={roomId}
          isOwnRoom={isOwnRoom}
        />
      ))}
    </div>
  );
}
