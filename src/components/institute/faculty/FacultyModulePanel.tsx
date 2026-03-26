import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, GripVertical, Trash2, BookOpen, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  courseId: string;
  selectedModuleId: string;
  onSelectModule: (id: string) => void;
}

const SortableModuleCard = ({
  mod, isActive, chapterCount, quizCount, onSelect, onDelete, language,
}: {
  mod: any; isActive: boolean; chapterCount: number; quizCount: number;
  onSelect: () => void; onDelete: () => void; language: string;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: mod.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 cursor-pointer transition-colors group ${
        isActive ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab">
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {language === "ko" ? mod.title_ko : mod.title}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <BookOpen className="w-3 h-3" /> {chapterCount}
            </span>
            <span className="flex items-center gap-0.5">
              <HelpCircle className="w-3 h-3" /> {quizCount}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
};

export const FacultyModulePanel = ({ courseId, selectedModuleId, onSelectModule }: Props) => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { data: modules = [] } = useQuery({
    queryKey: ["faculty-modules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_modules")
        .select("*")
        .eq("course_id", courseId)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId,
  });

  const { data: chapterCounts = {} } = useQuery({
    queryKey: ["faculty-chapter-counts", courseId],
    queryFn: async () => {
      const moduleIds = modules.map((m) => m.id);
      if (moduleIds.length === 0) return {};
      const { data, error } = await supabase
        .from("institute_chapters")
        .select("module_id")
        .in("module_id", moduleIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((c) => { if (c.module_id) counts[c.module_id] = (counts[c.module_id] || 0) + 1; });
      return counts;
    },
    enabled: modules.length > 0,
  });

  const { data: quizCounts = {} } = useQuery({
    queryKey: ["faculty-quiz-counts", courseId],
    queryFn: async () => {
      const moduleIds = modules.map((m) => m.id);
      if (moduleIds.length === 0) return {};
      const { data, error } = await supabase
        .from("institute_quizzes" as any)
        .select("module_id")
        .in("module_id", moduleIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      ((data as any[]) || []).forEach((q) => { if (q.module_id) counts[q.module_id] = (counts[q.module_id] || 0) + 1; });
      return counts;
    },
    enabled: modules.length > 0,
  });

  const addModule = useMutation({
    mutationFn: async () => {
      const title = newTitle.trim() || "New Module";
      const maxSort = modules.length > 0 ? Math.max(...modules.map((m) => m.sort_order || 0)) + 1 : 0;
      const { error } = await supabase.from("institute_modules").insert({
        course_id: courseId,
        title: title,
        title_ko: title,
        sort_order: maxSort,
        required_tier: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-modules", courseId] });
      setNewTitle("");
      setShowAdd(false);
      toast.success(language === "ko" ? "모듈 추가됨" : "Module added");
    },
  });

  const deleteModule = useMutation({
    mutationFn: async (moduleId: string) => {
      const { error } = await supabase.from("institute_modules").delete().eq("id", moduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-modules", courseId] });
      if (selectedModuleId) onSelectModule("");
      toast.success(language === "ko" ? "모듈 삭제됨" : "Module deleted");
    },
  });

  const reorderModules = useMutation({
    mutationFn: async (reordered: any[]) => {
      const updates = reordered.map((m, i) => supabase.from("institute_modules").update({ sort_order: i }).eq("id", m.id));
      await Promise.all(updates);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["faculty-modules", courseId] }),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = modules.findIndex((m) => m.id === active.id);
    const newIdx = modules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(modules, oldIdx, newIdx);
    queryClient.setQueryData(["faculty-modules", courseId], reordered);
    reorderModules.mutate(reordered);
  };

  return (
    <div className="w-[280px] flex-shrink-0 border border-border rounded-xl bg-card p-3 flex flex-col gap-2">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
        {language === "ko" ? "모듈" : "Modules"} ({modules.length})
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
            {modules.map((mod) => (
              <SortableModuleCard
                key={mod.id}
                mod={mod}
                isActive={mod.id === selectedModuleId}
                chapterCount={(chapterCounts as any)[mod.id] || 0}
                quizCount={(quizCounts as any)[mod.id] || 0}
                onSelect={() => onSelectModule(mod.id)}
                onDelete={() => deleteModule.mutate(mod.id)}
                language={language}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {showAdd ? (
        <div className="flex gap-1.5">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={language === "ko" ? "모듈 제목" : "Module title"}
            className="text-sm h-8"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && addModule.mutate()}
          />
          <Button size="sm" className="h-8 px-3" onClick={() => addModule.mutate()} disabled={addModule.isPending}>
            {language === "ko" ? "추가" : "Add"}
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          {language === "ko" ? "모듈 추가" : "Add Module"}
        </Button>
      )}
    </div>
  );
};
