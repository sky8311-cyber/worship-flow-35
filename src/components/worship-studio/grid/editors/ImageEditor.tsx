import { useState, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import type { WidgetContent } from "@/hooks/useStudioWidgets";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Image, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageEditorProps {
  content: WidgetContent;
  onChange: (content: WidgetContent) => void;
  roomId: string;
  widgetId: string;
}

export function ImageEditor({ content, onChange, roomId, widgetId }: ImageEditorProps) {
  const { language } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(language === "ko" ? "이미지 파일만 업로드할 수 있습니다." : "Only image files are allowed.");
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === "ko" ? "파일 크기는 5MB 이하여야 합니다." : "File size must be under 5MB.");
      return;
    }
    
    setIsUploading(true);
    
    try {
      const ext = file.name.split(".").pop();
      const path = `studio-widgets/${roomId}/${widgetId}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("component-images")
        .upload(path, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from("component-images")
        .getPublicUrl(path);
      
      onChange({ ...content, imageUrl: publicUrl });
      toast.success(language === "ko" ? "이미지가 업로드되었습니다." : "Image uploaded successfully.");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(language === "ko" ? "업로드 중 오류가 발생했습니다." : "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveImage = () => {
    onChange({ ...content, imageUrl: undefined, alt: undefined });
  };
  
  return (
    <div className="space-y-4">
      {/* Preview / Upload area */}
      <div className="space-y-2">
        <Label>{language === "ko" ? "이미지" : "Image"}</Label>
        
        {content.imageUrl ? (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img 
              src={content.imageUrl} 
              alt={content.alt || ""} 
              className="w-full h-auto max-h-64 object-contain bg-muted"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full aspect-video border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <span className="text-sm text-muted-foreground">
                  {language === "ko" ? "업로드 중..." : "Uploading..."}
                </span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {language === "ko" ? "클릭하여 이미지 업로드" : "Click to upload image"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {language === "ko" ? "최대 5MB" : "Max 5MB"}
                </span>
              </>
            )}
          </button>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      {/* Alt text */}
      {content.imageUrl && (
        <div className="space-y-2">
          <Label htmlFor="alt-text">{language === "ko" ? "대체 텍스트 (선택사항)" : "Alt text (optional)"}</Label>
          <Input
            id="alt-text"
            value={content.alt || ""}
            onChange={(e) => onChange({ ...content, alt: e.target.value })}
            placeholder={language === "ko" ? "이미지 설명을 입력하세요..." : "Describe the image..."}
          />
        </div>
      )}
    </div>
  );
}
