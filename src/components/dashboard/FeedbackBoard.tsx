import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ImagePlus, X, MoreHorizontal, Bug, Lightbulb, TrendingUp, MessageSquare, Loader2, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import { AvatarWithLevel } from "@/components/seeds/AvatarWithLevel";
import { LikeButton } from "./LikeButton";
import { CommentsSection } from "./CommentsSection";
import { ImageGrid } from "./ImageGrid";
import { CommentButton } from "./CommentButton";

const POST_TYPES = [
  { value: "general", labelEn: "General", labelKo: "일반", icon: MessageSquare, color: "bg-muted text-muted-foreground" },
  { value: "bug", labelEn: "Bug Report", labelKo: "버그 리포트", icon: Bug, color: "bg-destructive/10 text-destructive" },
  { value: "feature", labelEn: "Feature Request", labelKo: "기능 요청", icon: Lightbulb, color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  { value: "improvement", labelEn: "Improvement", labelKo: "개선점", icon: TrendingUp, color: "bg-green-500/10 text-green-700 dark:text-green-400" },
];

export function FeedbackBoard() {
  const { user, profile, isAdmin } = useAuth();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("general");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editPostType, setEditPostType] = useState("general");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string | null>(null);

  // Fetch feedback posts
  const { data: feedbackPosts, isLoading } = useQuery({
    queryKey: ["feedback-posts"],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from("feedback_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Batch fetch authors
      const authorIds = [...new Set(posts?.map(p => p.author_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", authorIds);

      const authorMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return posts?.map(post => ({
        ...post,
        author: authorMap.get(post.author_id) || { id: post.author_id, full_name: null, avatar_url: null }
      })) || [];
    },
    enabled: !!user,
  });

  // Filter posts by type
  const filteredPosts = filterType
    ? feedbackPosts?.filter(post => post.post_type === filterType)
    : feedbackPosts;

  // Create post mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("feedback_posts").insert({
        author_id: user!.id,
        content: content.trim(),
        post_type: postType,
        image_urls: uploadedImages.length > 0 ? uploadedImages : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("socialFeed.postSuccess"));
      setContent("");
      setPostType("general");
      setUploadedImages([]);
      queryClient.invalidateQueries({ queryKey: ["feedback-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feedback-count"] });
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  // Edit post mutation
  const editMutation = useMutation({
    mutationFn: async ({ newContent, newPostType }: { newContent: string; newPostType: string }) => {
      const { error } = await supabase
        .from("feedback_posts")
        .update({ content: newContent, post_type: newPostType, updated_at: new Date().toISOString() })
        .eq("id", editingPostId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("common.saveSuccess"));
      queryClient.invalidateQueries({ queryKey: ["feedback-posts"] });
      setEditDialogOpen(false);
      setEditingPostId(null);
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("feedback_posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("common.deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["feedback-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feedback-count"] });
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
    createMutation.mutate();
  };

  const handleEdit = (post: any) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setEditPostType(post.post_type);
    setEditDialogOpen(true);
  };

  const handleDelete = (postId: string) => {
    if (window.confirm(t("common.confirmDelete"))) {
      deleteMutation.mutate(postId);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const getPostTypeInfo = (type: string) => {
    return POST_TYPES.find(t => t.value === type) || POST_TYPES[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Beta Notice */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
        <p className="text-sm text-primary font-medium flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          {language === "ko" 
            ? "베타 테스트 기간 동안 이 피드백 보드는 Admin과 Worship Leader에게만 표시됩니다."
            : "During beta testing, this Feedback Board is only visible to Admin and Worship Leaders."}
        </p>
      </div>

      {/* Post Composer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback>{profile?.full_name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <Textarea
                placeholder={language === "ko" ? "피드백, 버그 리포트, 또는 제안을 공유해주세요..." : "Share your feedback, bug reports, or suggestions..."}
                value={content}
                onChange={(e) => setContent(e.target.value)}
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

              <div className="flex items-center gap-2 flex-wrap">
                <label htmlFor="feedback-image-upload">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={uploading}
                    onClick={() => document.getElementById("feedback-image-upload")?.click()}
                  >
                    <ImagePlus className="w-4 h-4 mr-2" />
                    {t("socialFeed.addPhotos")}
                  </Button>
                </label>
                <input
                  id="feedback-image-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <Select value={postType} onValueChange={setPostType}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {language === "ko" ? type.labelKo : type.labelEn}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="ml-auto">
                  <Button onClick={handleSubmit} disabled={!content.trim() || createMutation.isPending}>
                    {createMutation.isPending ? t("common.saving") : t("socialFeed.post")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterType === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType(null)}
        >
          {language === "ko" ? "전체" : "All"}
        </Button>
        {POST_TYPES.map((type) => (
          <Button
            key={type.value}
            variant={filterType === type.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(type.value)}
          >
            <type.icon className="w-4 h-4 mr-1" />
            {language === "ko" ? type.labelKo : type.labelEn}
          </Button>
        ))}
      </div>

      {/* Feedback Posts */}
      {filteredPosts && filteredPosts.length > 0 ? (
        filteredPosts.map((post) => {
          const typeInfo = getPostTypeInfo(post.post_type);
          const TypeIcon = typeInfo.icon;
          const authorName = post.author?.full_name || t("common.deletedUser");
          const authorInitial = authorName.charAt(0) || "?";

          return (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-col space-y-2">
                <div className="flex items-center gap-3">
                  {post.author?.id ? (
                    <AvatarWithLevel
                      userId={post.author.id}
                      avatarUrl={post.author.avatar_url}
                      fallback={authorInitial}
                      size="md"
                      className="w-10 h-10"
                    />
                  ) : (
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{authorInitial}</AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex-1">
                    <p className="font-medium text-sm">{authorName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={`text-xs ${typeInfo.color}`}>
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {language === "ko" ? typeInfo.labelKo : typeInfo.labelEn}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: language === "ko" ? ko : undefined,
                        })}
                      </span>
                    </div>
                  </div>

                  {(user?.id === post.author_id || isAdmin) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user?.id === post.author_id && (
                          <DropdownMenuItem onClick={() => handleEdit(post)}>
                            {t("socialFeed.edit")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-destructive">
                          {t("socialFeed.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-wrap mb-3">{post.content}</p>
                {post.image_urls && post.image_urls.length > 0 && (
                  <ImageGrid images={post.image_urls} />
                )}
              </CardContent>

              <CardFooter className="flex-col items-stretch">
                <div className="flex items-center gap-4 pb-3 border-b">
                  <LikeButton postId={post.id} postType="feedback_post" />
                  <CommentButton
                    postId={post.id}
                    postType="feedback_post"
                    isExpanded={expandedComments.has(post.id)}
                    onToggle={() => toggleComments(post.id)}
                  />
                </div>

                {expandedComments.has(post.id) && (
                  <CommentsSection postId={post.id} postType="feedback_post" />
                )}
              </CardFooter>
            </Card>
          );
        })
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">{language === "ko" ? "아직 피드백이 없습니다. 첫 번째 피드백을 작성해보세요!" : "No feedback yet. Be the first to share!"}</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("socialFeed.editPost")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={editPostType} onValueChange={setEditPostType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POST_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {language === "ko" ? type.labelKo : type.labelEn}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button 
              onClick={() => editMutation.mutate({ newContent: editContent, newPostType: editPostType })} 
              disabled={editMutation.isPending}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
