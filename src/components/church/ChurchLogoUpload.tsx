import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Upload, Building2, X } from "lucide-react";

interface ChurchLogoUploadProps {
  churchAccountId: string;
  currentLogoUrl: string | null;
  churchName: string;
  onUpload: (url: string | null) => void;
}

export function ChurchLogoUpload({ 
  churchAccountId, 
  currentLogoUrl, 
  churchName,
  onUpload 
}: ChurchLogoUploadProps) {
  const { language } = useLanguageContext();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(language === "ko" ? "이미지 파일만 업로드 가능합니다" : "Only image files are allowed");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === "ko" ? "파일 크기는 2MB 이하여야 합니다" : "File size must be under 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `church-logos/${churchAccountId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update church account logo_url
      const { error: updateError } = await supabase
        .from("church_accounts")
        .update({ logo_url: publicUrl })
        .eq("id", churchAccountId);

      if (updateError) throw updateError;

      onUpload(publicUrl);
      toast.success(language === "ko" ? "로고가 업로드되었습니다" : "Logo uploaded");
    } catch (error: any) {
      console.error("Logo upload error:", error);
      toast.error(language === "ko" ? "업로드 실패" : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    setUploading(true);
    try {
      const { error } = await supabase
        .from("church_accounts")
        .update({ logo_url: null })
        .eq("id", churchAccountId);

      if (error) throw error;

      onUpload(null);
      toast.success(language === "ko" ? "로고가 제거되었습니다" : "Logo removed");
    } catch (error) {
      toast.error(language === "ko" ? "제거 실패" : "Failed to remove");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="w-20 h-20 border-2 border-border">
        <AvatarImage src={currentLogoUrl || undefined} alt={churchName} />
        <AvatarFallback className="bg-muted text-muted-foreground">
          <Building2 className="w-8 h-8" />
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {language === "ko" ? "로고 업로드" : "Upload Logo"}
        </Button>

        {currentLogoUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveLogo}
            disabled={uploading}
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
            {language === "ko" ? "로고 제거" : "Remove Logo"}
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          {language === "ko" ? "권장: 200x200px, 최대 2MB" : "Recommended: 200x200px, max 2MB"}
        </p>
      </div>
    </div>
  );
}
