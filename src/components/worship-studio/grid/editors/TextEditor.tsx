import { useTranslation } from "@/hooks/useTranslation";
import type { WidgetContent, WidgetType } from "@/hooks/useStudioWidgets";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface TextEditorProps {
  widgetType: WidgetType;
  content: WidgetContent;
  onChange: (content: WidgetContent) => void;
}

const CALLOUT_ICONS = ["💡", "⚠️", "✅", "❓", "📝", "🔔", "⭐", "🙏", "❤️", "🎵"];

export function TextEditor({ widgetType, content, onChange }: TextEditorProps) {
  const { language } = useTranslation();
  
  const handleTextChange = (text: string) => {
    onChange({ ...content, text });
  };
  
  const handleLevelChange = (level: string) => {
    onChange({ ...content, level: parseInt(level) as 1 | 2 | 3 });
  };
  
  const handleIconChange = (icon: string) => {
    onChange({ ...content, icon });
  };
  
  if (widgetType === "heading") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{language === "ko" ? "제목 크기" : "Heading Size"}</Label>
          <RadioGroup
            value={String(content.level || 1)}
            onValueChange={handleLevelChange}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="h1" />
              <Label htmlFor="h1" className="text-2xl font-bold cursor-pointer">H1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2" id="h2" />
              <Label htmlFor="h2" className="text-xl font-semibold cursor-pointer">H2</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="h3" />
              <Label htmlFor="h3" className="text-lg font-medium cursor-pointer">H3</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-2">
          <Label>{language === "ko" ? "제목 텍스트" : "Heading Text"}</Label>
          <Input
            value={content.text || ""}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={language === "ko" ? "제목을 입력하세요..." : "Enter heading..."}
          />
        </div>
      </div>
    );
  }
  
  if (widgetType === "callout") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{language === "ko" ? "아이콘 선택" : "Select Icon"}</Label>
          <div className="flex flex-wrap gap-2">
            {CALLOUT_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => handleIconChange(icon)}
                className={`w-10 h-10 text-xl rounded-lg border transition-colors ${
                  content.icon === icon
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>{language === "ko" ? "내용" : "Content"}</Label>
          <Textarea
            value={content.text || ""}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={language === "ko" ? "콜아웃 내용을 입력하세요..." : "Enter callout content..."}
            rows={3}
          />
        </div>
      </div>
    );
  }
  
  // Default: text or quote
  return (
    <div className="space-y-2">
      <Label>
        {widgetType === "quote" 
          ? (language === "ko" ? "인용구" : "Quote")
          : (language === "ko" ? "텍스트" : "Text")}
      </Label>
      <Textarea
        value={content.text || ""}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={
          widgetType === "quote"
            ? (language === "ko" ? "인용구를 입력하세요..." : "Enter quote...")
            : (language === "ko" ? "텍스트를 입력하세요..." : "Enter text...")
        }
        rows={widgetType === "quote" ? 4 : 6}
        className={widgetType === "quote" ? "italic" : ""}
      />
    </div>
  );
}
