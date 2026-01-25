import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreatePost } from "@/hooks/useRoomPosts";
import { useEnabledCategories } from "@/hooks/useStudioCategories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Send, PenLine, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioPostComposerProps {
  roomId: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StudioPostComposer({ roomId, isOpen, onOpenChange }: StudioPostComposerProps) {
  const { language } = useTranslation();
  const { data: categories } = useEnabledCategories();
  const createPost = useCreatePost();
  
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("general");
  const [expanded, setExpanded] = useState(false);
  
  const isExpanded = isOpen ?? expanded;
  const setIsExpanded = onOpenChange ?? setExpanded;
  
  const handleSubmit = () => {
    if (!content.trim()) return;
    
    createPost.mutate(
      { 
        room_id: roomId, 
        post_type: postType as any, 
        content: content.trim() 
      },
      {
        onSuccess: () => {
          setContent("");
          setPostType("general");
          setIsExpanded(false);
        },
      }
    );
  };
  
  const getCategoryIcon = (key: string) => {
    const icons: Record<string, string> = {
      prayer: "🙏",
      note: "📝",
      testimony: "✨",
      concern: "💭",
      general: "💬",
    };
    return icons[key] || "📄";
  };
  
  if (!isExpanded) {
    return (
      <Button 
        onClick={() => setIsExpanded(true)}
        variant="outline"
        className="w-full justify-start text-muted-foreground h-12"
      >
        <PenLine className="h-4 w-4 mr-2" />
        {language === "ko" ? "새 글 작성..." : "Write something..."}
      </Button>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <h3 className="font-medium text-sm">
          {language === "ko" ? "새 글 작성" : "Write New"}
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => setIsExpanded(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <Textarea
          placeholder={language === "ko" 
            ? "기도, 묵상, 간증을 나눠보세요..." 
            : "Share a prayer, reflection, or testimony..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="resize-none"
          autoFocus
        />
      </CardContent>
      <CardFooter className="justify-between pt-0">
        <Select value={postType} onValueChange={setPostType}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((cat) => (
              <SelectItem key={cat.key} value={cat.key}>
                {getCategoryIcon(cat.key)} {language === "ko" ? cat.label_ko : cat.label_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          onClick={handleSubmit}
          disabled={!content.trim() || createPost.isPending}
          size="sm"
        >
          <Send className="h-4 w-4 mr-2" />
          {language === "ko" ? "게시" : "Post"}
        </Button>
      </CardFooter>
    </Card>
  );
}
