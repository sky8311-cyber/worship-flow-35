import { useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useStudioPosts, type StudioPost, type WorkflowStage } from "@/hooks/useStudioPosts";
import { PostDisplayCard } from "./PostDisplayCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudioBoardViewProps {
  roomId?: string;
  onPostClick?: (post: StudioPost) => void;
}

const COLUMNS: { stage: WorkflowStage; labelKo: string; labelEn: string; bg: string }[] = [
  { stage: "draft", labelKo: "초안", labelEn: "Draft", bg: "bg-gray-50/50 dark:bg-muted/20" },
  { stage: "in_progress", labelKo: "진행중", labelEn: "In Progress", bg: "bg-amber-50/30 dark:bg-amber-900/10" },
  { stage: "refined", labelKo: "완성", labelEn: "Refined", bg: "bg-[#f0e8d5]/30 dark:bg-[#3d3520]/20" },
];

export function StudioBoardView({ roomId, onPostClick }: StudioBoardViewProps) {
  const { language } = useTranslation();
  const { data: posts, isLoading } = useStudioPosts(roomId, true);

  const columns = useMemo(() => {
    if (!posts) return COLUMNS.map(c => ({ ...c, posts: [] as StudioPost[] }));
    // Exclude published from board view
    return COLUMNS.map(col => ({
      ...col,
      posts: posts.filter(p => p.workflow_stage === col.stage),
    }));
  }, [posts]);

  if (isLoading) {
    return (
      <div className="p-4 grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
          {columns.map(col => (
            <div key={col.stage} className={`rounded-xl p-3 ${col.bg}`}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {language === "ko" ? col.labelKo : col.labelEn}
                <span className="ml-1.5 text-xs opacity-60">{col.posts.length}</span>
              </h3>
              <div className="space-y-3">
                {col.posts.map(post => (
                  <PostDisplayCard
                    key={post.id}
                    post={post}
                    onClick={() => onPostClick?.(post)}
                  />
                ))}
                {col.posts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground/40 text-xs italic">
                    {language === "ko" ? "비어있음" : "Empty"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
