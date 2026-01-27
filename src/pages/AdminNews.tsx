import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, ExternalLink, Rss } from "lucide-react";
import { format } from "date-fns";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface NewsPost {
  id: string;
  title: string;
  title_ko: string | null;
  slug: string;
  content: string;
  content_ko: string | null;
  excerpt: string | null;
  excerpt_ko: string | null;
  category: string;
  cover_image_url: string | null;
  external_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  view_count: number;
  created_at: string;
}

const categoryOptions = [
  { value: "news", labelKo: "뉴스", labelEn: "News" },
  { value: "update", labelKo: "업데이트", labelEn: "Update" },
  { value: "blog", labelKo: "블로그", labelEn: "Blog" },
  { value: "press", labelKo: "보도자료", labelEn: "Press" },
];

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
};

const AdminNews = () => {
  const { language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    title_ko: "",
    slug: "",
    content: "",
    content_ko: "",
    excerpt: "",
    excerpt_ko: "",
    category: "news",
    cover_image_url: "",
    external_url: "",
    is_published: false,
    is_featured: false,
    published_at: "",
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-news-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as NewsPost[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("news_posts").insert({
        title: data.title,
        title_ko: data.title_ko || null,
        slug: data.slug || generateSlug(data.title),
        content: data.content,
        content_ko: data.content_ko || null,
        excerpt: data.excerpt || null,
        excerpt_ko: data.excerpt_ko || null,
        category: data.category,
        cover_image_url: data.cover_image_url || null,
        external_url: data.external_url || null,
        is_published: data.is_published,
        is_featured: data.is_featured,
        published_at: data.is_published ? (data.published_at || new Date().toISOString()) : null,
        author_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news-posts"] });
      toast.success(language === "ko" ? "포스트가 생성되었습니다" : "Post created");
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("news_posts").update({
        title: data.title,
        title_ko: data.title_ko || null,
        slug: data.slug,
        content: data.content,
        content_ko: data.content_ko || null,
        excerpt: data.excerpt || null,
        excerpt_ko: data.excerpt_ko || null,
        category: data.category,
        cover_image_url: data.cover_image_url || null,
        external_url: data.external_url || null,
        is_published: data.is_published,
        is_featured: data.is_featured,
        published_at: data.is_published ? (data.published_at || new Date().toISOString()) : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news-posts"] });
      toast.success(language === "ko" ? "포스트가 수정되었습니다" : "Post updated");
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news-posts"] });
      toast.success(language === "ko" ? "포스트가 삭제되었습니다" : "Post deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const { error } = await supabase.from("news_posts").update({
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news-posts"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      title_ko: "",
      slug: "",
      content: "",
      content_ko: "",
      excerpt: "",
      excerpt_ko: "",
      category: "news",
      cover_image_url: "",
      external_url: "",
      is_published: false,
      is_featured: false,
      published_at: "",
    });
    setEditingPost(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (post: NewsPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      title_ko: post.title_ko || "",
      slug: post.slug,
      content: post.content,
      content_ko: post.content_ko || "",
      excerpt: post.excerpt || "",
      excerpt_ko: post.excerpt_ko || "",
      category: post.category,
      cover_image_url: post.cover_image_url || "",
      external_url: post.external_url || "",
      is_published: post.is_published,
      is_featured: post.is_featured,
      published_at: post.published_at ? format(new Date(post.published_at), "yyyy-MM-dd'T'HH:mm") : "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error(language === "ko" ? "제목과 내용을 입력하세요" : "Title and content are required");
      return;
    }
    
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCategoryBadge = (category: string) => {
    const config: Record<string, { color: string; label: string }> = {
      news: { color: "bg-blue-100 text-blue-700", label: language === "ko" ? "뉴스" : "News" },
      update: { color: "bg-green-100 text-green-700", label: language === "ko" ? "업데이트" : "Update" },
      blog: { color: "bg-purple-100 text-purple-700", label: language === "ko" ? "블로그" : "Blog" },
      press: { color: "bg-amber-100 text-amber-700", label: language === "ko" ? "보도자료" : "Press" },
    };
    const cat = config[category] || config.news;
    return <Badge className={cat.color}>{cat.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {language === "ko" ? "뉴스 관리" : "News Management"}
            </h1>
            <p className="text-muted-foreground">
              {language === "ko" ? "뉴스, 업데이트, 블로그, 보도자료를 관리합니다" : "Manage news, updates, blog posts, and press releases"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/rss.xml" target="_blank" rel="noopener noreferrer">
                <Rss className="h-4 w-4 mr-2" />
                RSS
              </a>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "ko" ? "새 포스트" : "New Post"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPost 
                      ? (language === "ko" ? "포스트 수정" : "Edit Post")
                      : (language === "ko" ? "새 포스트" : "New Post")
                    }
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === "ko" ? "제목 (영문)" : "Title (English)"}</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: formData.slug || generateSlug(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "ko" ? "제목 (한국어)" : "Title (Korean)"}</Label>
                      <Input
                        value={formData.title_ko}
                        onChange={(e) => setFormData({ ...formData, title_ko: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="auto-generated-from-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "ko" ? "카테고리" : "Category"}</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {language === "ko" ? cat.labelKo : cat.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === "ko" ? "요약 (영문)" : "Excerpt (English)"}</Label>
                      <Textarea
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "ko" ? "요약 (한국어)" : "Excerpt (Korean)"}</Label>
                      <Textarea
                        value={formData.excerpt_ko}
                        onChange={(e) => setFormData({ ...formData, excerpt_ko: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "ko" ? "내용 (영문)" : "Content (English)"}</Label>
                    <RichTextEditor
                      content={formData.content}
                      onChange={(v) => setFormData({ ...formData, content: v })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "ko" ? "내용 (한국어)" : "Content (Korean)"}</Label>
                    <RichTextEditor
                      content={formData.content_ko}
                      onChange={(v) => setFormData({ ...formData, content_ko: v })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === "ko" ? "커버 이미지 URL" : "Cover Image URL"}</Label>
                      <Input
                        value={formData.cover_image_url}
                        onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "ko" ? "외부 링크 (보도자료용)" : "External URL (for press)"}</Label>
                      <Input
                        value={formData.external_url}
                        onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{language === "ko" ? "발행일" : "Publish Date"}</Label>
                      <Input
                        type="datetime-local"
                        value={formData.published_at}
                        onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-8">
                      <Switch
                        checked={formData.is_published}
                        onCheckedChange={(v) => setFormData({ ...formData, is_published: v })}
                      />
                      <Label>{language === "ko" ? "공개" : "Published"}</Label>
                    </div>
                    <div className="flex items-center gap-2 pt-8">
                      <Switch
                        checked={formData.is_featured}
                        onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                      />
                      <Label>{language === "ko" ? "추천" : "Featured"}</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      {language === "ko" ? "취소" : "Cancel"}
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingPost 
                        ? (language === "ko" ? "수정" : "Update")
                        : (language === "ko" ? "생성" : "Create")
                      }
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Posts Table */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "ko" ? "포스트 목록" : "Posts"}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ko" ? "제목" : "Title"}</TableHead>
                    <TableHead>{language === "ko" ? "카테고리" : "Category"}</TableHead>
                    <TableHead>{language === "ko" ? "상태" : "Status"}</TableHead>
                    <TableHead>{language === "ko" ? "조회" : "Views"}</TableHead>
                    <TableHead>{language === "ko" ? "날짜" : "Date"}</TableHead>
                    <TableHead className="text-right">{language === "ko" ? "액션" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-xs">
                        <div className="font-medium truncate">{language === "ko" && post.title_ko ? post.title_ko : post.title}</div>
                        <div className="text-xs text-muted-foreground truncate">/{post.slug}</div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(post.category)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={post.is_published}
                          onCheckedChange={(v) => togglePublishMutation.mutate({ id: post.id, isPublished: v })}
                        />
                      </TableCell>
                      <TableCell>{post.view_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(post.created_at), "MM/dd/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={post.external_url || `/news/${post.slug}`} target="_blank" rel="noopener noreferrer">
                              {post.external_url ? <ExternalLink className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              if (confirm(language === "ko" ? "정말 삭제하시겠습니까?" : "Are you sure?")) {
                                deleteMutation.mutate(post.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {language === "ko" ? "포스트가 없습니다" : "No posts yet"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminNews;
