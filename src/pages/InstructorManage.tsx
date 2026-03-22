import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTier } from "@/hooks/useUserTier";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronLeft, BookOpen, AlertCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { InstituteInviteSection } from "@/components/institute/InstituteInviteSection";

const TIER_OPTIONS = [
  { value: "0", label: "모든 멤버", labelEn: "All Members" },
  { value: "1", label: "기본멤버 이상", labelEn: "Basic+" },
  { value: "2", label: "정식멤버 이상", labelEn: "Full+" },
  { value: "3", label: "공동체계정 이상", labelEn: "Community+" },
];

type Course = {
  id: string;
  title: string;
  title_ko: string;
  description: string | null;
  description_ko: string | null;
  instructor_name: string | null;
  instructor_user_id: string | null;
  required_tier: number;
  duration_minutes: number | null;
  is_free: boolean;
  is_certification: boolean;
  is_published: boolean;
  thumbnail_url: string | null;
  sort_order: number;
};

type Module = {
  id: string;
  course_id: string;
  title: string;
  title_ko: string;
  content: string | null;
  content_ko: string | null;
  video_url: string | null;
  sort_order: number;
  required_tier: number;
};

const InstructorManage = () => {
  const { language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { userTier } = useUserTier();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Get church account for community tier users
  const { data: churchAccount } = useQuery({
    queryKey: ["my-church-account", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("church_account_members")
        .select("church_account_id")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && userTier >= 3,
  });

  // Check if current user is an instructor
  const { data: isInstructor, isLoading: checkingInstructor } = useQuery({
    queryKey: ["is-instructor", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("institute_instructors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Fetch courses assigned to this instructor
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["instructor-courses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_courses")
        .select("*")
        .eq("instructor_user_id", user!.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Course[];
    },
    enabled: !!user?.id && isInstructor === true,
  });

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  // Fetch modules for selected course
  const { data: modules = [] } = useQuery({
    queryKey: ["instructor-modules", selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const { data, error } = await supabase
        .from("institute_modules")
        .select("*")
        .eq("course_id", selectedCourseId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Module[];
    },
    enabled: !!selectedCourseId,
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await supabase.from("institute_courses").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
    },
  });

  const addModule = useMutation({
    mutationFn: async (courseId: string) => {
      const defaultTier = selectedCourse?.required_tier ?? 0;
      const { error } = await supabase.from("institute_modules").insert({
        course_id: courseId,
        title: "New Module",
        title_ko: "새 모듈",
        sort_order: modules.length,
        required_tier: defaultTier,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-modules", selectedCourseId] });
      toast({ title: language === "ko" ? "모듈이 추가되었습니다" : "Module added" });
    },
  });

  const updateModule = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await supabase.from("institute_modules").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-modules", selectedCourseId] });
    },
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institute_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-modules", selectedCourseId] });
      toast({ title: language === "ko" ? "모듈이 삭제되었습니다" : "Module deleted" });
    },
  });

  if (checkingInstructor) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isInstructor) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {language === "ko" ? "강사 권한이 필요합니다" : "Instructor access required"}
          </h2>
          <p className="text-muted-foreground">
            {language === "ko"
              ? "이 페이지는 등록된 강사만 접근할 수 있습니다."
              : "This page is only accessible to registered instructors."}
          </p>
        </div>
      </AppLayout>
    );
  }

  // Module editing view
  if (selectedCourse) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Button variant="ghost" className="mb-4" onClick={() => setSelectedCourseId(null)}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            {language === "ko" ? "과목 목록으로" : "Back to courses"}
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">{language === "ko" ? selectedCourse.title_ko : selectedCourse.title}</h1>
            {selectedCourse.is_published ? (
              <Badge variant="default">Live</Badge>
            ) : (
              <Badge variant="secondary">{language === "ko" ? "비공개" : "Draft"}</Badge>
            )}
          </div>

          {/* Course basic info */}
          <Card className="p-4 mb-6 space-y-3">
            <h3 className="text-sm font-semibold">{language === "ko" ? "과목 정보" : "Course Info"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">제목 (KO)</label>
                <Input defaultValue={selectedCourse.title_ko} onBlur={(e) => updateCourse.mutate({ id: selectedCourse.id, field: "title_ko", value: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Title (EN)</label>
                <Input defaultValue={selectedCourse.title} onBlur={(e) => updateCourse.mutate({ id: selectedCourse.id, field: "title", value: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">설명 (KO)</label>
                <Textarea defaultValue={selectedCourse.description_ko || ""} onBlur={(e) => updateCourse.mutate({ id: selectedCourse.id, field: "description_ko", value: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description (EN)</label>
                <Textarea defaultValue={selectedCourse.description || ""} onBlur={(e) => updateCourse.mutate({ id: selectedCourse.id, field: "description", value: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Thumbnail URL</label>
                <Input defaultValue={selectedCourse.thumbnail_url || ""} onBlur={(e) => updateCourse.mutate({ id: selectedCourse.id, field: "thumbnail_url", value: e.target.value || null })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Duration (min)</label>
                <Input type="number" defaultValue={selectedCourse.duration_minutes || ""} onBlur={(e) => updateCourse.mutate({ id: selectedCourse.id, field: "duration_minutes", value: parseInt(e.target.value) || null })} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">
              {language === "ko"
                ? "※ 공개(Published) 상태는 관리자만 변경할 수 있습니다."
                : "※ Published status can only be changed by an admin."}
            </p>
          </Card>

          {/* Modules */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              {language === "ko" ? "모듈" : "Modules"} ({modules.length})
            </h3>
            <Button size="sm" variant="outline" onClick={() => addModule.mutate(selectedCourse.id)} disabled={addModule.isPending}>
              <Plus className="w-3 h-3 mr-1" />
              {language === "ko" ? "모듈 추가" : "Add Module"}
            </Button>
          </div>

          {modules.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground text-sm">
              {language === "ko" ? "모듈이 없습니다. 첫 번째 모듈을 추가하세요." : "No modules yet. Add your first module."}
            </Card>
          )}

          <div className="space-y-3">
            {modules.map((mod, index) => (
              <Card key={mod.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    {language === "ko" ? "모듈" : "Module"} {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(mod.required_tier)}
                      onValueChange={(v) => updateModule.mutate({ id: mod.id, field: "required_tier", value: parseInt(v) })}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {language === "ko" ? opt.label : opt.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete?")) deleteModule.mutate(mod.id); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {index === 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1">
                    💡 {language === "ko"
                      ? "첫 번째 모듈은 모든 멤버에게 공개하는 것을 권장합니다."
                      : "We recommend making the first module accessible to all members."}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">제목 (KO)</label>
                    <Input className="h-8 text-sm" defaultValue={mod.title_ko} onBlur={(e) => updateModule.mutate({ id: mod.id, field: "title_ko", value: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Title (EN)</label>
                    <Input className="h-8 text-sm" defaultValue={mod.title} onBlur={(e) => updateModule.mutate({ id: mod.id, field: "title", value: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {language === "ko" ? "내용 (KO) — 마크다운" : "Content (KO) — Markdown"}
                  </label>
                  <Textarea
                    className="min-h-[120px] text-sm font-mono"
                    defaultValue={mod.content_ko || ""}
                    onBlur={(e) => updateModule.mutate({ id: mod.id, field: "content_ko", value: e.target.value || null })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {language === "ko" ? "내용 (EN) — 마크다운" : "Content (EN) — Markdown"}
                  </label>
                  <Textarea
                    className="min-h-[80px] text-sm font-mono"
                    defaultValue={mod.content || ""}
                    onBlur={(e) => updateModule.mutate({ id: mod.id, field: "content", value: e.target.value || null })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Video URL</label>
                  <Input className="h-8 text-sm" defaultValue={mod.video_url || ""} onBlur={(e) => updateModule.mutate({ id: mod.id, field: "video_url", value: e.target.value || null })} />
                </div>

                <div className="w-20">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort</label>
                  <Input type="number" className="h-8 text-sm" defaultValue={mod.sort_order} onBlur={(e) => updateModule.mutate({ id: mod.id, field: "sort_order", value: parseInt(e.target.value) || 0 })} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Course list view
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">
            {language === "ko" ? "내 과목 관리" : "My Course Management"}
          </h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : courses.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {language === "ko" ? "담당 과목이 없습니다" : "No assigned courses"}
          </Card>
        ) : (
          <div className="space-y-2">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setSelectedCourseId(course.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{language === "ko" ? course.title_ko : course.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {language === "ko" ? course.description_ko : course.description || ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {course.is_published ? (
                      <Badge variant="default">Live</Badge>
                    ) : (
                      <Badge variant="secondary">{language === "ko" ? "비공개" : "Draft"}</Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Invitation section for community accounts (tier 3) */}
        {userTier >= 3 && churchAccount?.church_account_id && (
          <InstituteInviteSection churchAccountId={churchAccount.church_account_id} />
        )}
      </div>
    </AppLayout>
  );
};

export default InstructorManage;
