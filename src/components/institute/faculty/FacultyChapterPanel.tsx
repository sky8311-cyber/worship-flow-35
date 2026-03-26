import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, HelpCircle, Check, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { ChapterBlockEditor } from "./ChapterBlockEditor";
import { QuizBuilder } from "./QuizBuilder";

interface Props {
  courseId: string;
  moduleId: string;
}

export const FacultyChapterPanel = ({ courseId, moduleId }: Props) => {

export const FacultyChapterPanel = ({ courseId, moduleId }: Props) => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  const { data: mod } = useQuery({
    queryKey: ["faculty-module-detail", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_modules").select("*").eq("id", moduleId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!moduleId,
  });

  const [titleKo, setTitleKo] = useState("");
  const [descKo, setDescKo] = useState("");

  useEffect(() => {
    if (mod) {
      setTitleKo(mod.title_ko || "");
      setDescKo((mod as any).description_ko || "");
    }
  }, [mod]);

  const { data: chapters = [] } = useQuery({
    queryKey: ["faculty-chapters", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_chapters")
        .select("*")
        .eq("module_id", moduleId)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!moduleId,
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ["faculty-quizzes", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_quizzes" as any)
        .select("*, institute_quiz_questions(id)" as any)
        .eq("module_id", moduleId);
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!moduleId,
  });

  const updateModule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("institute_modules")
        .update({ title_ko: titleKo, title: titleKo, description_ko: descKo } as any)
        .eq("id", moduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-module-detail", moduleId] });
      queryClient.invalidateQueries({ queryKey: ["faculty-modules"] });
      toast.success(language === "ko" ? "저장됨" : "Saved");
    },
  });

  const addChapter = useMutation({
    mutationFn: async () => {
      const maxSort = chapters.length > 0 ? Math.max(...chapters.map((c) => c.sort_order || 0)) + 1 : 0;
      const { error } = await supabase.from("institute_chapters").insert({
        module_id: moduleId,
        title_ko: language === "ko" ? "새 페이지" : "New Page",
        title: "New Page",
        sort_order: maxSort,
        content_type: "blocks",
        content_blocks: [],
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-chapters", moduleId] });
      toast.success(language === "ko" ? "페이지 추가됨" : "Page added");
    },
  });

  const deleteChapter = useMutation({
    mutationFn: async (chapterId: string) => {
      const { error } = await supabase.from("institute_chapters").delete().eq("id", chapterId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-chapters", moduleId] });
      toast.success(language === "ko" ? "페이지 삭제됨" : "Page deleted");
    },
  });

  const getBlockPreview = (chapter: any): string => {
    if ((chapter as any).content_type === "blocks" && Array.isArray((chapter as any).content_blocks)) {
      const blocks = (chapter as any).content_blocks;
      const textBlock = blocks.find((b: any) => b.type === "paragraph" || b.type === "heading");
      return textBlock?.data?.text?.slice(0, 60) || "";
    }
    if (chapter.content_ko) {
      return chapter.content_ko.replace(/<[^>]+>/g, "").slice(0, 60);
    }
    return "";
  };

  return (
    <div className="border border-border rounded-xl bg-card p-4 h-full flex flex-col">
      {/* Module title editing */}
      <div className="mb-4 space-y-2">
        <Input
          value={titleKo}
          onChange={(e) => setTitleKo(e.target.value)}
          className="text-lg font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0"
          placeholder={language === "ko" ? "모듈 제목" : "Module title"}
        />
        <Textarea
          value={descKo}
          onChange={(e) => setDescKo(e.target.value)}
          className="text-sm min-h-[60px] resize-none"
          placeholder={language === "ko" ? "모듈 설명 (선택)" : "Module description (optional)"}
        />
        <Button size="sm" variant="outline" onClick={() => updateModule.mutate()} disabled={updateModule.isPending}>
          <Check className="w-3.5 h-3.5 mr-1" />
          {language === "ko" ? "저장" : "Save"}
        </Button>
      </div>

      {/* Chapters */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {language === "ko" ? "페이지" : "Pages"} ({chapters.length})
        </span>
        <Button size="sm" variant="outline" onClick={() => addChapter.mutate()} disabled={addChapter.isPending}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          {language === "ko" ? "페이지 추가" : "Add Page"}
        </Button>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto mb-4">
        {chapters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {language === "ko" ? "페이지가 없습니다" : "No pages yet"}
          </div>
        ) : (
          chapters.map((ch, idx) => {
            const preview = getBlockPreview(ch);
            return (
              <Card key={ch.id} className="p-3 group hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-medium text-muted-foreground">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {ch.title_ko || ch.title || `Page ${idx + 1}`}
                    </div>
                    {preview && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{preview}...</div>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        {(ch as any).content_type === "blocks" ? "Blocks" : "HTML"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingChapterId(ch.id)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                      onClick={() => deleteChapter.mutate(ch.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Quiz section */}
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            {language === "ko" ? "퀴즈" : "Quiz"}
          </span>
        </div>
        {quizzes.length === 0 ? (
          <Button size="sm" variant="outline" className="w-full" onClick={() => setCreatingQuiz(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            {language === "ko" ? "퀴즈 추가" : "Add Quiz"}
          </Button>
        ) : (
          quizzes.map((q: any) => (
            <Card key={q.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{q.title_ko || q.title || "Quiz"}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {q.institute_quiz_questions?.length || 0} {language === "ko" ? "문항" : "questions"} · 
                    {language === "ko" ? ` 합격 ${q.pass_threshold}%` : ` Pass ${q.pass_threshold}%`}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditingQuizId(q.id)}>
                  {language === "ko" ? "편집" : "Edit"}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Block Editor Modal */}
      {editingChapterId && (
        <ChapterBlockEditor
          chapterId={editingChapterId}
          onClose={() => {
            setEditingChapterId(null);
            queryClient.invalidateQueries({ queryKey: ["faculty-chapters", moduleId] });
          }}
        />
      )}

      {/* Quiz Builder Modal */}
      {(editingQuizId || creatingQuiz) && (
        <QuizBuilder
          moduleId={moduleId}
          quizId={editingQuizId || undefined}
          onClose={() => {
            setEditingQuizId(null);
            setCreatingQuiz(false);
            queryClient.invalidateQueries({ queryKey: ["faculty-quizzes", moduleId] });
          }}
        />
      )}
    </div>
  );
};
