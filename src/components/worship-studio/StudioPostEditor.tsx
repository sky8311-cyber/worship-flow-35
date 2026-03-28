import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorshipRoom } from "@/hooks/useWorshipRoom";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateStudioPost, type BlockContent, type DisplayType } from "@/hooks/useStudioPosts";
import { StudioBlockEditor } from "./editor/StudioBlockEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ArrowLeft, Save, Send, LayoutList, LayoutGrid, Image as ImageIcon, Lock, Users, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type RoomVisibility = Database["public"]["Enums"]["room_visibility"];

interface StudioPostEditorProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export function StudioPostEditor({ onBack, onSuccess }: StudioPostEditorProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const { room } = useWorshipRoom(user?.id);
  const createPost = useCreateStudioPost();
  
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<BlockContent[]>([]);
  const [htmlContent, setHtmlContent] = useState("");
  const [displayType, setDisplayType] = useState<DisplayType>("card");
  const [coverUrl, setCoverUrl] = useState("");
  const [visibility, setVisibility] = useState<RoomVisibility>(
    (room?.visibility as RoomVisibility) || "friends"
  );
  const handleEditorChange = (newBlocks: BlockContent[], html: string) => {
    setBlocks(newBlocks);
    setHtmlContent(html);
  };
  
  const handleSave = (isDraft: boolean) => {
    if (!room) return;
    
    // Get text content from blocks for legacy content field
    const textContent = blocks
      .filter(b => b.type !== "song" && b.type !== "worship-set")
      .map(b => b.content || "")
      .join("\n");
    
    createPost.mutate({
      room_id: room.id,
      title: title || null,
      content: textContent,
      blocks,
      display_type: displayType,
      cover_image_url: coverUrl || undefined,
      is_draft: isDraft,
      visibility,
    }, {
      onSuccess: () => {
        onSuccess?.();
      }
    });
  };
  
  const displayTypeOptions = [
    { value: "list", label_en: "List", label_ko: "목록형", icon: LayoutList },
    { value: "card", label_en: "Card", label_ko: "카드형", icon: LayoutGrid },
    { value: "gallery", label_en: "Gallery", label_ko: "갤러리형", icon: ImageIcon },
  ];
  
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#faf7f2] dark:bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="font-semibold">
            {language === "ko" ? "새 글 작성" : "New Post"}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleSave(true)}
            disabled={createPost.isPending}
          >
            <Save className="h-4 w-4 mr-1.5" />
            {language === "ko" ? "임시저장" : "Save Draft"}
          </Button>
          <Button 
            size="sm"
            onClick={() => handleSave(false)}
            disabled={createPost.isPending}
          >
            <Send className="h-4 w-4 mr-1.5" />
            {language === "ko" ? "발행" : "Publish"}
          </Button>
        </div>
      </div>
      
      {/* Editor content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="max-w-2xl mx-auto p-4 space-y-6 border-t border-border/30">
          {/* Title */}
          <div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === "ko" ? "오늘의 묵상 제목..." : "Today's meditation title..."}
              className="text-xl font-semibold border-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
            />
          </div>
          
          {/* Block Editor */}
          <StudioBlockEditor
            onChange={handleEditorChange}
            className="min-h-[300px]"
          />
          
          {/* Display settings */}
          <div className="border-t border-border pt-6 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              {language === "ko" ? "표시 설정" : "Display Settings"}
            </h3>
            
            <div className="grid grid-cols-3 gap-2">
              {displayTypeOptions.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setDisplayType(option.value as DisplayType)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                      displayType === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <Icon className={cn(
                      "h-6 w-6",
                      displayType === option.value ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="text-sm">
                      {language === "ko" ? option.label_ko : option.label_en}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Cover image URL */}
            <div className="space-y-2">
              <Label className="text-sm">
                {language === "ko" ? "커버 이미지 URL (선택사항)" : "Cover Image URL (optional)"}
              </Label>
              <Input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>

            {/* Visibility selector */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {language === "ko" ? "공개 범위" : "Visibility"}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "private" as RoomVisibility, label_en: "Private", label_ko: "비공개", icon: Lock },
                  { value: "friends" as RoomVisibility, label_en: "Friends", label_ko: "친구공개", icon: Users },
                  { value: "public" as RoomVisibility, label_en: "Public", label_ko: "전체공개", icon: Globe },
                ]).map(option => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setVisibility(option.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                        visibility === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      <Icon className={cn(
                        "h-5 w-5",
                        visibility === option.value ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="text-sm">
                        {language === "ko" ? option.label_ko : option.label_en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Philosophy quote */}
          <div className="text-center py-8 text-muted-foreground/60 text-sm italic border-t border-border">
            {language === "ko" ? (
              <>
                "예배는 무대가 아닌, 삶입니다.<br />
                삶이 예배가 될 때, 사역이 빚어집니다.<br />
                이 스튜디오는 그 여정이 기록되고 나눠지는 곳입니다."
              </>
            ) : (
              <>
                "Worship is not a stage, it is life.<br />
                As life becomes worship, ministry takes shape.<br />
                This Studio is where that journey is written and shared."
              </>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
