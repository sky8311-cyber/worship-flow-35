import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Upload, Trash2 } from "lucide-react";

interface AvatarEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUrl: string | null;
}

export function AvatarEditDialog({ open, onOpenChange, currentUrl }: AvatarEditDialogProps) {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (file: File) => {
    if (!user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t("common.error"),
        description: t("profile.fileSizeError"),
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("profile-images")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({
        title: t("profile.uploadSuccess"),
        description: t("profile.avatarUpdated"),
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: t("common.error"),
        description: t("profile.uploadError"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user");

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({
        title: t("profile.removeSuccess"),
        description: t("profile.avatarRemoved"),
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("profile.removeError"),
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("profile.editAvatar")}</DialogTitle>
          <DialogDescription>{t("profile.editAvatarDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <Avatar className="w-32 h-32">
            <AvatarImage src={currentUrl || undefined} />
            <AvatarFallback className="text-4xl">
              {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex flex-col gap-2 w-full">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? t("profile.uploading") : t("profile.uploadPhoto")}
            </Button>

            {currentUrl && (
              <Button
                variant="outline"
                onClick={() => removeAvatar.mutate()}
                disabled={removeAvatar.isPending}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("profile.removePhoto")}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t("profile.maxFileSize")}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
