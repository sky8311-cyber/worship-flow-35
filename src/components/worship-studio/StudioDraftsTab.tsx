import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useRoomPosts, useCreatePost } from "@/hooks/useRoomPosts";
import { useEnabledCategories } from "@/hooks/useStudioCategories";
import { RoomPostCard } from "@/components/worship-rooms/RoomPostCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Send, PenLine, X } from "lucide-react";

interface StudioDraftsTabProps {
  roomId: string;
}

export function StudioDraftsTab({ roomId }: StudioDraftsTabProps) {
  const { language } = useTranslation();
  const { data: categories } = useEnabledCategories();
  const { data: posts, isLoading } = useRoomPosts(roomId);
  const createPost = useCreatePost();
  
  const [showComposer, setShowComposer] = useState(false);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("general");
  
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
          setShowComposer(false);
        },
      }
    );
  };
  
  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold">
            {language === "ko" ? "초안함" : "Drafts"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {language === "ko" 
              ? "여기서 작성한 글은 스튜디오 그리드에 임베드할 수 있습니다" 
              : "Posts here can be embedded in your studio grid"}
          </p>
        </div>
        
        <Button 
          onClick={() => setShowComposer(true)}
          size="sm"
          className="gap-2"
        >
          <PenLine className="h-4 w-4" />
          {language === "ko" ? "새 글" : "New Post"}
        </Button>
      </div>
      
      {/* Composer */}
      {showComposer && (
        <Card className="mb-6">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <h3 className="font-medium text-sm">
              {language === "ko" ? "새 글 작성" : "Write New"}
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setShowComposer(false)}
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
              {language === "ko" ? "저장" : "Save"}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Posts List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : posts?.length ? (
        <div className="space-y-4">
          {posts.map(post => (
            <RoomPostCard 
              key={post.id} 
              post={post} 
              roomId={roomId} 
              isOwnRoom={true} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <PenLine className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">
            {language === "ko" ? "아직 글이 없습니다" : "No drafts yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {language === "ko" 
              ? "기도, 묵상, 간증을 기록해보세요" 
              : "Write prayers, reflections, or testimonies"}
          </p>
          <Button onClick={() => setShowComposer(true)} variant="outline">
            {language === "ko" ? "첫 글 작성하기" : "Write your first post"}
          </Button>
        </div>
      )}
    </div>
  );
}
