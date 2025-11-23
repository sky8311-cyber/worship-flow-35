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
import { toast } from "@/hooks/use-toast";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";

interface CoverEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUrl: string | null;
}

export function CoverEditDialog({ open, onOpenChange, currentUrl }: CoverEditDialogProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadCover = async (file: File) => {
    if (!user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("common.error"),
        description: t("profile.coverSizeError"),
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `cover-${user.id}-${Math.random()}.${fileExt}`;
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
        .update({ cover_image_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({
        title: t("profile.uploadSuccess"),
        description: t("profile.coverUpdated"),
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error uploading cover:", error);
      toast({
        title: t("common.error"),
        description: t("profile.uploadError"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeCover = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user");

      const { error } = await supabase
        .from("profiles")
        .update({ cover_image_url: null })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({
        title: t("profile.removeSuccess"),
        description: t("profile.coverRemoved"),
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
      uploadCover(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("profile.editCover")}</DialogTitle>
          <DialogDescription>{t("profile.editCoverDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="w-full h-48 rounded-lg overflow-hidden bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
            {currentUrl ? (
              <img
                src={currentUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-16 h-16 text-muted-foreground" />
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
          />

          <div className="flex flex-col gap-2 w-full">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? t("profile.uploading") : t("profile.uploadCover")}
            </Button>

            {currentUrl && (
              <Button
                variant="outline"
                onClick={() => removeCover.mutate()}
                disabled={removeCover.isPending}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("profile.removeCover")}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t("profile.maxCoverSize")}
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
