import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { type StudioPost } from "@/hooks/useStudioPosts";
import { usePostComments, useCreateComment, useDeleteComment } from "@/hooks/usePostComments";
import { useTierFeature } from "@/hooks/useTierFeature";
import { LockedFeatureBanner } from "@/components/LockedFeatureBanner";
import { SongBlock } from "./editor/blocks/SongBlock";
import { WorshipSetBlock } from "./editor/blocks/WorshipSetBlock";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { Send, Trash2 } from "lucide-react";

interface PostDetailDialogProps {
  post: StudioPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostDetailDialog({ post, open, onOpenChange }: PostDetailDialogProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const { hasFeature } = useTierFeature();
  const canComment = hasFeature("studio_comment");

  const { data: comments, isLoading: commentsLoading } = usePostComments(open && post ? post.id : undefined);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const [commentBody, setCommentBody] = useState("");
  
  if (!post) return null;
  
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: language === "ko" ? ko : enUS,
  });

  const handleSubmitComment = () => {
    if (!commentBody.trim() || !post) return;
    createComment.mutate({ postId: post.id, body: commentBody.trim() }, {
      onSuccess: () => setCommentBody(""),
    });
  };
  
  // Render blocks
  const renderBlock = (block: typeof post.blocks[0], index: number) => {
    switch (block.type) {
      case "heading":
        const HeadingTag = `h${block.attrs?.level || 1}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag key={block.id || index} className="font-semibold mt-4 mb-2">
            {block.content}
          </HeadingTag>
        );
      case "paragraph":
        return (
          <p key={block.id || index} className="mb-3">
            {block.content}
          </p>
        );
      case "bullet-list":
        return (
          <ul key={block.id || index} className="list-disc list-inside mb-3">
            <li>{block.content}</li>
          </ul>
        );
      case "numbered-list":
        return (
          <ol key={block.id || index} className="list-decimal list-inside mb-3">
            <li>{block.content}</li>
          </ol>
        );
      case "quote":
        return (
          <blockquote key={block.id || index} className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-3">
            {block.content}
          </blockquote>
        );
      case "divider":
        return <hr key={block.id || index} className="my-4" />;
      case "song":
        if (block.attrs?.songId) {
          return <SongBlock key={block.id || index} songId={block.attrs.songId} />;
        }
        return null;
      case "worship-set":
        if (block.attrs?.setId) {
          return <WorshipSetBlock key={block.id || index} setId={block.attrs.setId} />;
        }
        return null;
      default:
        return null;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          {/* Cover image */}
          {post.cover_image_url && (
            <div className="aspect-video overflow-hidden">
              <img 
                src={post.cover_image_url} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-6">
            {/* Author */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback>
                  {post.author?.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {post.author?.full_name || (language === "ko" ? "익명" : "Anonymous")}
                </p>
                <p className="text-sm text-muted-foreground">{timeAgo}</p>
              </div>
            </div>
            
            {/* Title */}
            {post.title && (
              <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
            )}
            
            {/* Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {post.blocks.map((block, idx) => renderBlock(block, idx))}
            </div>
            
            {/* Reactions */}
            {post.reactions && post.reactions.some(r => r.count > 0) && (
              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border">
                {post.reactions.map(r => (
                  <button 
                    key={r.reaction_type}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {r.reaction_type === "amen" && "🙏"}
                    {r.reaction_type === "praying" && "❤️"}
                    {r.reaction_type === "like" && "👍"}
                    <span>{r.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Comments Section */}
            <div className="mt-6 pt-4 border-t border-border">
              <h3 className="text-sm font-medium mb-4">
                {language === "ko" ? "댓글" : "Comments"}
                {comments && comments.length > 0 && ` (${comments.length})`}
              </h3>

              {/* Comment list */}
              <div className="space-y-3 mb-4">
                {commentsLoading && (
                  <p className="text-sm text-muted-foreground">{language === "ko" ? "로딩 중..." : "Loading..."}</p>
                )}
                {comments?.map(comment => {
                  const commentTime = formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: language === "ko" ? ko : enUS,
                  });
                  return (
                    <div key={comment.id} className="flex gap-2.5 group">
                      <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                        <AvatarImage src={comment.author?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {comment.author?.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium">
                            {comment.author?.full_name || (language === "ko" ? "익명" : "Anonymous")}
                          </span>
                          <span className="text-xs text-muted-foreground">{commentTime}</span>
                        </div>
                        <p className="text-sm text-foreground mt-0.5">{comment.body}</p>
                      </div>
                      {user?.id === comment.author_user_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={() => deleteComment.mutate({ commentId: comment.id, postId: post.id })}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                {!commentsLoading && (!comments || comments.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    {language === "ko" ? "아직 댓글이 없습니다" : "No comments yet"}
                  </p>
                )}
              </div>

              {/* Comment input (gated) */}
              {canComment ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder={language === "ko" ? "댓글을 입력하세요..." : "Write a comment..."}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={handleSubmitComment}
                    disabled={!commentBody.trim() || createComment.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <LockedFeatureBanner feature="studio_comment" compact />
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
