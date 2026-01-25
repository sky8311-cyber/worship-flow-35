import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useRoomPosts } from "@/hooks/useRoomPosts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Check, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PostSelectorProps {
  roomId: string;
  selectedPostId?: string;
  onSelect: (postId: string | undefined) => void;
}

export function PostSelector({ roomId, selectedPostId, onSelect }: PostSelectorProps) {
  const { language } = useTranslation();
  const { data: posts, isLoading } = useRoomPosts(roomId);
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredPosts = posts?.filter(post => 
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  
  if (!posts || posts.length === 0) {
    return (
      <div className="py-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">
          {language === "ko" 
            ? "초안함에 게시물이 없습니다. 먼저 초안함에서 글을 작성해주세요." 
            : "No posts in drafts. Please write a post in drafts first."}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === "ko" ? "게시물 검색..." : "Search posts..."}
          className="pl-10"
        />
      </div>
      
      {/* Post list */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-4">
          {filteredPosts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => onSelect(post.id === selectedPostId ? undefined : post.id)}
              className={cn(
                "w-full p-3 rounded-lg border text-left transition-colors",
                post.id === selectedPostId
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                        locale: language === "ko" ? ko : enUS,
                      })}
                    </span>
                  </div>
                </div>
                {post.id === selectedPostId && (
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
          
          {filteredPosts.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              {language === "ko" ? "검색 결과가 없습니다." : "No results found."}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
