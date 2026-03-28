import { useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useStudioPosts, type StudioPost, type BlockType } from "@/hooks/useStudioPosts";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";

const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  song: "#7c6a9e",
  worship_set: "#b8902a",
  scripture: "#4a7c6a",
  prayer_note: "#8b5e52",
  audio: "#3a6b8a",
  note: "#6b6560",
};

interface StudioArchiveViewProps {
  roomId?: string;
  onPostClick?: (post: StudioPost) => void;
}

export function StudioArchiveView({ roomId, onPostClick }: StudioArchiveViewProps) {
  const { language } = useTranslation();
  const { data: posts, isLoading } = useStudioPosts(roomId, false);

  const publishedPosts = useMemo(() => {
    if (!posts) return [];
    return posts.filter(p => p.workflow_stage === "published" || !p.is_draft);
  }, [posts]);

  if (isLoading) {
    return (
      <div className="p-4 grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (publishedPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-lg text-muted-foreground/40 mb-4">✦</span>
        <p className="text-sm text-muted-foreground italic">
          {language === "ko" ? "아직 발행된 작품이 없습니다" : "No published works yet"}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {publishedPosts.map(post => {
          const blockType: BlockType = post.block_type || "note";
          const barColor = BLOCK_TYPE_COLORS[blockType];
          const textBlocks = post.blocks.filter(b => b.type === "paragraph" || b.type === "heading");
          const preview = textBlocks.map(b => b.content).join(" ").slice(0, 200);
          const timeAgo = formatDistanceToNow(new Date(post.created_at), {
            addSuffix: true,
            locale: language === "ko" ? ko : enUS,
          });

          return (
            <button
              key={post.id}
              onClick={() => onPostClick?.(post)}
              className="text-left rounded-xl bg-[#fefcf8] dark:bg-card shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Block type color bar */}
              <div className="h-2 w-full" style={{ backgroundColor: barColor }} />
              
              {post.cover_image_url && (
                <div className="aspect-video overflow-hidden">
                  <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="p-4">
                <h3 className="font-serif text-xl text-[#2c2416] dark:text-foreground mb-2">
                  {post.title || (language === "ko" ? "제목 없음" : "Untitled")}
                </h3>
                {preview && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{preview}</p>
                )}
                <span className="text-[11px] text-muted-foreground/60">{timeAgo}</span>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
