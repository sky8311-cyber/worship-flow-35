import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import type { WidgetType } from "@/hooks/useStudioWidgets";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  Plus,
  Type,
  Heading1,
  Quote,
  AlertCircle,
  Image,
  Video,
  FileText,
  CheckSquare,
  List,
  ListOrdered,
  Minus,
  ExternalLink,
  Music,
  FileEdit,
  Book,
} from "lucide-react";

interface WidgetPaletteProps {
  onAddWidget: (type: WidgetType) => void;
  disabled?: boolean;
}

interface WidgetOption {
  type: WidgetType;
  icon: React.ReactNode;
  labelKo: string;
  labelEn: string;
  category: "basic" | "media" | "list" | "embed";
}

const widgetOptions: WidgetOption[] = [
  // Basic
  { type: "text", icon: <Type className="h-5 w-5" />, labelKo: "텍스트", labelEn: "Text", category: "basic" },
  { type: "heading", icon: <Heading1 className="h-5 w-5" />, labelKo: "제목", labelEn: "Heading", category: "basic" },
  { type: "quote", icon: <Quote className="h-5 w-5" />, labelKo: "인용구", labelEn: "Quote", category: "basic" },
  { type: "callout", icon: <AlertCircle className="h-5 w-5" />, labelKo: "콜아웃", labelEn: "Callout", category: "basic" },
  { type: "divider", icon: <Minus className="h-5 w-5" />, labelKo: "구분선", labelEn: "Divider", category: "basic" },
  // Media
  { type: "image", icon: <Image className="h-5 w-5" />, labelKo: "이미지", labelEn: "Image", category: "media" },
  { type: "video", icon: <Video className="h-5 w-5" />, labelKo: "영상", labelEn: "Video", category: "media" },
  { type: "song", icon: <Music className="h-5 w-5" />, labelKo: "노래", labelEn: "Song", category: "media" },
  // List
  { type: "todo", icon: <CheckSquare className="h-5 w-5" />, labelKo: "체크리스트", labelEn: "Checklist", category: "list" },
  { type: "bullet-list", icon: <List className="h-5 w-5" />, labelKo: "글머리", labelEn: "Bullet", category: "list" },
  { type: "numbered-list", icon: <ListOrdered className="h-5 w-5" />, labelKo: "번호", labelEn: "Numbered", category: "list" },
  // Embed
  { type: "post", icon: <FileText className="h-5 w-5" />, labelKo: "게시물", labelEn: "Post", category: "embed" },
  { type: "recent-drafts", icon: <FileEdit className="h-5 w-5" />, labelKo: "최근 초안", labelEn: "Recent", category: "embed" },
  { type: "external-link", icon: <ExternalLink className="h-5 w-5" />, labelKo: "외부링크", labelEn: "Link", category: "embed" },
  { type: "bible-verse", icon: <Book className="h-5 w-5" />, labelKo: "성경", labelEn: "Bible", category: "embed" },
];

const categories = [
  { key: "basic", labelKo: "📝 기본", labelEn: "📝 Basic" },
  { key: "media", labelKo: "🎨 미디어", labelEn: "🎨 Media" },
  { key: "list", labelKo: "📋 목록", labelEn: "📋 Lists" },
  { key: "embed", labelKo: "🔗 임베드", labelEn: "🔗 Embed" },
];

export function WidgetPalette({ onAddWidget, disabled }: WidgetPaletteProps) {
  const { language } = useTranslation();
  const [open, setOpen] = useState(false);
  
  const handleSelect = (type: WidgetType) => {
    onAddWidget(type);
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-dashed border-2 h-14 gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
          disabled={disabled}
        >
          <Plus className="h-5 w-5" />
          {language === "ko" ? "위젯 추가" : "Add Widget"}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-3 bg-popover" 
        align="center"
        sideOffset={8}
      >
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.key}>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 px-1">
                {language === "ko" ? cat.labelKo : cat.labelEn}
              </p>
              <div className="flex flex-wrap gap-1">
                {widgetOptions
                  .filter(opt => opt.category === cat.key)
                  .map((option) => (
                    <button
                      key={option.type}
                      onClick={() => handleSelect(option.type)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm",
                        "border border-border hover:bg-muted/80 hover:border-primary/30 transition-colors"
                      )}
                    >
                      <span className="text-primary">{option.icon}</span>
                      <span>{language === "ko" ? option.labelKo : option.labelEn}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
