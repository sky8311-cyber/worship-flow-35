import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Palette, 
  Plus, 
  Trash2, 
  GripVertical, 
  Crown, 
  Users, 
  FileText, 
  BarChart3, 
  Search,
  X
} from "lucide-react";
import { iconMap } from "@/hooks/useNavigationItems";
import { useTranslation } from "@/hooks/useTranslation";

interface StudioCategory {
  id: string;
  key: string;
  label_en: string;
  label_ko: string;
  icon: string;
  color: string;
  sort_order: number;
  is_enabled: boolean;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  is_ambassador: boolean | null;
}

const AdminStudio = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("categories");
  const [editingCategory, setEditingCategory] = useState<StudioCategory | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [ambassadorSearch, setAmbassadorSearch] = useState("");

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["studio-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_post_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as StudioCategory[];
    },
  });

  // Fetch ambassadors
  const { data: ambassadors, isLoading: ambassadorsLoading } = useQuery({
    queryKey: ["ambassadors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, is_ambassador")
        .eq("is_ambassador", true);
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Search users for ambassador
  const { data: searchResults } = useQuery({
    queryKey: ["ambassador-search", ambassadorSearch],
    queryFn: async () => {
      if (!ambassadorSearch.trim() || ambassadorSearch.length < 2) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, is_ambassador")
        .or(`full_name.ilike.%${ambassadorSearch}%,email.ilike.%${ambassadorSearch}%`)
        .eq("is_ambassador", false)
        .limit(10);
      if (error) throw error;
      return data as Profile[];
    },
    enabled: ambassadorSearch.length >= 2,
  });

  // Fetch studio stats
  const { data: stats } = useQuery({
    queryKey: ["studio-stats"],
    queryFn: async () => {
      const [studiosResult, postsResult, reactionsResult] = await Promise.all([
        supabase.from("worship_rooms").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("room_posts").select("*", { count: "exact", head: true }),
        supabase.from("room_reactions").select("*", { count: "exact", head: true }),
      ]);
      return {
        totalStudios: studiosResult.count || 0,
        totalPosts: postsResult.count || 0,
        totalReactions: reactionsResult.count || 0,
      };
    },
  });

  // Toggle category enabled
  const toggleCategoryMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("studio_post_categories")
        .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-categories"] });
      toast.success(language === "ko" ? "카테고리가 업데이트되었습니다" : "Category updated");
    },
  });

  // Update category
  const updateCategoryMutation = useMutation({
    mutationFn: async (category: StudioCategory) => {
      const { error } = await supabase
        .from("studio_post_categories")
        .update({
          label_en: category.label_en,
          label_ko: category.label_ko,
          icon: category.icon,
          color: category.color,
          updated_at: new Date().toISOString(),
        })
        .eq("id", category.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-categories"] });
      setEditingCategory(null);
      toast.success(language === "ko" ? "카테고리가 저장되었습니다" : "Category saved");
    },
  });

  // Add category
  const addCategoryMutation = useMutation({
    mutationFn: async (category: Partial<StudioCategory>) => {
      const maxOrder = categories?.reduce((max, c) => Math.max(max, c.sort_order), 0) || 0;
      const { error } = await supabase.from("studio_post_categories").insert({
        key: category.key,
        label_en: category.label_en,
        label_ko: category.label_ko,
        icon: category.icon || "FileText",
        color: category.color || "gray",
        sort_order: maxOrder + 1,
        is_enabled: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-categories"] });
      setIsAddDialogOpen(false);
      toast.success(language === "ko" ? "카테고리가 추가되었습니다" : "Category added");
    },
  });

  // Delete category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("studio_post_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-categories"] });
      toast.success(language === "ko" ? "카테고리가 삭제되었습니다" : "Category deleted");
    },
  });

  // Toggle ambassador
  const toggleAmbassadorMutation = useMutation({
    mutationFn: async ({ userId, isAmbassador }: { userId: string; isAmbassador: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_ambassador: isAmbassador })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ambassadors"] });
      queryClient.invalidateQueries({ queryKey: ["ambassador-search"] });
      setAmbassadorSearch("");
      toast.success(language === "ko" ? "앰버서더 상태가 변경되었습니다" : "Ambassador status updated");
    },
  });

  const iconOptions = ["Heart", "FileText", "Sparkles", "HelpCircle", "MessageSquare", "BookOpen", "Star", "Music"];
  const colorOptions = ["red", "blue", "yellow", "orange", "gray", "green", "purple", "pink"];

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">
              {language === "ko" ? "워십 아틀리에 관리" : "Worship Atelier Management"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {language === "ko" 
                ? "카테고리, 앰버서더, 아틀리에 설정 관리" 
                : "Manage categories, ambassadors, and atelier settings"}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="categories" className="gap-2">
              <FileText className="w-4 h-4" />
              {language === "ko" ? "카테고리" : "Categories"}
            </TabsTrigger>
            <TabsTrigger value="ambassadors" className="gap-2">
              <Crown className="w-4 h-4" />
              {language === "ko" ? "앰버서더" : "Ambassadors"}
            </TabsTrigger>
            <TabsTrigger value="studios" className="gap-2">
              <Users className="w-4 h-4" />
              {language === "ko" ? "스튜디오" : "Studios"}
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              {language === "ko" ? "통계" : "Stats"}
            </TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{language === "ko" ? "포스트 카테고리" : "Post Categories"}</CardTitle>
                  <CardDescription>
                    {language === "ko" 
                      ? "아틀리에 피드에서 사용할 수 있는 포스트 유형을 관리합니다" 
                      : "Manage post types available in atelier feeds"}
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  {language === "ko" ? "추가" : "Add"}
                </Button>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories?.map((category) => {
                      const IconComponent = iconMap[category.icon] || FileText;
                      return (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                            <IconComponent className="w-5 h-5" style={{ color: category.color }} />
                            <div>
                              <div className="font-medium">
                                {language === "ko" ? category.label_ko : category.label_en}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                key: {category.key}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={category.is_enabled}
                              onCheckedChange={(checked) =>
                                toggleCategoryMutation.mutate({ id: category.id, enabled: checked })
                              }
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCategory(category)}
                            >
                              {language === "ko" ? "편집" : "Edit"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => {
                                if (confirm(language === "ko" ? "정말 삭제하시겠습니까?" : "Are you sure?")) {
                                  deleteCategoryMutation.mutate(category.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ambassadors Tab */}
          <TabsContent value="ambassadors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  {language === "ko" ? "앰버서더" : "Ambassadors"}
                  {ambassadors && <Badge variant="secondary">{ambassadors.length}</Badge>}
                </CardTitle>
                <CardDescription>
                  {language === "ko" 
                    ? "공식 앰버서더를 관리합니다. 앰버서더 아틀리에는 탐색 탭에서 특별히 표시됩니다." 
                    : "Manage official ambassadors. Ambassador ateliers are highlighted in the Discover tab."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search to add ambassador */}
                <div className="space-y-2">
                  <Label>{language === "ko" ? "앰버서더 추가" : "Add Ambassador"}</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={language === "ko" ? "이름 또는 이메일로 검색..." : "Search by name or email..."}
                      value={ambassadorSearch}
                      onChange={(e) => setAmbassadorSearch(e.target.value)}
                      className="pl-10"
                    />
                    {ambassadorSearch && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setAmbassadorSearch("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {searchResults && searchResults.length > 0 && (
                    <div className="border rounded-lg divide-y mt-2">
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>{user.full_name?.[0] || user.email[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{user.full_name || "Unnamed"}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => toggleAmbassadorMutation.mutate({ userId: user.id, isAmbassador: true })}
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            {language === "ko" ? "앰버서더 지정" : "Make Ambassador"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current ambassadors */}
                <div className="space-y-2">
                  <Label>{language === "ko" ? "현재 앰버서더" : "Current Ambassadors"}</Label>
                  {ambassadorsLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                      ))}
                    </div>
                  ) : ambassadors?.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">
                      {language === "ko" ? "아직 앰버서더가 없습니다" : "No ambassadors yet"}
                    </p>
                  ) : (
                    <div className="border rounded-lg divide-y">
                      {ambassadors?.map((ambassador) => (
                        <div key={ambassador.id} className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={ambassador.avatar_url || undefined} />
                              <AvatarFallback>{ambassador.full_name?.[0] || ambassador.email[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{ambassador.full_name || "Unnamed"}</div>
                              <div className="text-sm text-muted-foreground">{ambassador.email}</div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(language === "ko" ? "앰버서더를 해제하시겠습니까?" : "Remove ambassador status?")) {
                                toggleAmbassadorMutation.mutate({ userId: ambassador.id, isAmbassador: false });
                              }
                            }}
                          >
                            {language === "ko" ? "해제" : "Remove"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Studios Tab */}
          <TabsContent value="studios">
            <Card>
              <CardHeader>
                <CardTitle>{language === "ko" ? "활성 아틀리에" : "Active Ateliers"}</CardTitle>
                <CardDescription>
                  {language === "ko" 
                    ? "계약이 완료된 아틀리에 목록입니다" 
                    : "List of ateliers with active contracts"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudioList language={language} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {language === "ko" ? "총 아틀리에" : "Total Ateliers"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalStudios || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {language === "ko" ? "총 포스트" : "Total Posts"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalPosts || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {language === "ko" ? "총 리액션" : "Total Reactions"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalReactions || 0}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Category Dialog */}
        <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === "ko" ? "카테고리 편집" : "Edit Category"}</DialogTitle>
            </DialogHeader>
            {editingCategory && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>English Label</Label>
                    <Input
                      value={editingCategory.label_en}
                      onChange={(e) =>
                        setEditingCategory({ ...editingCategory, label_en: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Korean Label</Label>
                    <Input
                      value={editingCategory.label_ko}
                      onChange={(e) =>
                        setEditingCategory({ ...editingCategory, label_ko: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Icon</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {iconOptions.map((icon) => {
                        const Icon = iconMap[icon];
                        return (
                          <Button
                            key={icon}
                            variant={editingCategory.icon === icon ? "default" : "outline"}
                            size="sm"
                            onClick={() => setEditingCategory({ ...editingCategory, icon })}
                          >
                            {Icon && <Icon className="w-4 h-4" />}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {colorOptions.map((color) => (
                        <Button
                          key={color}
                          variant={editingCategory.color === color ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          style={{ backgroundColor: editingCategory.color === color ? color : undefined }}
                          onClick={() => setEditingCategory({ ...editingCategory, color })}
                        >
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCategory(null)}>
                {language === "ko" ? "취소" : "Cancel"}
              </Button>
              <Button onClick={() => editingCategory && updateCategoryMutation.mutate(editingCategory)}>
                {language === "ko" ? "저장" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog */}
        <AddCategoryDialog
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={(category) => addCategoryMutation.mutate(category)}
          language={language}
          iconOptions={iconOptions}
          colorOptions={colorOptions}
        />
      </div>
    </AdminLayout>
  );
};

// Studio List Component
const StudioList = ({ language }: { language: string }) => {
  const { data: studios, isLoading } = useQuery({
    queryKey: ["admin-studios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_rooms")
        .select(`
          id,
          visibility,
          is_active,
          created_at,
          owner:profiles!worship_rooms_owner_user_id_fkey (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{language === "ko" ? "소유자" : "Owner"}</TableHead>
          <TableHead>{language === "ko" ? "공개 설정" : "Visibility"}</TableHead>
          <TableHead>{language === "ko" ? "생성일" : "Created"}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {studios?.map((studio) => (
          <TableRow key={studio.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={studio.owner?.avatar_url || undefined} />
                  <AvatarFallback>
                    {studio.owner?.full_name?.[0] || studio.owner?.email?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{studio.owner?.full_name || "Unnamed"}</div>
                  <div className="text-xs text-muted-foreground">{studio.owner?.email}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={studio.visibility === "public" ? "default" : "secondary"}>
                {studio.visibility}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(studio.created_at).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Add Category Dialog Component
const AddCategoryDialog = ({
  open,
  onClose,
  onAdd,
  language,
  iconOptions,
  colorOptions,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (category: Partial<StudioCategory>) => void;
  language: string;
  iconOptions: string[];
  colorOptions: string[];
}) => {
  const [newCategory, setNewCategory] = useState({
    key: "",
    label_en: "",
    label_ko: "",
    icon: "FileText",
    color: "gray",
  });

  const handleSubmit = () => {
    if (!newCategory.key || !newCategory.label_en || !newCategory.label_ko) {
      toast.error(language === "ko" ? "모든 필드를 입력해주세요" : "Please fill all fields");
      return;
    }
    onAdd(newCategory);
    setNewCategory({ key: "", label_en: "", label_ko: "", icon: "FileText", color: "gray" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{language === "ko" ? "카테고리 추가" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Key (unique identifier)</Label>
            <Input
              value={newCategory.key}
              onChange={(e) => setNewCategory({ ...newCategory, key: e.target.value.toLowerCase().replace(/\s/g, "_") })}
              placeholder="e.g., teaching"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>English Label</Label>
              <Input
                value={newCategory.label_en}
                onChange={(e) => setNewCategory({ ...newCategory, label_en: e.target.value })}
                placeholder="Teaching"
              />
            </div>
            <div>
              <Label>Korean Label</Label>
              <Input
                value={newCategory.label_ko}
                onChange={(e) => setNewCategory({ ...newCategory, label_ko: e.target.value })}
                placeholder="가르침"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {iconOptions.map((icon) => {
                  const Icon = iconMap[icon];
                  return (
                    <Button
                      key={icon}
                      variant={newCategory.icon === icon ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewCategory({ ...newCategory, icon })}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {colorOptions.map((color) => (
                  <Button
                    key={color}
                    variant={newCategory.color === color ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setNewCategory({ ...newCategory, color })}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {language === "ko" ? "취소" : "Cancel"}
          </Button>
          <Button onClick={handleSubmit}>
            {language === "ko" ? "추가" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminStudio;
