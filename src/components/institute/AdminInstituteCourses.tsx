import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

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
  badge_image_url: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
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
  created_at: string;
};

export const AdminInstituteCourses = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-institute-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_courses")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Course[];
    },
  });

  // Fetch instructors for dropdown
  const { data: instructors = [] } = useQuery({
    queryKey: ["admin-institute-instructors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_instructors")
        .select("*")
        .order("display_name", { ascending: true });
      if (error) throw error;
      return data as { id: string; user_id: string; display_name: string | null }[];
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["admin-institute-modules", expandedCourseId],
    queryFn: async () => {
      if (!expandedCourseId) return [];
      const { data, error } = await supabase
        .from("institute_modules")
        .select("*")
        .eq("course_id", expandedCourseId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Module[];
    },
    enabled: !!expandedCourseId,
  });

  const addCourse = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("institute_courses").insert({
        title: "New Course",
        title_ko: "새 코스",
        sort_order: courses.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institute-courses"] });
      toast({ title: language === "ko" ? "코스가 추가되었습니다" : "Course added" });
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await supabase.from("institute_courses").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institute-courses"] });
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institute_courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institute-courses"] });
      toast({ title: language === "ko" ? "코스가 삭제되었습니다" : "Course deleted" });
    },
  });

  const expandedCourse = courses.find(c => c.id === expandedCourseId);

  const addModule = useMutation({
    mutationFn: async (courseId: string) => {
      const defaultTier = expandedCourse?.required_tier ?? 0;
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
      queryClient.invalidateQueries({ queryKey: ["admin-institute-modules", expandedCourseId] });
      toast({ title: language === "ko" ? "모듈이 추가되었습니다" : "Module added" });
    },
  });

  const updateModule = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await supabase.from("institute_modules").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institute-modules", expandedCourseId] });
    },
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institute_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institute-modules", expandedCourseId] });
      toast({ title: language === "ko" ? "모듈이 삭제되었습니다" : "Module deleted" });
    },
  });

  const getInstructorName = (userId: string | null) => {
    if (!userId) return "-";
    const inst = instructors.find(i => i.user_id === userId);
    return inst?.display_name || "-";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {language === "ko" ? "과목 목록" : "Course List"} ({courses.length})
        </h2>
        <Button onClick={() => addCourse.mutate()} disabled={addCourse.isPending}>
          <Plus className="w-4 h-4 mr-1" />
          {language === "ko" ? "코스 추가" : "Add Course"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {language === "ko" ? "등록된 코스가 없습니다" : "No courses yet"}
        </Card>
      ) : (
        <div className="space-y-2">
          {courses.map((course) => {
            const isExpanded = expandedCourseId === course.id;
            return (
              <Collapsible
                key={course.id}
                open={isExpanded}
                onOpenChange={(open) => setExpandedCourseId(open ? course.id : null)}
              >
                <Card className="overflow-hidden">
                  <div className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>

                    <Input
                      type="number"
                      className="w-16 h-8 text-xs"
                      defaultValue={course.sort_order}
                      onBlur={(e) => updateCourse.mutate({ id: course.id, field: "sort_order", value: parseInt(e.target.value) || 0 })}
                    />

                    <Input
                      className="flex-1 h-8 text-sm"
                      defaultValue={language === "ko" ? course.title_ko : course.title}
                      onBlur={(e) => updateCourse.mutate({ id: course.id, field: language === "ko" ? "title_ko" : "title", value: e.target.value })}
                    />

                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {getInstructorName(course.instructor_user_id)}
                    </span>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Free</span>
                        <Switch checked={course.is_free} onCheckedChange={(v) => updateCourse.mutate({ id: course.id, field: "is_free", value: v })} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Cert</span>
                        <Switch checked={course.is_certification} onCheckedChange={(v) => updateCourse.mutate({ id: course.id, field: "is_certification", value: v })} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Published</span>
                        <Switch checked={course.is_published} onCheckedChange={(v) => updateCourse.mutate({ id: course.id, field: "is_published", value: v })} />
                      </div>
                      {course.is_published && <Badge variant="default" className="text-xs">Live</Badge>}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                      onClick={() => {
                        if (confirm(language === "ko" ? "이 코스를 삭제하시겠습니까?" : "Delete this course?")) {
                          deleteCourse.mutate(course.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <CollapsibleContent>
                    <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title (EN)</label>
                          <Input defaultValue={course.title} onBlur={(e) => updateCourse.mutate({ id: course.id, field: "title", value: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">제목 (KO)</label>
                          <Input defaultValue={course.title_ko} onBlur={(e) => updateCourse.mutate({ id: course.id, field: "title_ko", value: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Description (EN)</label>
                          <Textarea defaultValue={course.description || ""} onBlur={(e) => updateCourse.mutate({ id: course.id, field: "description", value: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">설명 (KO)</label>
                          <Textarea defaultValue={course.description_ko || ""} onBlur={(e) => updateCourse.mutate({ id: course.id, field: "description_ko", value: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            {language === "ko" ? "담당 강사" : "Instructor"}
                          </label>
                          <Select
                            value={course.instructor_user_id || "none"}
                            onValueChange={(v) => updateCourse.mutate({ id: course.id, field: "instructor_user_id", value: v === "none" ? null : v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{language === "ko" ? "미지정" : "None"}</SelectItem>
                              {instructors.map((inst) => (
                                <SelectItem key={inst.user_id} value={inst.user_id}>
                                  {inst.display_name || inst.user_id.slice(0, 8)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            {language === "ko" ? "기본 접근 레벨" : "Default Access Tier"}
                          </label>
                          <Select
                            value={String(course.required_tier)}
                            onValueChange={(v) => updateCourse.mutate({ id: course.id, field: "required_tier", value: parseInt(v) })}
                          >
                            <SelectTrigger>
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
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Instructor Name (legacy)</label>
                          <Input defaultValue={course.instructor_name || ""} onBlur={(e) => updateCourse.mutate({ id: course.id, field: "instructor_name", value: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Duration (min)</label>
                          <Input type="number" defaultValue={course.duration_minutes || ""} onBlur={(e) => updateCourse.mutate({ id: course.id, field: "duration_minutes", value: parseInt(e.target.value) || null })} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Thumbnail URL</label>
                          <Input defaultValue={course.thumbnail_url || ""} onBlur={(e) => updateCourse.mutate({ id: course.id, field: "thumbnail_url", value: e.target.value || null })} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Badge Image URL</label>
                          <Input defaultValue={course.badge_image_url || ""} onBlur={(e) => updateCourse.mutate({ id: course.id, field: "badge_image_url", value: e.target.value || null })} />
                        </div>
                      </div>

                      {/* Modules */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold">
                            {language === "ko" ? "모듈" : "Modules"} ({modules.length})
                          </h3>
                          <Button size="sm" variant="outline" onClick={() => addModule.mutate(course.id)} disabled={addModule.isPending}>
                            <Plus className="w-3 h-3 mr-1" />
                            {language === "ko" ? "모듈 추가" : "Add Module"}
                          </Button>
                        </div>

                        {modules.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-16">#</TableHead>
                                <TableHead>Title (EN)</TableHead>
                                <TableHead>제목 (KO)</TableHead>
                                <TableHead>Video URL</TableHead>
                                <TableHead className="w-32">{language === "ko" ? "접근 레벨" : "Tier"}</TableHead>
                                <TableHead className="w-12"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {modules.map((mod) => (
                                <TableRow key={mod.id}>
                                  <TableCell>
                                    <Input type="number" className="w-14 h-7 text-xs" defaultValue={mod.sort_order} onBlur={(e) => updateModule.mutate({ id: mod.id, field: "sort_order", value: parseInt(e.target.value) || 0 })} />
                                  </TableCell>
                                  <TableCell>
                                    <Input className="h-7 text-sm" defaultValue={mod.title} onBlur={(e) => updateModule.mutate({ id: mod.id, field: "title", value: e.target.value })} />
                                  </TableCell>
                                  <TableCell>
                                    <Input className="h-7 text-sm" defaultValue={mod.title_ko} onBlur={(e) => updateModule.mutate({ id: mod.id, field: "title_ko", value: e.target.value })} />
                                  </TableCell>
                                  <TableCell>
                                    <Input className="h-7 text-sm" defaultValue={mod.video_url || ""} onBlur={(e) => updateModule.mutate({ id: mod.id, field: "video_url", value: e.target.value || null })} />
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={String(mod.required_tier)}
                                      onValueChange={(v) => updateModule.mutate({ id: mod.id, field: "required_tier", value: parseInt(v) })}
                                    >
                                      <SelectTrigger className="h-7 text-xs">
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
                                  </TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete this module?")) deleteModule.mutate(mod.id); }}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            {language === "ko" ? "모듈이 없습니다" : "No modules yet"}
                          </p>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
};
