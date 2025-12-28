import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Pin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";

export function WelcomePostComposer() {
  const { user } = useAuth();
  const { language } = useTranslation();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("welcome_posts").insert({
        author_id: user?.id,
        title: title.trim() || null,
        content: content.trim(),
        is_pinned: isPinned,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "환영 게시물이 작성되었습니다" : "Welcome post created");
      setTitle("");
      setContent("");
      setIsPinned(false);
      setIsExpanded(false);
      queryClient.invalidateQueries({ queryKey: ["welcome-posts"] });
    },
    onError: (error) => {
      console.error("Create welcome post error:", error);
      toast.error(language === "ko" ? "게시물 작성에 실패했습니다" : "Failed to create post");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error(language === "ko" ? "내용을 입력하세요" : "Please enter content");
      return;
    }
    createPostMutation.mutate();
  };

  if (!isExpanded) {
    return (
      <Card
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(true)}
      >
        <CardContent className="py-4">
          <p className="text-muted-foreground text-sm">
            {language === "ko"
              ? "✨ 새 환영 게시물 작성하기 (관리자 전용)"
              : "✨ Write a new welcome post (Admin only)"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {language === "ko" ? "환영 게시물 작성" : "Create Welcome Post"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder={language === "ko" ? "제목 (선택사항)" : "Title (optional)"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder={
              language === "ko"
                ? "새 유저들에게 전할 메시지를 작성하세요..."
                : "Write a message for new users..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="pin-post"
                checked={isPinned}
                onCheckedChange={setIsPinned}
              />
              <Label htmlFor="pin-post" className="flex items-center gap-1 text-sm cursor-pointer">
                <Pin className="w-4 h-4" />
                {language === "ko" ? "상단 고정" : "Pin to top"}
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsExpanded(false);
                  setTitle("");
                  setContent("");
                  setIsPinned(false);
                }}
              >
                {language === "ko" ? "취소" : "Cancel"}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!content.trim() || createPostMutation.isPending}
              >
                <Send className="w-4 h-4 mr-1" />
                {language === "ko" ? "게시" : "Post"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
