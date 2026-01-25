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
  descKo: string;
  descEn: string;
}

const widgetOptions: WidgetOption[] = [
  {
    type: "text",
    icon: <Type className="h-5 w-5" />,
    labelKo: "텍스트",
    labelEn: "Text",
    descKo: "일반 텍스트 블록",
    descEn: "Plain text block",
  },
  {
    type: "heading",
    icon: <Heading1 className="h-5 w-5" />,
    labelKo: "제목",
    labelEn: "Heading",
    descKo: "섹션 제목",
    descEn: "Section heading",
  },
  {
    type: "quote",
    icon: <Quote className="h-5 w-5" />,
    labelKo: "인용구",
    labelEn: "Quote",
    descKo: "인용문 또는 말씀",
    descEn: "Quote or verse",
  },
  {
    type: "callout",
    icon: <AlertCircle className="h-5 w-5" />,
    labelKo: "콜아웃",
    labelEn: "Callout",
    descKo: "강조 박스",
    descEn: "Highlighted box",
  },
  {
    type: "image",
    icon: <Image className="h-5 w-5" />,
    labelKo: "이미지",
    labelEn: "Image",
    descKo: "사진 또는 그래픽",
    descEn: "Photo or graphic",
  },
  {
    type: "video",
    icon: <Video className="h-5 w-5" />,
    labelKo: "영상",
    labelEn: "Video",
    descKo: "YouTube 영상",
    descEn: "YouTube video",
  },
  {
    type: "post",
    icon: <FileText className="h-5 w-5" />,
    labelKo: "게시물",
    labelEn: "Post",
    descKo: "초안함에서 가져오기",
    descEn: "Embed from drafts",
  },
  {
    type: "todo",
    icon: <CheckSquare className="h-5 w-5" />,
    labelKo: "체크리스트",
    labelEn: "Checklist",
    descKo: "할 일 목록",
    descEn: "To-do list",
  },
  {
    type: "bullet-list",
    icon: <List className="h-5 w-5" />,
    labelKo: "글머리 기호",
    labelEn: "Bullet List",
    descKo: "점 목록",
    descEn: "Bulleted list",
  },
  {
    type: "numbered-list",
    icon: <ListOrdered className="h-5 w-5" />,
    labelKo: "번호 목록",
    labelEn: "Numbered List",
    descKo: "숫자 목록",
    descEn: "Numbered list",
  },
  {
    type: "divider",
    icon: <Minus className="h-5 w-5" />,
    labelKo: "구분선",
    labelEn: "Divider",
    descKo: "섹션 구분",
    descEn: "Section separator",
  },
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
        className="w-80 p-2 bg-popover" 
        align="center"
        sideOffset={8}
      >
        <div className="grid grid-cols-2 gap-1">
          {widgetOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => handleSelect(option.type)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                "hover:bg-muted/80"
              )}
            >
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {language === "ko" ? option.labelKo : option.labelEn}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {language === "ko" ? option.descKo : option.descEn}
                </p>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
