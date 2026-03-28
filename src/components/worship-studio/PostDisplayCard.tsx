import { useState, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useStudioPosts, type StudioPost, type DisplayType, type WorkflowStage, type BlockType } from "@/hooks/useStudioPosts";
import { useEnabledCategories } from "@/hooks/useStudioCategories";
import { SongBlock } from "./editor/blocks/SongBlock";
import { WorshipSetBlock } from "./editor/blocks/WorshipSetBlock";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchInput } from "@/components/ui/search-input";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { FileText, Music, Calendar, Image as ImageIcon, BookOpen, Heart, Mic, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  song: "#7c6a9e",
  worship_set: "#b8902a",
  scripture: "#4a7c6a",
  prayer_note: "#8b5e52",
  audio: "#3a6b8a",
  note: "#6b6560",
};

const BLOCK_TYPE_ICONS: Record<BlockType, React.ReactNode> = {
  song: <Music className="h-3.5 w-3.5" />,
  worship_set: <Calendar className="h-3.5 w-3.5" />,
  scripture: <BookOpen className="h-3.5 w-3.5" />,
  prayer_note: <Heart className="h-3.5 w-3.5" />,
  audio: <Mic className="h-3.5 w-3.5" />,
  note: <StickyNote className="h-3.5 w-3.5" />,
};

const BLOCK_TYPE_LABELS: Record<BlockType, { ko: string; en: string }> = {
  song: { ko: "곡", en: "Song" },
  worship_set: { ko: "워십셋", en: "Set" },
  scripture: { ko: "말씀", en: "Scripture" },
  prayer_note: { ko: "기도노트", en: "Prayer" },
  audio: { ko: "오디오", en: "Audio" },
  note: { ko: "노트", en: "Note" },
};

function StageBadge({ stage, language }: { stage: WorkflowStage; language: string }) {
  const config: Record<WorkflowStage, { bg: string; text: string; label: { ko: string; en: string } }> = {
    draft: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400", label: { ko: "초안", en: "Draft" } },
    in_progress: { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: { ko: "진행중", en: "In Progress" } },
    refined: { bg: "bg-[#f0e8d5] dark:bg-[#3d3520]", text: "text-[#8b6914] dark:text-[#c9a033]", label: { ko: "완성", en: "Refined" } },
    published: { bg: "bg-[#b8902a]/10", text: "text-[#b8902a] font-medium", label: { ko: "발행", en: "Published" } },
  };
  const c = config[stage];
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px]", c.bg, c.text)}>
      {language === "ko" ? c.label.ko : c.label.en}
    </span>
  );
}

interface PostDisplayCardProps {
  post: StudioPost;
  onClick?: () => void;
}

export function PostDisplayCard({ post, onClick }: PostDisplayCardProps) {
  const { language } = useTranslation();
  
  const displayType = post.display_type || "card";
  const blockType: BlockType = post.block_type || "note";
  const workflowStage: WorkflowStage = post.workflow_stage || "draft";
  const borderColor = BLOCK_TYPE_COLORS[blockType];
  
  const textBlocks = post.blocks.filter(b => 
    b.type === "paragraph" || b.type === "heading"
  );
  const preview = textBlocks.map(b => b.content).join(" ").slice(0, 150);
  
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: language === "ko" ? ko : enUS,
  });
  
  if (displayType === "list") {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-4 p-4 rounded-lg bg-[#fefcf8] dark:bg-card hover:shadow-md transition-all text-left"
        style={{ borderLeft: `4px solid ${borderColor}` }}
      >
        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center" style={{ color: borderColor, backgroundColor: `${borderColor}15` }}>
          {BLOCK_TYPE_ICONS[blockType]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-medium truncate text-[#2c2416] dark:text-foreground">
            {post.title || (language === "ko" ? "제목 없음" : "Untitled")}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{preview || "..."}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <StageBadge stage={workflowStage} language={language} />
          <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
        </div>
      </button>
    );
  }
  
  if (displayType === "gallery") {
    return (
      <button
        onClick={onClick}
        className="group relative aspect-square rounded-lg overflow-hidden hover:shadow-md transition-all"
        style={{ borderLeft: `4px solid ${borderColor}` }}
      >
        {post.cover_image_url ? (
          <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#fefcf8] dark:bg-card flex items-center justify-center">
            <div style={{ color: borderColor }}>{BLOCK_TYPE_ICONS[blockType]}</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white font-serif font-medium truncate text-sm">
              {post.title || (language === "ko" ? "제목 없음" : "Untitled")}
            </h3>
          </div>
        </div>
      </button>
    );
  }
  
  // Card view (default) — Material Block
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg bg-[#fefcf8] dark:bg-card shadow-sm hover:shadow-md transition-all overflow-hidden"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      {post.cover_image_url && (
        <div className="aspect-video overflow-hidden">
          <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        {/* Top row: block type + stage */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: borderColor }}>
            {BLOCK_TYPE_ICONS[blockType]}
            <span>{language === "ko" ? BLOCK_TYPE_LABELS[blockType].ko : BLOCK_TYPE_LABELS[blockType].en}</span>
          </div>
          <StageBadge stage={workflowStage} language={language} />
        </div>
        
        {/* Title */}
        <h3 className="font-serif text-lg text-[#2c2416] dark:text-foreground mb-1">
          {post.title || (language === "ko" ? "제목 없음" : "Untitled")}
        </h3>
        
        {/* Preview */}
        {preview && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{preview}</p>
        )}
        
        {/* Reactions */}
        {post.reactions && post.reactions.some(r => r.count > 0) && (
          <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
            {post.reactions.filter(r => r.count > 0).map(r => (
              <span key={r.reaction_type} className="flex items-center gap-1">
                {r.reaction_type === "amen" && "🙏"}
                {r.reaction_type === "praying" && "❤️"}
                {r.reaction_type === "like" && "👍"}
                {r.count}
              </span>
            ))}
          </div>
        )}
        
        {/* Footer: date */}
        <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
      </div>
    </button>
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
  const { data: categories } = useEnabledCategories();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Filter posts
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    let result = posts;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.content && p.content.toLowerCase().includes(q))
      );
    }

    if (activeCategory) {
      result = result.filter(p => p.post_type === activeCategory);
    }

    return result;
  }, [posts, searchQuery, activeCategory]);
  
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
  const listPosts = filteredPosts.filter(p => p.display_type === "list");
  const cardPosts = filteredPosts.filter(p => p.display_type === "card" || !p.display_type);
  const galleryPosts = filteredPosts.filter(p => p.display_type === "gallery");
  
  return (
    <div className="p-4 space-y-4">
      {/* Search & Category Filters */}
      <div className="space-y-3">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
          placeholder={language === "ko" ? "게시물 검색..." : "Search posts..."}
        />
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                !activeCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {language === "ko" ? "전체" : "All"}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                {language === "ko" ? cat.label_ko : cat.label_en}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* No results */}
      {filteredPosts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>{language === "ko" ? "검색 결과가 없습니다" : "No matching posts"}</p>
        </div>
      )}

      {/* Gallery posts grid */}
      {galleryPosts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {galleryPosts.map(post => (
            <PostDisplayCard key={post.id} post={post} onClick={() => onPostClick?.(post)} />
          ))}
        </div>
      )}
      
      {/* Card posts */}
      {cardPosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cardPosts.map(post => (
            <PostDisplayCard key={post.id} post={post} onClick={() => onPostClick?.(post)} />
          ))}
        </div>
      )}
      
      {/* List posts */}
      {listPosts.length > 0 && (
        <div className="space-y-2">
          {listPosts.map(post => (
            <PostDisplayCard key={post.id} post={post} onClick={() => onPostClick?.(post)} />
          ))}
        </div>
      )}
    </div>
  );
}
