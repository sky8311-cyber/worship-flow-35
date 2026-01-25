import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import type { StudioWidget, WidgetContent, WidgetType } from "@/hooks/useStudioWidgets";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageEditor } from "./editors/ImageEditor";
import { VideoEditor } from "./editors/VideoEditor";
import { PostSelector } from "./editors/PostSelector";
import { TextEditor } from "./editors/TextEditor";
import { ListEditor } from "./editors/ListEditor";
import { ExternalLinkEditor } from "./editors/ExternalLinkEditor";

interface WidgetEditDialogProps {
  widget: StudioWidget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (widgetId: string, content: WidgetContent) => void;
  roomId: string;
}

export function WidgetEditDialog({ 
  widget, 
  open, 
  onOpenChange, 
  onSave,
  roomId,
}: WidgetEditDialogProps) {
  const { language } = useTranslation();
  const [content, setContent] = useState<WidgetContent>({});
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (widget) {
      setContent(widget.content as WidgetContent);
    }
  }, [widget]);
  
  const handleSave = async () => {
    if (!widget) return;
    setIsSaving(true);
    try {
      await onSave(widget.id, content);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };
  
  const getTitle = () => {
    if (!widget) return "";
    const titles: Record<WidgetType, { ko: string; en: string }> = {
      text: { ko: "텍스트 편집", en: "Edit Text" },
      heading: { ko: "제목 편집", en: "Edit Heading" },
      quote: { ko: "인용구 편집", en: "Edit Quote" },
      callout: { ko: "콜아웃 편집", en: "Edit Callout" },
      image: { ko: "이미지 편집", en: "Edit Image" },
      video: { ko: "영상 편집", en: "Edit Video" },
      post: { ko: "게시물 선택", en: "Select Post" },
      todo: { ko: "체크리스트 편집", en: "Edit Checklist" },
      "bullet-list": { ko: "목록 편집", en: "Edit List" },
      "numbered-list": { ko: "번호 목록 편집", en: "Edit Numbered List" },
      divider: { ko: "구분선", en: "Divider" },
      "external-link": { ko: "외부 링크 편집", en: "Edit External Link" },
      song: { ko: "노래 편집", en: "Edit Song" },
      "recent-drafts": { ko: "최근 초안 설정", en: "Recent Drafts Settings" },
      gallery: { ko: "갤러리 편집", en: "Edit Gallery" },
      "bible-verse": { ko: "성경 말씀 편집", en: "Edit Bible Verse" },
      "profile-card": { ko: "프로필 카드 편집", en: "Edit Profile Card" },
    };
    return titles[widget.widget_type]?.[language] || (language === "ko" ? "위젯 편집" : "Edit Widget");
  };
  
  const renderEditor = () => {
    if (!widget) return null;
    
    switch (widget.widget_type) {
      case "text":
      case "heading":
      case "quote":
      case "callout":
        return (
          <TextEditor
            widgetType={widget.widget_type}
            content={content}
            onChange={setContent}
          />
        );
      
      case "image":
        return (
          <ImageEditor
            content={content}
            onChange={setContent}
            roomId={roomId}
            widgetId={widget.id}
          />
        );
      
      case "video":
        return (
          <VideoEditor
            content={content}
            onChange={setContent}
          />
        );
      
      case "post":
        return (
          <PostSelector
            roomId={roomId}
            selectedPostId={content.postId || widget.post_id || undefined}
            onSelect={(postId) => setContent({ ...content, postId })}
          />
        );
      
      case "todo":
      case "bullet-list":
      case "numbered-list":
        return (
          <ListEditor
            widgetType={widget.widget_type}
            content={content}
            onChange={setContent}
          />
        );
      
      case "external-link":
        return (
          <ExternalLinkEditor
            content={content}
            onChange={setContent}
          />
        );
      
      case "divider":
        return (
          <div className="py-8 text-center text-muted-foreground">
            {language === "ko" ? "구분선은 별도 설정이 필요 없습니다." : "Divider doesn't need configuration."}
          </div>
        );
      
      default:
        return (
          <div className="py-8 text-center text-muted-foreground">
            {language === "ko" ? "이 위젯 타입은 아직 편집을 지원하지 않습니다." : "This widget type doesn't support editing yet."}
          </div>
        );
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {renderEditor()}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "ko" ? "취소" : "Cancel"}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving 
              ? (language === "ko" ? "저장 중..." : "Saving...")
              : (language === "ko" ? "저장" : "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
