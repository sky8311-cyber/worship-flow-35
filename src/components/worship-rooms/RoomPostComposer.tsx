import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreatePost } from "@/hooks/useRoomPosts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Send } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type RoomPostType = Database["public"]["Enums"]["room_post_type"];

interface RoomPostComposerProps {
  roomId: string;
}

const postTypes: { value: RoomPostType; icon: string }[] = [
  { value: "prayer", icon: "🙏" },
  { value: "concern", icon: "💭" },
  { value: "note", icon: "📝" },
  { value: "testimony", icon: "✨" },
  { value: "general", icon: "💬" },
];

export function RoomPostComposer({ roomId }: RoomPostComposerProps) {
  const { t } = useTranslation();
  const createPost = useCreatePost();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<RoomPostType>("general");
  
  const handleSubmit = () => {
    if (!content.trim()) return;
    
    createPost.mutate(
      { room_id: roomId, post_type: postType, content: content.trim() },
      {
        onSuccess: () => {
          setContent("");
          setPostType("general");
        },
      }
    );
  };
  
  return (
    <Card>
      <CardContent className="pt-4">
        <Textarea
          placeholder={t("rooms.postPlaceholder")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </CardContent>
      <CardFooter className="justify-between">
        <Select value={postType} onValueChange={(v) => setPostType(v as RoomPostType)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {postTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.icon} {t(`rooms.postTypes.${type.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          onClick={handleSubmit}
          disabled={!content.trim() || createPost.isPending}
        >
          <Send className="h-4 w-4 mr-2" />
          {t("rooms.post")}
        </Button>
      </CardFooter>
    </Card>
  );
}
