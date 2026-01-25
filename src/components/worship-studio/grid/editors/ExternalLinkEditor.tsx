import { useTranslation } from "@/hooks/useTranslation";
import type { WidgetContent } from "@/hooks/useStudioWidgets";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ExternalLink, Youtube, BookOpen, Globe, Share2, Link } from "lucide-react";

interface ExternalLinkEditorProps {
  content: WidgetContent;
  onChange: (content: WidgetContent) => void;
}

const LINK_TYPES = [
  { value: "youtube-channel", icon: Youtube, labelKo: "유튜브 채널", labelEn: "YouTube Channel" },
  { value: "book", icon: BookOpen, labelKo: "책", labelEn: "Book" },
  { value: "ebook", icon: BookOpen, labelKo: "전자책", labelEn: "E-Book" },
  { value: "website", icon: Globe, labelKo: "웹사이트", labelEn: "Website" },
  { value: "social", icon: Share2, labelKo: "소셜 미디어", labelEn: "Social Media" },
  { value: "other", icon: Link, labelKo: "기타", labelEn: "Other" },
] as const;

const LINK_ICONS = ["🎬", "📚", "📖", "🌐", "📱", "🎵", "🙏", "✝️", "🎤", "💿"];

export function ExternalLinkEditor({ content, onChange }: ExternalLinkEditorProps) {
  const { language } = useTranslation();
  
  const handleChange = (field: string, value: string) => {
    onChange({ ...content, [field]: value });
  };
  
  return (
    <div className="space-y-4">
      {/* Link Type */}
      <div className="space-y-2">
        <Label>{language === "ko" ? "링크 유형" : "Link Type"}</Label>
        <RadioGroup
          value={content.linkType || "other"}
          onValueChange={(value) => handleChange("linkType", value)}
          className="grid grid-cols-2 gap-2"
        >
          {LINK_TYPES.map((type) => (
            <div 
              key={type.value}
              className="flex items-center space-x-2 p-2 border border-border rounded-lg hover:bg-muted/50"
            >
              <RadioGroupItem value={type.value} id={type.value} />
              <type.icon className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor={type.value} className="cursor-pointer text-sm">
                {language === "ko" ? type.labelKo : type.labelEn}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Icon Selection */}
      <div className="space-y-2">
        <Label>{language === "ko" ? "아이콘" : "Icon"}</Label>
        <div className="flex flex-wrap gap-2">
          {LINK_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => handleChange("linkIcon", icon)}
              className={`w-10 h-10 text-xl rounded-lg border transition-colors ${
                content.linkIcon === icon
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
      
      {/* URL */}
      <div className="space-y-2">
        <Label htmlFor="link-url">{language === "ko" ? "URL" : "URL"}</Label>
        <div className="relative">
          <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="link-url"
            value={content.url || ""}
            onChange={(e) => handleChange("url", e.target.value)}
            placeholder="https://..."
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="link-title">{language === "ko" ? "제목" : "Title"}</Label>
        <Input
          id="link-title"
          value={content.linkTitle || ""}
          onChange={(e) => handleChange("linkTitle", e.target.value)}
          placeholder={language === "ko" ? "링크 제목을 입력하세요..." : "Enter link title..."}
        />
      </div>
      
      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="link-desc">{language === "ko" ? "설명 (선택사항)" : "Description (optional)"}</Label>
        <Textarea
          id="link-desc"
          value={content.linkDescription || ""}
          onChange={(e) => handleChange("linkDescription", e.target.value)}
          placeholder={language === "ko" ? "간단한 설명을 입력하세요..." : "Enter a short description..."}
          rows={2}
        />
      </div>
      
      {/* Preview */}
      {content.url && content.linkTitle && (
        <div className="space-y-2">
          <Label>{language === "ko" ? "미리보기" : "Preview"}</Label>
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{content.linkIcon || "🔗"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{content.linkTitle}</p>
                {content.linkDescription && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {content.linkDescription}
                  </p>
                )}
                <p className="text-xs text-primary mt-1 truncate">
                  {content.url}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
