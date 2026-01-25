import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useStudioFeed } from "@/hooks/useStudioFeed";
import { useEnabledCategories } from "@/hooks/useStudioCategories";
import { StudioFeedCard } from "./StudioFeedCard";
import { StudioEmptyState } from "./StudioEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface StudioFeedProps {
  onStudioClick?: (roomId: string) => void;
}

export function StudioFeed({ onStudioClick }: StudioFeedProps) {
  const { language } = useTranslation();
  const [filter, setFilter] = useState("all");
  
  const { data: categories, isLoading: categoriesLoading } = useEnabledCategories();
  const { data: posts, isLoading: postsLoading } = useStudioFeed({ filter });
  
  const allFilter = { 
    key: "all", 
    label_en: "All", 
    label_ko: "전체", 
    icon: "List" 
  };
  
  const filterOptions = [allFilter, ...(categories || [])];
  
  if (postsLoading || categoriesLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs */}
      <div className="px-4 py-3 border-b border-border overflow-x-auto">
        <div className="flex gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.key}
              variant={filter === option.key ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter(option.key)}
              className={cn(
                "shrink-0 h-8",
                filter === option.key && "bg-primary/10 text-primary"
              )}
            >
              {language === "ko" ? option.label_ko : option.label_en}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Feed content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {!posts?.length ? (
            <StudioEmptyState type="feed" />
          ) : (
            posts.map((post: any) => (
              <StudioFeedCard 
                key={post.id} 
                post={post}
                onStudioClick={() => post.room?.id && onStudioClick?.(post.room.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
