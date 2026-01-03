import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Upload, Loader2, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { creditCoverPhotoReward } from "@/lib/rewardsHelper";

interface CoverImageUploadProps {
  currentUrl?: string | null;
  onUploadSuccess: (url: string) => void;
}

export const CoverImageUpload = ({ currentUrl, onUploadSuccess }: CoverImageUploadProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadCover = async (file: File) => {
    if (!user) return;

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
      const fileName = `${user.id}-cover-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

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

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_image_url: data.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onUploadSuccess(data.publicUrl);
      toast({ title: t("profile.coverUpdated") });
      
      // Credit K-Seed reward for cover photo (fire-and-forget)
      creditCoverPhotoReward(user.id);
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
      uploadCover(file);
    }
  };

  const removeCover = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ cover_image_url: null })
        .eq('id', user.id);

      if (error) throw error;

      onUploadSuccess("");
      toast({ title: t("profile.coverRemoved") });
    } catch (error) {
      toast({
        title: t("profile.removeError"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {currentUrl && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden">
          <img 
            src={currentUrl} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={removeCover}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
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
      </div>
      <p className="text-sm text-muted-foreground">
        {t("profile.recommendedCoverSize")}
      </p>
    </div>
  );
};
