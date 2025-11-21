import { useState, useRef, useCallback } from "react";
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
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { Upload, Trash2, Check, X } from "lucide-react";
import Cropper from "react-easy-crop";
import { Point, Area } from "react-easy-crop";

interface AvatarEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUrl: string | null;
}

export function AvatarEditDialog({ open, onOpenChange, currentUrl }: AvatarEditDialogProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Set canvas size to 512x512 for optimized avatar
    const size = 512;
    canvas.width = size;
    canvas.height = size;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      size,
      size
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas is empty"));
        }
      }, "image/jpeg", 0.9);
    });
  };

  const uploadAvatar = async (croppedBlob: Blob) => {
    if (!user) return;

    setUploading(true);

    try {
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, croppedBlob, { upsert: true });

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
      await refreshProfile();
      toast({
        title: t("profile.uploadSuccess"),
        description: t("profile.avatarUpdated"),
      });
      setImageSrc(null);
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

  const handleApplyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      await uploadAvatar(croppedBlob);
    } catch (error) {
      console.error("Error cropping image:", error);
      toast({
        title: t("common.error"),
        description: t("profile.uploadError"),
        variant: "destructive",
      });
    }
  };

  const handleCancelCrop = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
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
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      await refreshProfile();
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
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t("common.error"),
          description: t("profile.fileSizeError"),
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("profile.editAvatar")}</DialogTitle>
          <DialogDescription>{t("profile.editAvatarDescription")}</DialogDescription>
        </DialogHeader>

        {imageSrc ? (
          <div className="flex flex-col gap-4">
            <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{t("profile.zoom" as any)}</label>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleApplyCrop}
                disabled={uploading}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                {uploading ? t("profile.uploading") : t("profile.apply" as any)}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelCrop}
                disabled={uploading}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        ) : (
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
                {t("profile.uploadPhoto")}
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
        )}

        {!imageSrc && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
