import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface AvatarUploadProps {
  currentUrl?: string | null;
  onUploadSuccess: (url: string) => void;
}

export const AvatarUpload = ({ currentUrl, onUploadSuccess }: AvatarUploadProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadAvatar = async (file: File) => {
    if (!user) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("profile.fileTooLarge"),
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-avatar-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

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

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onUploadSuccess(data.publicUrl);
      toast({ title: t("profile.avatarUpdated") });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t("profile.uploadError"),
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
        <AvatarFallback className="text-2xl">
          {user?.email?.[0].toUpperCase()}
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
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("profile.uploading")}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {currentUrl ? t("profile.changeImage") : t("profile.uploadImage")}
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          {t("profile.maxFileSize")}
        </p>
      </div>
    </div>
  );
};
