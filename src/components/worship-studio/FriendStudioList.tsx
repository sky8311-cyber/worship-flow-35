import { useFriendStudios, type FriendStudio } from "@/hooks/useFriendStudios";
import { useTranslation } from "@/hooks/useTranslation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FriendStudioListProps {
  onStudioSelect: (roomId: string) => void;
  selectedStudioId?: string | null;
}

export function FriendStudioList({ onStudioSelect, selectedStudioId }: FriendStudioListProps) {
  const { language } = useTranslation();
  const { data: studios, isLoading } = useFriendStudios();
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  
  if (!studios?.length) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        {language === "ko" ? "아직 친구가 없습니다" : "No friends yet"}
      </p>
    );
  }
  
  return (
    <div className="space-y-1">
      {studios.map((studio) => {
        const timeAgo = studio.latestPostAt 
          ? formatDistanceToNow(new Date(studio.latestPostAt), {
              addSuffix: false,
              locale: language === "ko" ? ko : enUS,
            })
          : null;
        
        return (
          <button
            key={studio.id}
            onClick={() => onStudioSelect(studio.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
              selectedStudioId === studio.id 
                ? "bg-primary/10 border border-primary/20" 
                : "hover:bg-muted/50"
            )}
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={studio.owner?.avatar_url || undefined} />
                <AvatarFallback>
                  {studio.owner?.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              {studio.hasNewPosts && (
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate text-sm">
                  {studio.owner?.full_name || "Unknown"}
                </span>
                {studio.owner?.is_ambassador && (
                  <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                )}
              </div>
              {timeAgo && (
                <span className="text-xs text-muted-foreground">
                  {timeAgo}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
