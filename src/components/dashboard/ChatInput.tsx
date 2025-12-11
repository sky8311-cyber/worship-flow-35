import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePlus, Send, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function ChatInput() {
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
      return data.map((m) => m.worship_communities).filter(Boolean);
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

        const { error: uploadError } = await supabase.storage
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!communities || communities.length === 0) return null;

  return (
    <div className="sticky bottom-0 bg-background border-t z-10">
      {/* Image preview row */}
      {uploadedImages.length > 0 && (
        <div className="flex gap-2 px-4 py-2 border-b overflow-x-auto">
          {uploadedImages.map((url, index) => (
            <div key={index} className="relative shrink-0">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-1 -right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* First row: Avatar, community selector, image upload, send button */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback>{profile?.full_name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>

          {/* Community selector (if multiple) */}
          {communities.length > 1 && (
            <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
              <SelectTrigger className="w-[120px] h-9 text-xs shrink-0">
                <SelectValue placeholder={communities[0]?.name?.substring(0, 10) + "..."} />
              </SelectTrigger>
              <SelectContent>
                {communities.map((c: any) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Image upload button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={uploading}
            onClick={() => document.getElementById("chat-image-upload")?.click()}
          >
            <ImagePlus className="w-5 h-5" />
          </Button>
          <input
            id="chat-image-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Send button */}
        <Button
          size="icon"
          className="h-9 w-9 rounded-full shrink-0"
          onClick={handleSubmit}
          disabled={!content.trim() || postMutation.isPending}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Second row: Full-width text input */}
      <div className="px-3 pb-3 pt-2">
        <Input
          placeholder={t("socialFeed.postPlaceholder")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-full h-10"
          disabled={postMutation.isPending}
        />
      </div>
    </div>
  );
}
