import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, Loader2, Users } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface CommunityAvatarUploadProps {
  communityId: string;
  communityName: string;
  currentUrl?: string | null;
  onUploadSuccess: (url: string) => void;
}

export const CommunityAvatarUpload = ({ 
  communityId, 
  communityName,
  currentUrl, 
  onUploadSuccess 
}: CommunityAvatarUploadProps) => {
  const { t, language } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadAvatar = async (file: File) => {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: language === "ko" ? "파일이 너무 큽니다 (최대 5MB)" : "File too large (max 5MB)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${communityId}-avatar-${Date.now()}.${fileExt}`;
      const filePath = `community-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update community avatar_url
      const { error: updateError } = await supabase
        .from('worship_communities')
        .update({ avatar_url: data.publicUrl })
        .eq('id', communityId);

      if (updateError) throw updateError;

      onUploadSuccess(data.publicUrl);
      toast({ 
        title: language === "ko" ? "프로필 사진이 업데이트되었습니다" : "Profile photo updated" 
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: language === "ko" ? "업로드 실패" : "Upload failed",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="w-24 h-24">
        <AvatarImage src={currentUrl || undefined} />
        <AvatarFallback className="text-2xl bg-primary/10">
          <Users className="w-10 h-10 text-primary" />
        </AvatarFallback>
      </Avatar>
      
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          variant="outline"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {language === "ko" ? "업로드 중..." : "Uploading..."}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {currentUrl 
                ? (language === "ko" ? "사진 변경" : "Change photo") 
                : (language === "ko" ? "사진 업로드" : "Upload photo")}
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          {language === "ko" ? "최대 5MB (JPG, PNG, WebP)" : "Max 5MB (JPG, PNG, WebP)"}
        </p>
      </div>
    </div>
  );
};
