import { useTranslation } from "@/hooks/useTranslation";
import type { StudioWidget, WidgetContent } from "@/hooks/useStudioWidgets";
import { cn } from "@/lib/utils";
import { 
  Quote, 
  AlertCircle, 
  CheckSquare, 
  Square,
  GripVertical,
  MoreHorizontal,
  Trash2,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WidgetRendererProps {
  widget: StudioWidget;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  dragHandleProps?: any;
}

export function WidgetRenderer({ 
  widget, 
  isOwner = false,
  onEdit,
  onDelete,
  dragHandleProps,
}: WidgetRendererProps) {
  const { language } = useTranslation();
  const content = widget.content as WidgetContent;
  
  const renderContent = () => {
    switch (widget.widget_type) {
      case "text":
        return (
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {content.text || (language === "ko" ? "텍스트를 입력하세요..." : "Enter text...")}
          </p>
        );
      
      case "heading":
        const HeadingTag = `h${content.level || 1}` as keyof JSX.IntrinsicElements;
        const headingClasses = {
          1: "text-2xl font-bold",
          2: "text-xl font-semibold",
          3: "text-lg font-medium",
        };
        return (
          <HeadingTag className={cn(headingClasses[content.level || 1], "text-foreground")}>
            {content.text || (language === "ko" ? "제목" : "Heading")}
          </HeadingTag>
        );
      
      case "quote":
        return (
          <blockquote className="border-l-4 border-primary/50 pl-4 py-2 italic text-muted-foreground">
            <Quote className="h-4 w-4 mb-2 text-primary/50" />
            <p className="text-sm">
              {content.text || (language === "ko" ? "인용구를 입력하세요..." : "Enter quote...")}
            </p>
          </blockquote>
        );
      
      case "callout":
        return (
          <div 
            className={cn(
              "rounded-lg p-4 flex gap-3",
              content.backgroundColor || "bg-amber-50 dark:bg-amber-950/30"
            )}
          >
            <span className="text-xl">{content.icon || "💡"}</span>
            <p className="text-sm flex-1">
              {content.text || (language === "ko" ? "콜아웃 내용..." : "Callout content...")}
            </p>
          </div>
        );
      
      case "image":
        return content.imageUrl ? (
          <div className="rounded-lg overflow-hidden">
            <img 
              src={content.imageUrl} 
              alt={content.alt || ""} 
              className="w-full h-auto object-cover"
            />
            {content.alt && (
              <p className="text-xs text-muted-foreground mt-2 text-center">{content.alt}</p>
            )}
          </div>
        ) : (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {language === "ko" ? "이미지 추가" : "Add image"}
            </p>
          </div>
        );
      
      case "video":
        if (content.videoUrl) {
          const videoId = extractYouTubeId(content.videoUrl);
          if (videoId) {
            return (
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            );
          }
        }
        return (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {language === "ko" ? "영상 URL 추가" : "Add video URL"}
            </p>
          </div>
        );
      
      case "todo":
      case "bullet-list":
      case "numbered-list":
        const items = content.items || [];
        return (
          <ul className={cn(
            "space-y-1.5",
            widget.widget_type === "numbered-list" && "list-decimal list-inside"
          )}>
            {items.length > 0 ? items.map((item, idx) => (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                {widget.widget_type === "todo" ? (
                  item.checked ? (
                    <CheckSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )
                ) : widget.widget_type === "bullet-list" ? (
                  <span className="text-primary mt-0.5">•</span>
                ) : null}
                <span className={cn(item.checked && "line-through text-muted-foreground")}>
                  {item.text}
                </span>
              </li>
            )) : (
              <li className="text-sm text-muted-foreground">
                {language === "ko" ? "항목 추가..." : "Add items..."}
              </li>
            )}
          </ul>
        );
      
      case "divider":
        return <hr className="border-t border-border my-2" />;
      
      case "post":
        // Post widget will be handled separately with actual post data
        return (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {language === "ko" ? "게시물 임베드" : "Embedded post"}
            </p>
          </div>
        );
      
      default:
        return (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Unknown widget type: {widget.widget_type}
            </p>
          </div>
        );
    }
  };
  
  return (
    <div 
      className={cn(
        "group relative bg-card rounded-xl p-4 shadow-sm border border-border/50",
        "hover:shadow-md hover:border-border transition-all duration-200",
        widget.widget_type === "divider" && "p-2 bg-transparent shadow-none border-none"
      )}
    >
      {/* Drag handle & menu (only for owner) */}
      {isOwner && widget.widget_type !== "divider" && (
        <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          {dragHandleProps && (
            <button
              {...dragHandleProps}
              className="p-1.5 rounded-md bg-background border border-border shadow-sm cursor-grab active:cursor-grabbing hover:bg-muted"
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-md bg-background border border-border shadow-sm hover:bg-muted">
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  {language === "ko" ? "편집" : "Edit"}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === "ko" ? "삭제" : "Delete"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      {renderContent()}
    </div>
  );
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}
