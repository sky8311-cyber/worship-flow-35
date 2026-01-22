import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Tags, Search } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface Topic {
  id: string;
  name_ko: string;
  name_en: string | null;
  created_at: string;
}

const AdminTopics = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState({ name_ko: "", name_en: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<Topic | null>(null);

  // Fetch topics with usage counts
  const { data: topics, isLoading } = useQuery({
    queryKey: ["admin-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("song_topics")
        .select("*")
        .order("name_ko");
      if (error) throw error;
      return data as Topic[];
    },
  });

  // Fetch usage counts from tags field (temporary until migration completes)
  const { data: usageCounts } = useQuery({
    queryKey: ["topic-usage-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("songs")
        .select("tags")
        .not("tags", "is", null);
      
      const counts = new Map<string, number>();
      data?.forEach((song: { tags: string | null }) => {
        if (song.tags) {
          song.tags.split(",").forEach((tag: string) => {
            // Extract Korean topic from format "한글 (English)" or just "한글"
            const trimmed = tag.trim();
            const koreanMatch = trimmed.match(/^([^(]+)/);
            if (koreanMatch) {
              const koreanTopic = koreanMatch[1].trim();
              counts.set(koreanTopic, (counts.get(koreanTopic) || 0) + 1);
            }
          });
        }
      });
      return counts;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { id?: string; name_ko: string; name_en: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("song_topics")
          .update({ name_ko: data.name_ko, name_en: data.name_en || null })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("song_topics")
          .insert({ name_ko: data.name_ko, name_en: data.name_en || null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      queryClient.invalidateQueries({ queryKey: ["song-topics"] });
      toast.success(editingTopic ? "주제가 수정되었습니다" : "주제가 추가되었습니다");
      handleCloseDialog();
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("이미 존재하는 주제입니다");
      } else {
        toast.error("오류가 발생했습니다");
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("song_topics")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      queryClient.invalidateQueries({ queryKey: ["song-topics"] });
      toast.success("주제가 삭제되었습니다");
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error("삭제 중 오류가 발생했습니다");
    },
  });

  const handleOpenDialog = (topic?: Topic) => {
    if (topic) {
      setEditingTopic(topic);
      setFormData({ name_ko: topic.name_ko, name_en: topic.name_en || "" });
    } else {
      setEditingTopic(null);
      setFormData({ name_ko: "", name_en: "" });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTopic(null);
    setFormData({ name_ko: "", name_en: "" });
  };

  const handleSave = () => {
    if (!formData.name_ko.trim()) {
      toast.error("한글 주제명을 입력해주세요");
      return;
    }
    saveMutation.mutate({
      id: editingTopic?.id,
      name_ko: formData.name_ko.trim(),
      name_en: formData.name_en.trim(),
    });
  };

  const filteredTopics = topics?.filter(topic =>
    topic.name_ko.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (topic.name_en && topic.name_en.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tags className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">
                {language === "ko" ? "주제 관리" : "Topic Management"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === "ko" 
                  ? "곡에 사용되는 주제를 관리합니다"
                  : "Manage topics used for songs"}
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            {language === "ko" ? "주제 추가" : "Add Topic"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {language === "ko" ? "전체 주제" : "All Topics"} 
                <Badge variant="secondary" className="ml-2">{topics?.length || 0}</Badge>
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === "ko" ? "주제 검색..." : "Search topics..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === "ko" ? "로딩 중..." : "Loading..."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">
                      {language === "ko" ? "한글 (Korean)" : "Korean"}
                    </TableHead>
                    <TableHead className="w-[200px]">
                      {language === "ko" ? "영문 (English)" : "English"}
                    </TableHead>
                    <TableHead className="w-[120px] text-center">
                      {language === "ko" ? "사용 횟수" : "Usage"}
                    </TableHead>
                    <TableHead className="w-[100px] text-right">
                      {language === "ko" ? "작업" : "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTopics?.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell className="font-medium">{topic.name_ko}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {topic.name_en || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {usageCounts?.get(topic.name_ko) || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(topic)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(topic)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTopics?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {searchQuery 
                          ? (language === "ko" ? "검색 결과가 없습니다" : "No results found")
                          : (language === "ko" ? "주제가 없습니다" : "No topics yet")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTopic 
                ? (language === "ko" ? "주제 수정" : "Edit Topic")
                : (language === "ko" ? "주제 추가" : "Add Topic")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name_ko">
                {language === "ko" ? "한글 주제명 *" : "Korean Name *"}
              </Label>
              <Input
                id="name_ko"
                value={formData.name_ko}
                onChange={(e) => setFormData({ ...formData, name_ko: e.target.value })}
                placeholder={language === "ko" ? "예: 찬양" : "e.g., 찬양"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_en">
                {language === "ko" ? "영문 주제명" : "English Name"}
              </Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder={language === "ko" ? "예: Praise" : "e.g., Praise"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              {language === "ko" ? "취소" : "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending 
                ? (language === "ko" ? "저장 중..." : "Saving...")
                : (language === "ko" ? "저장" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ko" ? "주제 삭제" : "Delete Topic"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ko" 
                ? `"${deleteConfirm?.name_ko}" 주제를 삭제하시겠습니까? 이 주제를 사용 중인 곡에서는 자동으로 제거되지 않습니다.`
                : `Are you sure you want to delete "${deleteConfirm?.name_ko}"? Songs using this topic will not be automatically updated.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "ko" ? "취소" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
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

export default AdminTopics;
