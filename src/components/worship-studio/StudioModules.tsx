import { useTranslation } from "@/hooks/useTranslation";
import { RoomPostCard } from "@/components/worship-rooms/RoomPostCard";
import { useEnabledCategories } from "@/hooks/useStudioCategories";
import type { RoomPost } from "@/hooks/useRoomPosts";
import { Pin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudioModulesProps {
  posts: RoomPost[];
  roomId: string;
  isOwnRoom?: boolean;
}

export function StudioModules({ posts, roomId, isOwnRoom = false }: StudioModulesProps) {
  const { language } = useTranslation();
  const { data: categories } = useEnabledCategories();
  
  // Group posts by type
  const pinnedPosts = posts.filter(p => p.is_pinned);
  const postsByType = posts.reduce((acc, post) => {
    if (!post.is_pinned) {
      if (!acc[post.post_type]) acc[post.post_type] = [];
      acc[post.post_type].push(post);
    }
    return acc;
  }, {} as Record<string, RoomPost[]>);
  
  const getCategoryLabel = (key: string) => {
    const category = categories?.find(c => c.key === key);
    if (category) {
      return language === "ko" ? category.label_ko : category.label_en;
    }
    return key.charAt(0).toUpperCase() + key.slice(1);
  };
  
  const getCategoryIcon = (key: string) => {
    const icons: Record<string, string> = {
      prayer: "🙏",
      note: "📝",
      testimony: "✨",
      concern: "💭",
      general: "💬",
    };
    return icons[key] || "📄";
  };
  
  return (
    <div className="space-y-8">
      {/* Pinned / Featured */}
      {pinnedPosts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Pin className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">
              {language === "ko" ? "대표" : "Featured"}
            </h2>
          </div>
          <div className="space-y-3">
            {pinnedPosts.slice(0, 3).map(post => (
              <RoomPostCard 
                key={post.id} 
                post={post} 
                roomId={roomId} 
                isOwnRoom={isOwnRoom} 
              />
            ))}
          </div>
        </section>
      )}
      
      {/* Category sections */}
      {categories?.map(category => {
        const categoryPosts = postsByType[category.key] || [];
        if (categoryPosts.length === 0) return null;
        
        return (
          <section key={category.key}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span>{getCategoryIcon(category.key)}</span>
                <h2 className="font-semibold">
                  {language === "ko" ? category.label_ko : category.label_en}
                </h2>
                <span className="text-sm text-muted-foreground">
                  ({categoryPosts.length})
                </span>
              </div>
              {categoryPosts.length > 3 && (
                <Button variant="ghost" size="sm" className="text-xs">
                  {language === "ko" ? "모두 보기" : "See All"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {categoryPosts.slice(0, 3).map(post => (
                <RoomPostCard 
                  key={post.id} 
                  post={post} 
                  roomId={roomId} 
                  isOwnRoom={isOwnRoom} 
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
