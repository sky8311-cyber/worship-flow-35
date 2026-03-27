import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Trash2, ChevronDown, ChevronRight,
  FolderOpen, Folder, BookOpen, FileText, FileEdit,
  Award, GripVertical,
} from "lucide-react";
import { AdminImageUpload } from "./AdminImageUpload";
import { useTranslation } from "@/hooks/useTranslation";

const TIER_OPTIONS = [
  { value: "0", label: "모든 멤버", labelEn: "All Members" },
  { value: "1", label: "기본멤버 이상", labelEn: "Basic+" },
  { value: "2", label: "정식멤버 이상", labelEn: "Full+" },
  { value: "3", label: "공동체계정 이상", labelEn: "Community+" },
];

type SelectedItem = {
  type: "pathway" | "course" | "module" | "chapter";
  id: string;
};

export const AdminInstituteContentTree = () => {
  const { language } = useTranslation();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<SelectedItem | null>(null);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── Queries ──
  const { data: pathways = [] } = useQuery({
    queryKey: ["inst-pathways"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_certifications").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: certCourses = [] } = useQuery({
    queryKey: ["inst-cert-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_certification_courses").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["inst-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_courses").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["inst-modules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_modules").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ["inst-chapters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_chapters").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ["inst-instructors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_instructors").select("user_id, display_name");
      if (error) throw error;
      return data;
    },
  });

  // ── Invalidate helpers ──
  const inv = useCallback((...keys: string[]) => {
    keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  }, [qc]);

  // ── Mutations ──
  const addPathway = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("institute_certifications").insert({
        title: "New Pathway", title_ko: "새 패스웨이", sort_order: pathways.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { inv("inst-pathways"); toast({ title: "패스웨이 추가됨" }); },
  });

  const updatePathway = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await supabase.from("institute_certifications").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => inv("inst-pathways"),
  });

  const deletePathway = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("institute_certification_courses").delete().eq("certification_id", id);
      const { error } = await supabase.from("institute_certifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { inv("inst-pathways", "inst-cert-courses"); toast({ title: "패스웨이 삭제됨" }); },
  });

  const addCourse = useMutation({
    mutationFn: async (pathwayId?: string) => {
      const { data, error } = await supabase.from("institute_courses").insert({
        title: "New Course", title_ko: "새 코스", sort_order: courses.length,
      }).select("id").single();
      if (error) throw error;
      if (pathwayId && data) {
        const count = certCourses.filter((cc) => cc.certification_id === pathwayId).length;
        await supabase.from("institute_certification_courses").insert({
          certification_id: pathwayId, course_id: data.id, sort_order: count,
        });
      }
    },
    onSuccess: () => { inv("inst-courses", "inst-cert-courses"); toast({ title: "코스 추가됨" }); },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await supabase.from("institute_courses").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => inv("inst-courses"),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("institute_certification_courses").delete().eq("course_id", id);
      await supabase.from("institute_modules").delete().eq("course_id", id);
      const { error } = await supabase.from("institute_courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      inv("inst-courses", "inst-cert-courses", "inst-modules", "inst-chapters");
      toast({ title: "코스 삭제됨" });
    },
  });

  const addModule = useMutation({
    mutationFn: async (courseId: string) => {
      const count = modules.filter((m) => m.course_id === courseId).length;
      const { error } = await supabase.from("institute_modules").insert({
        course_id: courseId, title: "New Module", title_ko: "새 모듈", sort_order: count,
      });
      if (error) throw error;
    },
    onSuccess: () => { inv("inst-modules"); toast({ title: "모듈 추가됨" }); },
  });

  const updateModule = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await supabase.from("institute_modules").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => inv("inst-modules"),
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("institute_chapters").delete().eq("module_id", id);
      const { error } = await supabase.from("institute_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { inv("inst-modules", "inst-chapters"); toast({ title: "모듈 삭제됨" }); },
  });

  const addChapter = useMutation({
    mutationFn: async (moduleId: string) => {
      const count = chapters.filter((c) => c.module_id === moduleId).length;
      const { error } = await supabase.from("institute_chapters").insert({
        module_id: moduleId, title: "New Chapter", title_ko: "새 챕터", sort_order: count,
      });
      if (error) throw error;
    },
    onSuccess: () => { inv("inst-chapters"); toast({ title: "챕터 추가됨" }); },
  });

  const updateChapter = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await supabase.from("institute_chapters").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => inv("inst-chapters"),
  });

  const deleteChapter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institute_chapters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { inv("inst-chapters"); toast({ title: "챕터 삭제됨" }); },
  });

  // Move course to a different pathway
  const moveCourse = useMutation({
    mutationFn: async ({ courseId, newPathwayId }: { courseId: string; newPathwayId: string | null }) => {
      // Remove from current pathway
      await supabase.from("institute_certification_courses").delete().eq("course_id", courseId);
      // Add to new pathway
      if (newPathwayId) {
        const count = certCourses.filter((cc) => cc.certification_id === newPathwayId).length;
        await supabase.from("institute_certification_courses").insert({
          certification_id: newPathwayId, course_id: courseId, sort_order: count,
        });
      }
    },
    onSuccess: () => { inv("inst-cert-courses"); toast({ title: "코스 이동됨" }); },
  });

  // ── Derived data ──
  const assignedCourseIds = new Set(certCourses.map((cc) => cc.course_id));
  const unassignedCourses = courses.filter((c) => !assignedCourseIds.has(c.id));

  const getCoursesForPathway = (pathwayId: string) => {
    const ids = certCourses.filter((cc) => cc.certification_id === pathwayId).map((cc) => cc.course_id);
    return ids.map((id) => courses.find((c) => c.id === id)).filter(Boolean) as typeof courses;
  };

  const getModulesForCourse = (courseId: string) => modules.filter((m) => m.course_id === courseId);
  const getChaptersForModule = (moduleId: string) => chapters.filter((c) => c.module_id === moduleId);

  const isSelected = (type: string, id: string) => selected?.type === type && selected?.id === id;

  // ── Tree node renderer ──
  const TreeNode = ({
    icon: Icon,
    label,
    nodeKey,
    type,
    id,
    hasChildren,
    depth,
    badge: badgeText,
    onAdd,
    onDelete,
    addLabel,
    published,
  }: {
    icon: any;
    label: string;
    nodeKey: string;
    type: SelectedItem["type"];
    id: string;
    hasChildren: boolean;
    depth: number;
    badge?: string;
    onAdd?: () => void;
    onDelete?: () => void;
    addLabel?: string;
    published?: boolean;
  }) => {
    const isExp = expanded.has(nodeKey);
    const isSel = isSelected(type, id);

    return (
      <div
        className={`flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors group text-sm ${
          isSel ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => setSelected({ type, id })}
      >
        {hasChildren ? (
          <button
            className="p-0.5 hover:bg-muted rounded"
            onClick={(e) => { e.stopPropagation(); toggle(nodeKey); }}
          >
            {isExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-4.5" />
        )}
        <Icon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
        <span className="truncate flex-1">{label}</span>
        {published !== undefined && published && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0">Live</Badge>
        )}
        {badgeText && <span className="text-[10px] text-muted-foreground">{badgeText}</span>}
        <div className="hidden group-hover:flex items-center gap-0.5">
          {onAdd && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onAdd(); }} title={addLabel}>
              <Plus className="w-3 h-3" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm("삭제하시겠습니까?")) onDelete(); }}>
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ── Edit Panel ──
  const renderEditPanel = () => {
    if (!selected) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          왼쪽 트리에서 항목을 선택하세요
        </div>
      );
    }

    if (selected.type === "pathway") {
      const p = pathways.find((x) => x.id === selected.id);
      if (!p) return null;
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> 패스웨이 편집
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title (EN)</label>
              <Input defaultValue={p.title} key={p.id + "-title"} onBlur={(e) => updatePathway.mutate({ id: p.id, field: "title", value: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">제목 (KO)</label>
              <Input defaultValue={p.title_ko} key={p.id + "-title_ko"} onBlur={(e) => updatePathway.mutate({ id: p.id, field: "title_ko", value: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">설명 (KO)</label>
              <Textarea defaultValue={p.description_ko || ""} key={p.id + "-desc"} onBlur={(e) => updatePathway.mutate({ id: p.id, field: "description_ko", value: e.target.value || null })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">배지 이름</label>
              <Input defaultValue={(p as any).badge_name || ""} key={p.id + "-badge_name"} placeholder="예: K-Worship Essential" onBlur={(e) => updatePathway.mutate({ id: p.id, field: "badge_name", value: e.target.value || null })} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">배지 설명</label>
              <Textarea defaultValue={(p as any).badge_description || ""} key={p.id + "-badge_desc"} placeholder="배지에 대한 설명" onBlur={(e) => updatePathway.mutate({ id: p.id, field: "badge_description", value: e.target.value || null })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={p.is_published ?? false} onCheckedChange={(v) => updatePathway.mutate({ id: p.id, field: "is_published", value: v })} />
              <span className="text-sm">Published</span>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort Order</label>
              <Input type="number" defaultValue={p.sort_order ?? 0} key={p.id + "-sort"} onBlur={(e) => updatePathway.mutate({ id: p.id, field: "sort_order", value: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <AdminImageUpload currentUrl={p.badge_image_url} onUploadSuccess={(url) => updatePathway.mutate({ id: p.id, field: "badge_image_url", value: url })} folder="institute/cert-badges" label="배지 이미지" sizeGuide="400×400px (1:1)" aspectClass="aspect-square" maxSizeMB={2} />
            </div>
            <div>
              <AdminImageUpload currentUrl={p.certificate_template_url} onUploadSuccess={(url) => updatePathway.mutate({ id: p.id, field: "certificate_template_url", value: url })} folder="institute/cert-templates" label="수료증 템플릿" sizeGuide="1920×1357px (A4 가로)" aspectClass="aspect-[1920/1357]" maxSizeMB={5} />
            </div>
          </div>
        </div>
      );
    }

    if (selected.type === "course") {
      const c = courses.find((x) => x.id === selected.id);
      if (!c) return null;
      const currentPathwayId = certCourses.find((cc) => cc.course_id === c.id)?.certification_id || null;
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> 코스 편집
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title (EN)</label>
              <Input defaultValue={c.title} key={c.id + "-title"} onBlur={(e) => updateCourse.mutate({ id: c.id, field: "title", value: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">제목 (KO)</label>
              <Input defaultValue={c.title_ko} key={c.id + "-title_ko"} onBlur={(e) => updateCourse.mutate({ id: c.id, field: "title_ko", value: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description (EN)</label>
              <Textarea defaultValue={c.description || ""} key={c.id + "-desc"} onBlur={(e) => updateCourse.mutate({ id: c.id, field: "description", value: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">설명 (KO)</label>
              <Textarea defaultValue={c.description_ko || ""} key={c.id + "-desc_ko"} onBlur={(e) => updateCourse.mutate({ id: c.id, field: "description_ko", value: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">패스웨이</label>
              <Select value={currentPathwayId || "none"} onValueChange={(v) => moveCourse.mutate({ courseId: c.id, newPathwayId: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미지정</SelectItem>
                  {pathways.map((pw) => (
                    <SelectItem key={pw.id} value={pw.id}>{pw.title_ko}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">강사</label>
              <Select value={c.instructor_user_id || "none"} onValueChange={(v) => updateCourse.mutate({ id: c.id, field: "instructor_user_id", value: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미지정</SelectItem>
                  {instructors.map((inst) => (
                    <SelectItem key={inst.user_id} value={inst.user_id!}>{inst.display_name || "?"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">접근 레벨</label>
              <Select value={String(c.required_tier)} onValueChange={(v) => updateCourse.mutate({ id: c.id, field: "required_tier", value: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{language === "ko" ? opt.label : opt.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort Order</label>
              <Input type="number" defaultValue={c.sort_order ?? 0} key={c.id + "-sort"} onBlur={(e) => updateCourse.mutate({ id: c.id, field: "sort_order", value: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={c.is_published ?? false} onCheckedChange={(v) => updateCourse.mutate({ id: c.id, field: "is_published", value: v })} />
                <span className="text-sm">Published</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={c.is_free ?? false} onCheckedChange={(v) => updateCourse.mutate({ id: c.id, field: "is_free", value: v })} />
                <span className="text-sm">Free</span>
              </div>
            </div>
            <div>
              <AdminImageUpload currentUrl={c.thumbnail_url} onUploadSuccess={(url) => updateCourse.mutate({ id: c.id, field: "thumbnail_url", value: url })} folder="institute/thumbnails" label="썸네일" sizeGuide="1280×720px (16:9)" aspectClass="aspect-video" maxSizeMB={5} />
            </div>
            <div>
              <AdminImageUpload currentUrl={c.badge_image_url} onUploadSuccess={(url) => updateCourse.mutate({ id: c.id, field: "badge_image_url", value: url })} folder="institute/badges" label="배지" sizeGuide="400×400px (1:1)" aspectClass="aspect-square" maxSizeMB={2} />
            </div>
          </div>
        </div>
      );
    }

    if (selected.type === "module") {
      const m = modules.find((x) => x.id === selected.id);
      if (!m) return null;
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> 모듈 편집
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title (EN)</label>
              <Input defaultValue={m.title} key={m.id + "-title"} onBlur={(e) => updateModule.mutate({ id: m.id, field: "title", value: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">제목 (KO)</label>
              <Input defaultValue={m.title_ko} key={m.id + "-title_ko"} onBlur={(e) => updateModule.mutate({ id: m.id, field: "title_ko", value: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Video URL</label>
              <Input defaultValue={m.video_url || ""} key={m.id + "-video"} onBlur={(e) => updateModule.mutate({ id: m.id, field: "video_url", value: e.target.value || null })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">접근 레벨</label>
              <Select value={String(m.required_tier)} onValueChange={(v) => updateModule.mutate({ id: m.id, field: "required_tier", value: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{language === "ko" ? opt.label : opt.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort Order</label>
              <Input type="number" defaultValue={m.sort_order ?? 0} key={m.id + "-sort"} onBlur={(e) => updateModule.mutate({ id: m.id, field: "sort_order", value: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        </div>
      );
    }

    if (selected.type === "chapter") {
      const ch = chapters.find((x) => x.id === selected.id);
      if (!ch) return null;
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-primary" /> 챕터 편집
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title (EN)</label>
              <Input defaultValue={ch.title || ""} key={ch.id + "-title"} onBlur={(e) => updateChapter.mutate({ id: ch.id, field: "title", value: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">제목 (KO)</label>
              <Input defaultValue={ch.title_ko || ""} key={ch.id + "-title_ko"} onBlur={(e) => updateChapter.mutate({ id: ch.id, field: "title_ko", value: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Video URL</label>
              <Input defaultValue={ch.video_url || ""} key={ch.id + "-video"} onBlur={(e) => updateChapter.mutate({ id: ch.id, field: "video_url", value: e.target.value || null })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Audio URL</label>
              <Input defaultValue={ch.audio_url || ""} key={ch.id + "-audio"} onBlur={(e) => updateChapter.mutate({ id: ch.id, field: "audio_url", value: e.target.value || null })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">접근 레벨</label>
              <Select value={String(ch.required_tier ?? 0)} onValueChange={(v) => updateChapter.mutate({ id: ch.id, field: "required_tier", value: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{language === "ko" ? opt.label : opt.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort Order</label>
              <Input type="number" defaultValue={ch.sort_order ?? 0} key={ch.id + "-sort"} onBlur={(e) => updateChapter.mutate({ id: ch.id, field: "sort_order", value: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">콘텐츠 (HTML)</label>
              <Textarea className="min-h-[250px] font-mono text-xs" defaultValue={ch.content_ko || ""} key={ch.id + "-content"} onBlur={(e) => updateChapter.mutate({ id: ch.id, field: "content_ko", value: e.target.value || null })} />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex gap-4 min-h-[600px]">
      {/* Left: Tree */}
      <div className="w-[380px] flex-shrink-0 border rounded-lg">
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="text-sm font-semibold">커리큘럼 트리</h2>
          <Button size="sm" variant="outline" onClick={() => addPathway.mutate()} disabled={addPathway.isPending}>
            <Plus className="w-3 h-3 mr-1" /> 패스웨이
          </Button>
        </div>
        <ScrollArea className="h-[550px]">
          <div className="p-2 space-y-0.5">
            {pathways.map((pw) => {
              const pwKey = `pw-${pw.id}`;
              const pwCourses = getCoursesForPathway(pw.id);
              return (
                <div key={pw.id}>
                  <TreeNode
                    icon={expanded.has(pwKey) ? FolderOpen : Folder}
                    label={pw.title_ko}
                    nodeKey={pwKey}
                    type="pathway"
                    id={pw.id}
                    hasChildren={pwCourses.length > 0}
                    depth={0}
                    badge={`${pwCourses.length}`}
                    published={pw.is_published ?? false}
                    onAdd={() => addCourse.mutate(pw.id)}
                    onDelete={() => deletePathway.mutate(pw.id)}
                    addLabel="코스 추가"
                  />
                  {expanded.has(pwKey) && pwCourses.map((course) => {
                    const cKey = `c-${course.id}`;
                    const cModules = getModulesForCourse(course.id);
                    return (
                      <div key={course.id}>
                        <TreeNode
                          icon={BookOpen}
                          label={course.title_ko}
                          nodeKey={cKey}
                          type="course"
                          id={course.id}
                          hasChildren={cModules.length > 0}
                          depth={1}
                          badge={`${cModules.length}m`}
                          published={course.is_published ?? false}
                          onAdd={() => addModule.mutate(course.id)}
                          onDelete={() => deleteCourse.mutate(course.id)}
                          addLabel="모듈 추가"
                        />
                        {expanded.has(cKey) && cModules.map((mod) => {
                          const mKey = `m-${mod.id}`;
                          const mChapters = getChaptersForModule(mod.id);
                          return (
                            <div key={mod.id}>
                              <TreeNode
                                icon={FileText}
                                label={mod.title_ko}
                                nodeKey={mKey}
                                type="module"
                                id={mod.id}
                                hasChildren={mChapters.length > 0}
                                depth={2}
                                badge={`${mChapters.length}ch`}
                                onAdd={() => addChapter.mutate(mod.id)}
                                onDelete={() => deleteModule.mutate(mod.id)}
                                addLabel="챕터 추가"
                              />
                              {expanded.has(mKey) && mChapters.map((ch) => (
                                <TreeNode
                                  key={ch.id}
                                  icon={FileEdit}
                                  label={ch.title_ko || ch.title || "Untitled"}
                                  nodeKey={`ch-${ch.id}`}
                                  type="chapter"
                                  id={ch.id}
                                  hasChildren={false}
                                  depth={3}
                                  onDelete={() => deleteChapter.mutate(ch.id)}
                                />
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Unassigned courses */}
            {unassignedCourses.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-medium text-muted-foreground">미지정 코스</span>
                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => addCourse.mutate(undefined)}>
                    <Plus className="w-3 h-3 mr-1" /> 코스
                  </Button>
                </div>
                {unassignedCourses.map((course) => {
                  const cKey = `c-${course.id}`;
                  const cModules = getModulesForCourse(course.id);
                  return (
                    <div key={course.id}>
                      <TreeNode
                        icon={BookOpen}
                        label={course.title_ko}
                        nodeKey={cKey}
                        type="course"
                        id={course.id}
                        hasChildren={cModules.length > 0}
                        depth={0}
                        badge={`${cModules.length}m`}
                        published={course.is_published ?? false}
                        onAdd={() => addModule.mutate(course.id)}
                        onDelete={() => deleteCourse.mutate(course.id)}
                        addLabel="모듈 추가"
                      />
                      {expanded.has(cKey) && cModules.map((mod) => {
                        const mKey = `m-${mod.id}`;
                        const mChapters = getChaptersForModule(mod.id);
                        return (
                          <div key={mod.id}>
                            <TreeNode
                              icon={FileText}
                              label={mod.title_ko}
                              nodeKey={mKey}
                              type="module"
                              id={mod.id}
                              hasChildren={mChapters.length > 0}
                              depth={1}
                              badge={`${mChapters.length}ch`}
                              onAdd={() => addChapter.mutate(mod.id)}
                              onDelete={() => deleteModule.mutate(mod.id)}
                              addLabel="챕터 추가"
                            />
                            {expanded.has(mKey) && mChapters.map((ch) => (
                              <TreeNode
                                key={ch.id}
                                icon={FileEdit}
                                label={ch.title_ko || ch.title || "Untitled"}
                                nodeKey={`ch-${ch.id}`}
                                type="chapter"
                                id={ch.id}
                                hasChildren={false}
                                depth={2}
                                onDelete={() => deleteChapter.mutate(ch.id)}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {pathways.length === 0 && unassignedCourses.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                패스웨이를 추가하여 커리큘럼을 구성하세요
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Edit Panel */}
      <Card className="flex-1 p-5 overflow-auto">
        {renderEditPanel()}
      </Card>
    </div>
  );
};
