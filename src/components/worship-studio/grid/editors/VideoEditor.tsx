import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import type { WidgetContent } from "@/hooks/useStudioWidgets";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Video, ExternalLink } from "lucide-react";

interface VideoEditorProps {
  content: WidgetContent;
  onChange: (content: WidgetContent) => void;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

export function VideoEditor({ content, onChange }: VideoEditorProps) {
  const { language } = useTranslation();
  const [urlInput, setUrlInput] = useState(content.videoUrl || "");
  const [preview, setPreview] = useState<{ platform: "youtube" | "vimeo"; id: string } | null>(null);
  
  useEffect(() => {
    setUrlInput(content.videoUrl || "");
  }, [content.videoUrl]);
  
  useEffect(() => {
    // Parse URL and set preview
    const youtubeId = extractYouTubeId(urlInput);
    if (youtubeId) {
      setPreview({ platform: "youtube", id: youtubeId });
      return;
    }
    
    const vimeoId = extractVimeoId(urlInput);
    if (vimeoId) {
      setPreview({ platform: "vimeo", id: vimeoId });
      return;
    }
    
    setPreview(null);
  }, [urlInput]);
  
  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    
    const youtubeId = extractYouTubeId(url);
    if (youtubeId) {
      onChange({ ...content, videoUrl: url, platform: "youtube" });
      return;
    }
    
    const vimeoId = extractVimeoId(url);
    if (vimeoId) {
      onChange({ ...content, videoUrl: url, platform: "vimeo" });
      return;
    }
    
    onChange({ ...content, videoUrl: url });
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="video-url">{language === "ko" ? "영상 URL" : "Video URL"}</Label>
        <div className="relative">
          <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="video-url"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {language === "ko" 
            ? "YouTube 또는 Vimeo 영상 URL을 입력하세요." 
            : "Enter a YouTube or Vimeo video URL."}
        </p>
      </div>
      
      {/* Preview */}
      {preview && (
        <div className="space-y-2">
          <Label>{language === "ko" ? "미리보기" : "Preview"}</Label>
          <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted">
            {preview.platform === "youtube" ? (
              <img 
                src={`https://img.youtube.com/vi/${preview.id}/mqdefault.jpg`}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            <span className="capitalize">{preview.platform}</span>
            <span>• ID: {preview.id}</span>
          </div>
        </div>
      )}
      
      {urlInput && !preview && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {language === "ko" 
              ? "올바른 YouTube 또는 Vimeo URL을 입력해주세요." 
              : "Please enter a valid YouTube or Vimeo URL."}
          </p>
        </div>
      )}
    </div>
  );
}
