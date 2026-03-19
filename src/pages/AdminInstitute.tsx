import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical, BookOpen } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

type Course = {
  id: string;
  title: string;
  title_ko: string;
  description: string | null;
  description_ko: string | null;
  instructor_name: string | null;
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
  created_at: string;
};

const AdminInstitute = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  // Fetch courses
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

  // Fetch modules for expanded course
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

  // Add course
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
      toast({ title: "코스가 추가되었습니다" });
    },
  });

  // Update course field
  const updateCourse = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await supabase
        .from("institute_courses")
        .update({ [field]: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institute-courses"] });
    },
  });

  // Delete course
  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institute_courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institute-courses"] });
      toast({ title: "코스가 삭제되었습니다" });
    },
  });

  // Add module
  const addModule = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase.from("institute_modules").insert({
        course_id: courseId,
        title: "New Module",
        title_ko: "새 모듈",
        sort_order: modules.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institute-modules", expandedCourseId] });
      toast({ title: "모듈이 추가되었습니다" });
    },
  });

  // Update module field
  const updateModule = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await supabase
        .from("institute_modules")
        .update({ [field]: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institute-modules", expandedCourseId] });
    },
  });

  // Delete module
  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institute_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institute-modules", expandedCourseId] });
      toast({ title: "모듈이 삭제되었습니다" });
    },
  });

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">K-Worship Institute</h1>
          </div>
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
                    {/* Course row */}
                    <div className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                      <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </CollapsibleTrigger>

                      {/* Sort order */}
                      <Input
                        type="number"
                        className="w-16 h-8 text-xs"
                        defaultValue={course.sort_order}
                        onBlur={(e) =>
                          updateCourse.mutate({ id: course.id, field: "sort_order", value: parseInt(e.target.value) || 0 })
                        }
                      />

                      {/* Title */}
                      <Input
                        className="flex-1 h-8 text-sm"
                        defaultValue={language === "ko" ? course.title_ko : course.title}
                        onBlur={(e) =>
                          updateCourse.mutate({
                            id: course.id,
                            field: language === "ko" ? "title_ko" : "title",
                            value: e.target.value,
                          })
                        }
                      />

                      {/* Toggles */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Free</span>
                          <Switch
                            checked={course.is_free}
                            onCheckedChange={(v) => updateCourse.mutate({ id: course.id, field: "is_free", value: v })}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Cert</span>
                          <Switch
                            checked={course.is_certification}
                            onCheckedChange={(v) =>
                              updateCourse.mutate({ id: course.id, field: "is_certification", value: v })
                            }
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Published</span>
                          <Switch
                            checked={course.is_published}
                            onCheckedChange={(v) =>
                              updateCourse.mutate({ id: course.id, field: "is_published", value: v })
                            }
                          />
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

                    {/* Expanded: course details + modules */}
                    <CollapsibleContent>
                      <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
                        {/* Course detail fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title (EN)</label>
                            <Input
                              defaultValue={course.title}
                              onBlur={(e) => updateCourse.mutate({ id: course.id, field: "title", value: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">제목 (KO)</label>
                            <Input
                              defaultValue={course.title_ko}
                              onBlur={(e) => updateCourse.mutate({ id: course.id, field: "title_ko", value: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description (EN)</label>
                            <Textarea
                              defaultValue={course.description || ""}
                              onBlur={(e) => updateCourse.mutate({ id: course.id, field: "description", value: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">설명 (KO)</label>
                            <Textarea
                              defaultValue={course.description_ko || ""}
                              onBlur={(e) => updateCourse.mutate({ id: course.id, field: "description_ko", value: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Instructor</label>
                            <Input
                              defaultValue={course.instructor_name || ""}
                              onBlur={(e) => updateCourse.mutate({ id: course.id, field: "instructor_name", value: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Duration (min)</label>
                            <Input
                              type="number"
                              defaultValue={course.duration_minutes || ""}
                              onBlur={(e) =>
                                updateCourse.mutate({ id: course.id, field: "duration_minutes", value: parseInt(e.target.value) || null })
                              }
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Thumbnail URL</label>
                            <Input
                              defaultValue={course.thumbnail_url || ""}
                              onBlur={(e) => updateCourse.mutate({ id: course.id, field: "thumbnail_url", value: e.target.value || null })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Badge Image URL</label>
                            <Input
                              defaultValue={course.badge_image_url || ""}
                              onBlur={(e) => updateCourse.mutate({ id: course.id, field: "badge_image_url", value: e.target.value || null })}
                            />
                          </div>
                        </div>

                        {/* Modules sub-table */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold">
                              {language === "ko" ? "모듈" : "Modules"} ({modules.length})
                            </h3>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addModule.mutate(course.id)}
                              disabled={addModule.isPending}
                            >
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
                                  <TableHead className="w-12"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {modules.map((mod) => (
                                  <TableRow key={mod.id}>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        className="w-14 h-7 text-xs"
                                        defaultValue={mod.sort_order}
                                        onBlur={(e) =>
                                          updateModule.mutate({ id: mod.id, field: "sort_order", value: parseInt(e.target.value) || 0 })
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        className="h-7 text-sm"
                                        defaultValue={mod.title}
                                        onBlur={(e) => updateModule.mutate({ id: mod.id, field: "title", value: e.target.value })}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        className="h-7 text-sm"
                                        defaultValue={mod.title_ko}
                                        onBlur={(e) => updateModule.mutate({ id: mod.id, field: "title_ko", value: e.target.value })}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        className="h-7 text-sm"
                                        defaultValue={mod.video_url || ""}
                                        onBlur={(e) => updateModule.mutate({ id: mod.id, field: "video_url", value: e.target.value || null })}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive"
                                        onClick={() => {
                                          if (confirm("Delete this module?")) deleteModule.mutate(mod.id);
                                        }}
                                      >
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
    </AdminLayout>
  );
};

export default AdminInstitute;
