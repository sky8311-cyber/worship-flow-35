import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePostCommentStatus } from "@/hooks/usePostCommentStatus";

interface CommentButtonProps {
  postId: string;
  postType: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function CommentButton({ postId, postType, isExpanded, onToggle }: CommentButtonProps) {
  const { t } = useTranslation();
  const { totalCount, unreadCount, markAsRead } = usePostCommentStatus(postId, postType);

  // Mark as read when comments are opened
  useEffect(() => {
    if (isExpanded && unreadCount > 0) {
      markAsRead();
    }
  }, [isExpanded, unreadCount, markAsRead]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="relative"
    >
      <MessageCircle className="w-4 h-4 mr-1" />
      {t("socialFeed.comment")}
      {unreadCount > 0 ? (
        <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-destructive rounded-full">
          {unreadCount}
        </span>
      ) : totalCount > 0 ? (
        <span className="ml-1.5 text-xs text-muted-foreground">
          ({totalCount})
        </span>
      ) : null}
    </Button>
  );
}
