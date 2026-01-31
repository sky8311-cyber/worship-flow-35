import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Send, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SupportChatInputProps {
  onSend: (content: string, imageUrls?: string[]) => void;
  isLoading?: boolean;
}

export function SupportChatInput({ onSend, isLoading }: SupportChatInputProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user?.id) return;

    setIsUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        continue;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("support-attachments")
        .upload(fileName, file);

      if (error) {
        // Bucket might not exist, create it or show error
        toast.error("Failed to upload image");
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("support-attachments")
        .getPublicUrl(fileName);

      if (urlData) {
        newImages.push(urlData.publicUrl);
      }
    }

    setUploadedImages((prev) => [...prev, ...newImages]);
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if ((!content.trim() && uploadedImages.length === 0) || isLoading) return;

    onSend(content.trim(), uploadedImages);
    setContent("");
    setUploadedImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3">
      {/* Image previews */}
      {uploadedImages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {uploadedImages.map((url, idx) => (
            <div key={idx} className="relative">
              <img
                src={url}
                alt=""
                className="h-16 w-16 object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </Button>

        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={handleKeyDown}
          className="flex-1"
          disabled={isLoading}
          enterKeyHint="send"
          onFocus={(e) => {
            // Skip scrollIntoView inside fixed overlay (e.g., AdminSupport mobile)
            const isInsideOverlay = e.target.closest('[data-support-overlay]');
            if (!isInsideOverlay) {
              setTimeout(() => {
                e.target.scrollIntoView({ block: "center", behavior: "smooth" });
              }, 300);
            }
          }}
        />

        <Button
          type="button"
          size="icon"
          className="flex-shrink-0"
          onClick={handleSubmit}
          disabled={isLoading || (!content.trim() && uploadedImages.length === 0)}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
