import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, X, ChevronDown, ChevronRight, GripVertical, BookOpen, FileText, Award } from "lucide-react";
import { AdminImageUpload } from "./AdminImageUpload";
import { useTranslation } from "@/hooks/useTranslation";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Certification = {
  id: string;
  title: string;
  title_ko: string;
  description_ko: string | null;
  badge_name: string | null;
  badge_description: string | null;
  badge_image_url: string | null;
  certificate_template_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

type CertCourse = {
  id: string;
  certification_id: string;
  course_id: string;
  sort_order: number;
};

type Course = {
  id: string;
  title: string;
  title_ko: string;
  instructor_user_id: string | null;
};

type Module = {
  id: string;
  course_id: string;
  title: string;
  title_ko: string;
  sort_order: number;
};

type Instructor = {
  user_id: string | null;
  display_name: string | null;
};

// Sortable course item
const SortableCourseNode = ({
  certCourse,
  course,
  instructorName,
  modules,
  expanded,
  onToggle,
  onRemove,
  language,
}: {
  certCourse: CertCourse;
  course: Course | undefined;
  instructorName: string;
  modules: Module[];
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  language: string;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: certCourse.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  if (!course) return null;

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg bg-card">
      <div className="flex items-center gap-2 p-3">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
        <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="flex-1 text-sm font-medium">
          {language === "ko" ? course.title_ko : course.title}
        </span>
        {instructorName !== "-" && (
          <Badge variant="secondary" className="text-xs">{instructorName}</Badge>
        )}
        <span className="text-xs text-muted-foreground">{modules.length} modules</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onRemove}>
          <X className="w-3 h-3" />
        </Button>
      </div>
      {expanded && modules.length > 0 && (
        <div className="border-t px-4 py-2 space-y-1 bg-muted/10">
          {modules.map((mod) => (
            <div key={mod.id} className="flex items-center gap-2 py-1 pl-8 text-sm text-muted-foreground">
              <FileText className="w-3 h-3 flex-shrink-0" />
              <span>{language === "ko" ? mod.title_ko : mod.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminInstituteCertifications = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedCertId, setSelectedCertId] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [addingCourse, setAddingCourse] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Queries
  const { data: certifications = [] } = useQuery({
    queryKey: ["admin-certifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_certifications")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Certification[];
    },
  });

  const { data: certCourses = [] } = useQuery({
    queryKey: ["admin-cert-courses", selectedCertId],
    queryFn: async () => {
      if (!selectedCertId) return [];
      const { data, error } = await supabase
        .from("institute_certification_courses")
        .select("*")
        .eq("certification_id", selectedCertId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CertCourse[];
    },
    enabled: !!selectedCertId,
  });

  const { data: allCourses = [] } = useQuery({
    queryKey: ["admin-all-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_courses")
        .select("id, title, title_ko, instructor_user_id")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Course[];
    },
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ["admin-institute-instructors-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_instructors")
        .select("user_id, display_name");
      if (error) throw error;
      return data as Instructor[];
    },
  });

  // Fetch modules for all assigned courses
  const assignedCourseIds = certCourses.map((cc) => cc.course_id);
  const { data: modules = [] } = useQuery({
    queryKey: ["admin-cert-modules", assignedCourseIds],
    queryFn: async () => {
      if (assignedCourseIds.length === 0) return [];
      const { data, error } = await supabase
        .from("institute_modules")
        .select("id, course_id, title, title_ko, sort_order")
        .in("course_id", assignedCourseIds)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Module[];
    },
    enabled: assignedCourseIds.length > 0,
  });

  // Mutations
  const addCert = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("institute_certifications").insert({
        title: "New Certification",
        title_ko: "새 자격증",
        sort_order: certifications.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-certifications"] });
      toast({ title: language === "ko" ? "자격증이 추가되었습니다" : "Certification added" });
    },
  });

  const updateCert = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await supabase.from("institute_certifications").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-certifications"] }),
  });

  const deleteCert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institute_certifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-certifications"] });
      if (selectedCertId) setSelectedCertId(null);
      toast({ title: language === "ko" ? "자격증이 삭제되었습니다" : "Certification deleted" });
    },
  });

  const addCertCourse = useMutation({
    mutationFn: async (courseId: string) => {
      if (!selectedCertId) return;
      const { error } = await supabase.from("institute_certification_courses").insert({
        certification_id: selectedCertId,
        course_id: courseId,
        sort_order: certCourses.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cert-courses", selectedCertId] });
      setAddingCourse(false);
      toast({ title: language === "ko" ? "과목이 추가되었습니다" : "Course added to pathway" });
    },
  });

  const removeCertCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institute_certification_courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cert-courses", selectedCertId] });
      toast({ title: language === "ko" ? "과목이 제거되었습니다" : "Course removed from pathway" });
    },
  });

  const reorderCertCourses = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const item of items) {
        await supabase.from("institute_certification_courses").update({ sort_order: item.sort_order }).eq("id", item.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-cert-courses", selectedCertId] }),
  });

  const getInstructorName = (userId: string | null) => {
    if (!userId) return "-";
    return instructors.find((i) => i.user_id === userId)?.display_name || "-";
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = certCourses.findIndex((c) => c.id === active.id);
    const newIndex = certCourses.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(certCourses, oldIndex, newIndex);
    reorderCertCourses.mutate(reordered.map((c, i) => ({ id: c.id, sort_order: i })));
  };

  const toggleCourseExpand = (courseId: string) => {
    setExpandedCourses((prev) => {
      const next = new Set(prev);
      next.has(courseId) ? next.delete(courseId) : next.add(courseId);
      return next;
    });
  };

  const selectedCert = certifications.find((c) => c.id === selectedCertId);
  const assignedIds = new Set(certCourses.map((cc) => cc.course_id));
  const availableCourses = allCourses.filter((c) => !assignedIds.has(c.id));

  return (
    <div className="flex gap-4 min-h-[500px]">
      {/* Left panel — Certification list */}
      <div className="w-80 flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">
            {language === "ko" ? "자격증 목록" : "Certifications"} ({certifications.length})
          </h2>
          <Button size="sm" onClick={() => addCert.mutate()} disabled={addCert.isPending}>
            <Plus className="w-3 h-3 mr-1" />
            {language === "ko" ? "추가" : "Add"}
          </Button>
        </div>

        {certifications.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            {language === "ko" ? "등록된 자격증이 없습니다" : "No certifications yet"}
          </Card>
        ) : (
          certifications.map((cert) => (
            <Card
              key={cert.id}
              className={`p-3 cursor-pointer transition-colors ${selectedCertId === cert.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/30"}`}
              onClick={() => setSelectedCertId(cert.id)}
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Input
                    className="h-7 text-sm font-medium border-none p-0 bg-transparent focus-visible:ring-0"
                    defaultValue={cert.title_ko}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => updateCert.mutate({ id: cert.id, field: "title_ko", value: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={cert.is_published}
                    onCheckedChange={(v) => updateCert.mutate({ id: cert.id, field: "is_published", value: v })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(language === "ko" ? "삭제하시겠습니까?" : "Delete?")) deleteCert.mutate(cert.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {cert.is_published && <Badge variant="default" className="text-xs mt-1">Live</Badge>}
            </Card>
          ))
        )}
      </div>

      {/* Right panel — Pathway Tree */}
      <div className="flex-1 min-w-0">
        {!selectedCert ? (
          <Card className="p-12 text-center text-muted-foreground">
            {language === "ko" ? "왼쪽에서 자격증을 선택하세요" : "Select a certification from the left"}
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Cert details */}
            <Card className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Title (EN)</label>
                  <Input defaultValue={selectedCert.title} onBlur={(e) => updateCert.mutate({ id: selectedCert.id, field: "title", value: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">제목 (KO)</label>
                  <Input defaultValue={selectedCert.title_ko} onBlur={(e) => updateCert.mutate({ id: selectedCert.id, field: "title_ko", value: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">설명 (KO)</label>
                  <Textarea defaultValue={selectedCert.description_ko || ""} onBlur={(e) => updateCert.mutate({ id: selectedCert.id, field: "description_ko", value: e.target.value || null })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">배지 이름</label>
                  <Input defaultValue={selectedCert.badge_name || ""} placeholder="예: K-Worship Essential" onBlur={(e) => updateCert.mutate({ id: selectedCert.id, field: "badge_name", value: e.target.value || null })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">배지 설명</label>
                  <Textarea defaultValue={selectedCert.badge_description || ""} placeholder="배지에 대한 설명" onBlur={(e) => updateCert.mutate({ id: selectedCert.id, field: "badge_description", value: e.target.value || null })} />
                </div>
                <div>
                  <AdminImageUpload
                    currentUrl={selectedCert.badge_image_url}
                    onUploadSuccess={(url) => updateCert.mutate({ id: selectedCert.id, field: "badge_image_url", value: url })}
                    folder="institute/cert-badges"
                    label="배지 이미지"
                    sizeGuide="권장: 400×400px (1:1), 최대 2MB"
                    aspectClass="aspect-square"
                    maxSizeMB={2}
                  />
                </div>
                <div>
                  <AdminImageUpload
                    currentUrl={selectedCert.certificate_template_url}
                    onUploadSuccess={(url) => updateCert.mutate({ id: selectedCert.id, field: "certificate_template_url", value: url })}
                    folder="institute/cert-templates"
                    label="수료증 템플릿"
                    sizeGuide="권장: 1920×1357px (A4 가로), 최대 5MB"
                    aspectClass="aspect-[1920/1357]"
                    maxSizeMB={5}
                  />
                </div>
              </div>
            </Card>

            {/* Pathway Tree */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  {language === "ko" ? "패스웨이" : "Pathway"} ({certCourses.length} {language === "ko" ? "과목" : "courses"})
                </h3>
                {addingCourse ? (
                  <div className="flex items-center gap-2">
                    <Select onValueChange={(v) => addCertCourse.mutate(v)}>
                      <SelectTrigger className="w-56 h-8 text-sm">
                        <SelectValue placeholder={language === "ko" ? "과목 선택..." : "Select course..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCourses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {language === "ko" ? c.title_ko : c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" onClick={() => setAddingCourse(false)}>
                      {language === "ko" ? "취소" : "Cancel"}
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setAddingCourse(true)} disabled={availableCourses.length === 0}>
                    <Plus className="w-3 h-3 mr-1" />
                    {language === "ko" ? "과목 추가" : "Add Course"}
                  </Button>
                )}
              </div>

              {/* Root node */}
              <div className="border-l-2 border-primary/30 pl-4 ml-2 space-y-2">
                {certCourses.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    {language === "ko" ? "과목을 추가하여 패스웨이를 구성하세요" : "Add courses to build the pathway"}
                  </p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={certCourses.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                      {certCourses.map((cc) => {
                        const course = allCourses.find((c) => c.id === cc.course_id);
                        const courseModules = modules.filter((m) => m.course_id === cc.course_id);
                        return (
                          <SortableCourseNode
                            key={cc.id}
                            certCourse={cc}
                            course={course}
                            instructorName={getInstructorName(course?.instructor_user_id ?? null)}
                            modules={courseModules}
                            expanded={expandedCourses.has(cc.course_id)}
                            onToggle={() => toggleCourseExpand(cc.course_id)}
                            onRemove={() => removeCertCourse.mutate(cc.id)}
                            language={language}
                          />
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
