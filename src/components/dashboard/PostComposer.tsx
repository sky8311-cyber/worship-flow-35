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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUserCommunities } from "@/hooks/useUserCommunities";
import { creditFirstCommunityPostReward, creditCommunityPosts10MilestoneReward } from "@/lib/rewardsHelper";

export function PostComposer() {
  const { user, profile } = useAuth();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const { data: communitiesData } = useUserCommunities();
  const communities = communitiesData?.communities || [];

  const postMutation = useMutation({
    mutationFn: async () => {
      const communityId = selectedCommunity || communities?.[0]?.id;
      const { error } = await supabase.from("community_posts").insert({
        community_id: communityId,
        author_id: user!.id,
        content: content.trim(),
        image_urls: uploadedImages.length > 0 ? uploadedImages : null
      });
      if (error) throw error;
      return communityId;
    },
    onSuccess: async (communityId) => {
      toast.success(t("socialFeed.postSuccess"));
      setContent("");
      setUploadedImages([]);
      queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
      queryClient.invalidateQueries({ queryKey: ["community-newsfeed"] });
      
      // Credit K-Seed rewards (fire-and-forget)
      if (user?.id && communityId) {
        // Check post count for this community to determine milestone
        const { count } = await supabase
          .from("community_posts")
          .select("id", { count: "exact", head: true })
          .eq("community_id", communityId)
          .eq("author_id", user.id);
        
        const postCount = count || 0;
        
        if (postCount === 1) {
          // First post in this community
          creditFirstCommunityPostReward(user.id, communityId);
        } else if (postCount === 10) {
          // 10th post milestone
          creditCommunityPosts10MilestoneReward(user.id, communityId);
        }
      }
    },
    onError: () => {
      toast.error(t("common.error"));
    }
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
        const { error: uploadError } = await supabase.storage.from("profile-images").upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("profile-images").getPublicUrl(fileName);
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

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
    if (imageItems.length === 0) return;

    e.preventDefault();
    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (!file) continue;

        const fileExt = file.type.split('/')[1] || 'png';
        const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("profile-images")
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("profile-images")
          .getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
      
      setUploadedImages(prev => [...prev, ...uploadedUrls]);
      toast.success(language === "ko" ? "이미지가 업로드되었습니다" : "Image uploaded");
    } catch (error) {
      console.error("Paste upload error:", error);
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
        <div className="gap-3 flex flex-col">
          <Avatar className="w-10 h-10">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback>{profile?.full_name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <Textarea 
              placeholder={t("socialFeed.postPlaceholder")} 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              onPaste={handlePaste}
              className="min-h-[80px] resize-none" 
            />

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img src={url} alt={`Upload ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
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
                accept="image/jpeg,image/jpg,image/png,image/webp" 
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
                <Button onClick={handleSubmit} disabled={!content.trim() || postMutation.isPending}>
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
