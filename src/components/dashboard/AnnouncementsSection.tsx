import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { AnnouncementCard } from "./AnnouncementCard";
import { WelcomePostComposer } from "./WelcomePostComposer";

interface WelcomePost {
  id: string;
  title: string | null;
  content: string;
  is_pinned: boolean;
  created_at: string;
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface AnnouncementsSectionProps {
  posts: WelcomePost[];
  isLoading: boolean;
  isAdmin: boolean;
}

export function AnnouncementsSection({ posts, isLoading, isAdmin }: AnnouncementsSectionProps) {
  const { language } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  const pinnedPosts = posts.filter((p) => p.is_pinned);
  const regularPosts = posts.filter((p) => !p.is_pinned);

  // Show first 2 regular posts by default
  const visibleRegularPosts = showAll ? regularPosts : regularPosts.slice(0, 2);
  const hiddenCount = regularPosts.length - 2;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4 border-b bg-muted/30">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If no posts and not admin, don't render anything
  if (posts.length === 0 && !isAdmin) {
    return null;
  }

  return (
    <div className="border-b bg-muted/30 px-4 py-3 space-y-3">
      {/* Admin composer */}
      {isAdmin && <WelcomePostComposer />}

      {/* Pinned posts (always visible) */}
      {pinnedPosts.map((post) => (
        <AnnouncementCard key={post.id} post={post} />
      ))}

      {/* Regular posts */}
      {visibleRegularPosts.map((post) => (
        <AnnouncementCard key={post.id} post={post} />
      ))}

      {/* Show more/less button */}
      {regularPosts.length > 2 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              {language === "ko" ? "접기" : "Show less"}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              {language === "ko" ? `${hiddenCount}개 더보기` : `Show ${hiddenCount} more`}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
