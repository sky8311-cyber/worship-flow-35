import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePlus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function PostComposer() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: communities } = useQuery({
    queryKey: ["user-communities", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("community_members")
        .select("community_id, worship_communities(id, name)")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map(m => m.worship_communities).filter(Boolean);
    },
    enabled: !!user,
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("community_posts").insert({
        community_id: selectedCommunity || communities?.[0]?.id,
        author_id: user!.id,
        content: content.trim(),
        image_urls: uploadedImages.length > 0 ? uploadedImages : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("socialFeed.postSuccess"));
      setContent("");
      setUploadedImages([]);
      queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${user!.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from("profile-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("profile-images")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setUploadedImages([...uploadedImages, ...uploadedUrls]);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("common.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    postMutation.mutate();
  };

  if (!communities || communities.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback>{profile?.full_name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder={t("socialFeed.postPlaceholder")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] resize-none"
            />

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <label htmlFor="image-upload">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading}
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  <ImagePlus className="w-4 h-4 mr-2" />
                  {t("socialFeed.addPhotos")}
                </Button>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {communities.length > 1 && (
                <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={communities[0]?.name} />
                  </SelectTrigger>
                  <SelectContent>
                    {communities.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="ml-auto flex gap-2">
                {uploadedImages.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadedImages([]);
                      setContent("");
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim() || postMutation.isPending}
                >
                  {postMutation.isPending ? t("common.saving") : t("socialFeed.post")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
