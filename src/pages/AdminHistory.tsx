import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, Rocket, Sparkles, Flag, ArrowUpCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { MilestoneDialog, MilestoneData } from "@/components/admin/MilestoneDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CategoryFilter = "all" | "launch" | "feature" | "milestone" | "update";

const AdminHistory = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: milestones, isLoading } = useQuery({
    queryKey: ["admin-milestones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_milestones")
        .select("*")
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (milestone: MilestoneData) => {
      if (milestone.id) {
        const { error } = await supabase
          .from("platform_milestones")
          .update({
            event_date: milestone.event_date,
            title_ko: milestone.title_ko,
            title_en: milestone.title_en,
            description_ko: milestone.description_ko || null,
            description_en: milestone.description_en || null,
            category: milestone.category,
            is_visible: milestone.is_visible,
            sort_order: milestone.sort_order,
          })
          .eq("id", milestone.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("platform_milestones")
          .insert({
            event_date: milestone.event_date,
            title_ko: milestone.title_ko,
            title_en: milestone.title_en,
            description_ko: milestone.description_ko || null,
            description_en: milestone.description_en || null,
            category: milestone.category,
            is_visible: milestone.is_visible,
            sort_order: milestone.sort_order,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-milestones"] });
      setDialogOpen(false);
      setEditingMilestone(null);
      toast.success(language === "ko" ? "저장되었습니다" : "Saved successfully");
    },
    onError: () => {
      toast.error(language === "ko" ? "저장 실패" : "Failed to save");
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisible }: { id: string; isVisible: boolean }) => {
      const { error } = await supabase
        .from("platform_milestones")
        .update({ is_visible: isVisible })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-milestones"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("platform_milestones")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-milestones"] });
      toast.success(language === "ko" ? "삭제되었습니다" : "Deleted successfully");
    },
    onError: () => {
      toast.error(language === "ko" ? "삭제 실패" : "Failed to delete");
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "launch": return <Rocket className="h-4 w-4" />;
      case "feature": return <Sparkles className="h-4 w-4" />;
      case "milestone": return <Flag className="h-4 w-4" />;
      case "update": return <ArrowUpCircle className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { ko: string; en: string }> = {
      launch: { ko: "출시", en: "Launch" },
      feature: { ko: "기능", en: "Feature" },
      milestone: { ko: "마일스톤", en: "Milestone" },
      update: { ko: "업데이트", en: "Update" },
    };
    return labels[category]?.[language] || category;
  };

  const filteredMilestones = milestones?.filter((m) => {
    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;
    const matchesSearch = searchQuery === "" || 
      m.title_ko.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.title_en.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories: CategoryFilter[] = ["all", "launch", "feature", "milestone", "update"];

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>
              {language === "ko" ? "플랫폼 히스토리 관리" : "Platform History Management"}
            </CardTitle>
            <Button onClick={() => { setEditingMilestone(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              {language === "ko" ? "마일스톤 추가" : "Add Milestone"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat === "all" 
                      ? (language === "ko" ? "전체" : "All")
                      : getCategoryLabel(cat)
                    }
                  </Button>
                ))}
              </div>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === "ko" ? "마일스톤 검색..." : "Search milestones..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">{language === "ko" ? "날짜" : "Date"}</TableHead>
                    <TableHead className="w-[100px]">{language === "ko" ? "카테고리" : "Category"}</TableHead>
                    <TableHead>{language === "ko" ? "제목" : "Title"}</TableHead>
                    <TableHead className="w-[80px] text-center">{language === "ko" ? "공개" : "Visible"}</TableHead>
                    <TableHead className="w-[100px] text-center">{language === "ko" ? "액션" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {language === "ko" ? "로딩 중..." : "Loading..."}
                      </TableCell>
                    </TableRow>
                  ) : filteredMilestones && filteredMilestones.length > 0 ? (
                    filteredMilestones.map((milestone) => (
                      <TableRow key={milestone.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(milestone.event_date), "yyyy-MM-dd")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {getCategoryIcon(milestone.category)}
                            {getCategoryLabel(milestone.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {language === "ko" ? milestone.title_ko : milestone.title_en}
                            </p>
                            {(milestone.description_ko || milestone.description_en) && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {language === "ko" ? milestone.description_ko : milestone.description_en}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={milestone.is_visible}
                            onCheckedChange={(checked) => 
                              toggleVisibilityMutation.mutate({ id: milestone.id, isVisible: checked })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingMilestone({
                                  id: milestone.id,
                                  event_date: milestone.event_date,
                                  title_ko: milestone.title_ko,
                                  title_en: milestone.title_en,
                                  description_ko: milestone.description_ko || "",
                                  description_en: milestone.description_en || "",
                                  category: milestone.category,
                                  is_visible: milestone.is_visible,
                                  sort_order: milestone.sort_order,
                                });
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingId(milestone.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {language === "ko" ? "마일스톤이 없습니다" : "No milestones found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>
                {language === "ko" ? "전체" : "Total"}: {milestones?.length || 0}
              </span>
              <span>
                {language === "ko" ? "공개" : "Visible"}: {milestones?.filter(m => m.is_visible).length || 0}
              </span>
              <span>
                {language === "ko" ? "비공개" : "Hidden"}: {milestones?.filter(m => !m.is_visible).length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <MilestoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        milestone={editingMilestone}
        onSave={(data) => saveMutation.mutate(data)}
        isLoading={saveMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ko" ? "마일스톤 삭제" : "Delete Milestone"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ko" 
                ? "이 마일스톤을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                : "Are you sure you want to delete this milestone? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "ko" ? "취소" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  deleteMutation.mutate(deletingId);
                  setDeleteDialogOpen(false);
                  setDeletingId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === "ko" ? "삭제" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminHistory;
