import { useTranslation } from "@/hooks/useTranslation";
import { useStudioPosts, type StudioPost, type DisplayType } from "@/hooks/useStudioPosts";
import { SongBlock } from "./editor/blocks/SongBlock";
import { WorshipSetBlock } from "./editor/blocks/WorshipSetBlock";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { FileText, Music, Calendar, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostDisplayCardProps {
  post: StudioPost;
  onClick?: () => void;
}

export function PostDisplayCard({ post, onClick }: PostDisplayCardProps) {
  const { language } = useTranslation();
  
  const displayType = post.display_type || "card";
  
  // Count embedded content
  const songCount = post.blocks.filter(b => b.type === "song").length;
  const setCount = post.blocks.filter(b => b.type === "worship-set").length;
  
  // Get text preview
  const textBlocks = post.blocks.filter(b => 
    b.type === "paragraph" || b.type === "heading"
  );
  const preview = textBlocks.map(b => b.content).join(" ").slice(0, 150);
  
  // Format date
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: language === "ko" ? ko : enUS,
  });
  
  // List view
  if (displayType === "list") {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">
            {post.title || (language === "ko" ? "제목 없음" : "Untitled")}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{preview || "..."}</p>
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo}</span>
      </button>
    );
  }
  
  // Gallery view
  if (displayType === "gallery") {
    return (
      <button
        onClick={onClick}
        className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
      >
        {post.cover_image_url ? (
          <img 
            src={post.cover_image_url} 
            alt="" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white font-medium truncate text-sm">
              {post.title || (language === "ko" ? "제목 없음" : "Untitled")}
            </h3>
          </div>
        </div>
      </button>
    );
  }
  
  // Card view (default)
  return (
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
      onClick={onClick}
    >
      {post.cover_image_url && (
        <div className="aspect-video overflow-hidden">
          <img 
            src={post.cover_image_url} 
            alt="" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="p-4">
        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-6 w-6">
            <AvatarImage src={post.author?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {post.author?.full_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {post.author?.full_name || (language === "ko" ? "익명" : "Anonymous")}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        
        {/* Title & Preview */}
        <h3 className="font-medium mb-1">
          {post.title || (language === "ko" ? "제목 없음" : "Untitled")}
        </h3>
        {preview && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {preview}
          </p>
        )}
        
        {/* Embedded content indicators */}
        {(songCount > 0 || setCount > 0) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {songCount > 0 && (
              <span className="flex items-center gap-1">
                <Music className="h-3 w-3" />
                {songCount} {language === "ko" ? "곡" : "songs"}
              </span>
            )}
            {setCount > 0 && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {setCount} {language === "ko" ? "셋" : "sets"}
              </span>
            )}
          </div>
        )}
        
        {/* Reactions */}
        {post.reactions && post.reactions.length > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
            {post.reactions.map(r => (
              <span key={r.reaction_type} className="flex items-center gap-1">
                {r.reaction_type === "amen" && "🙏"}
                {r.reaction_type === "praying" && "❤️"}
                {r.reaction_type === "like" && "👍"}
                {r.count}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StudioPostListProps {
  roomId: string;
  includeDrafts?: boolean;
  onPostClick?: (post: StudioPost) => void;
}

export function StudioPostList({ roomId, includeDrafts = false, onPostClick }: StudioPostListProps) {
  const { language } = useTranslation();
  const { data: posts, isLoading } = useStudioPosts(roomId, includeDrafts);
  
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{language === "ko" ? "아직 게시물이 없습니다" : "No posts yet"}</p>
      </div>
    );
  }
  
  // Group by display type for rendering
  const listPosts = posts.filter(p => p.display_type === "list");
  const cardPosts = posts.filter(p => p.display_type === "card" || !p.display_type);
  const galleryPosts = posts.filter(p => p.display_type === "gallery");
  
  return (
    <div className="p-4 space-y-6">
      {/* Gallery posts grid */}
      {galleryPosts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {galleryPosts.map(post => (
            <PostDisplayCard 
              key={post.id} 
              post={post} 
              onClick={() => onPostClick?.(post)}
            />
          ))}
        </div>
      )}
      
      {/* Card posts */}
      {cardPosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cardPosts.map(post => (
            <PostDisplayCard 
              key={post.id} 
              post={post} 
              onClick={() => onPostClick?.(post)}
            />
          ))}
        </div>
      )}
      
      {/* List posts */}
      {listPosts.length > 0 && (
        <div className="space-y-2">
          {listPosts.map(post => (
            <PostDisplayCard 
              key={post.id} 
              post={post} 
              onClick={() => onPostClick?.(post)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
