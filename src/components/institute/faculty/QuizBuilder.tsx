import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X, Save, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface QuizQuestion {
  id: string;
  question_text_ko: string;
  question_text: string;
  options: { text: string }[];
  correct_answer_index: number;
  explanation_ko: string;
  sort_order: number;
  _isNew?: boolean;
}

interface Props {
  moduleId: string;
  quizId?: string;
  onClose: () => void;
}

const SortableQuestionCard = ({
  q, idx, onChange, onDelete,
}: {
  q: QuizQuestion; idx: number;
  onChange: (q: QuizQuestion) => void; onDelete: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: q.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const updateOption = (optIdx: number, text: string) => {
    const opts = [...q.options];
    opts[optIdx] = { text };
    onChange({ ...q, options: opts });
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 mb-3">
      <div className="flex items-start gap-2 mb-3">
        <button {...attributes} {...listeners} className="mt-1 text-muted-foreground hover:text-foreground cursor-grab">
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-muted-foreground mt-1 w-6">{idx + 1}.</span>
        <div className="flex-1 space-y-2">
          <Textarea
            value={q.question_text_ko}
            onChange={(e) => onChange({ ...q, question_text_ko: e.target.value, question_text: e.target.value })}
            placeholder="질문을 입력하세요"
            className="min-h-[60px] resize-none"
          />
        </div>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <RadioGroup
        value={String(q.correct_answer_index)}
        onValueChange={(v) => onChange({ ...q, correct_answer_index: parseInt(v) })}
        className="space-y-2 ml-12"
      >
        {q.options.map((opt, optIdx) => (
          <div key={optIdx} className="flex items-center gap-2">
            <RadioGroupItem value={String(optIdx)} id={`${q.id}-${optIdx}`} />
            <Label htmlFor={`${q.id}-${optIdx}`} className="text-sm font-medium w-5">
              {String.fromCharCode(65 + optIdx)}
            </Label>
            <Input
              value={opt.text}
              onChange={(e) => updateOption(optIdx, e.target.value)}
              placeholder={`선택지 ${String.fromCharCode(65 + optIdx)}`}
              className="flex-1 h-8 text-sm"
            />
          </div>
        ))}
      </RadioGroup>

      <div className="ml-12 mt-3">
        <Textarea
          value={q.explanation_ko}
          onChange={(e) => onChange({ ...q, explanation_ko: e.target.value })}
          placeholder="정답 해설 (선택)"
          className="min-h-[40px] resize-none text-sm"
        />
      </div>
    </Card>
  );
};

export const QuizBuilder = ({ moduleId, quizId, onClose }: Props) => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [titleKo, setTitleKo] = useState("");
  const [passThreshold, setPassThreshold] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [timeLimit, setTimeLimit] = useState<number | "">("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const { data: quiz } = useQuery({
    queryKey: ["quiz-builder", quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_quizzes" as any)
        .select("*")
        .eq("id", quizId!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!quizId,
  });

  const { data: existingQuestions = [] } = useQuery({
    queryKey: ["quiz-builder-questions", quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_quiz_questions" as any)
        .select("*")
        .eq("quiz_id", quizId!)
        .order("sort_order");
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!quizId,
  });

  useEffect(() => {
    if (quiz) {
      setTitleKo(quiz.title_ko || "");
      setPassThreshold(quiz.pass_threshold || 70);
      setMaxAttempts(quiz.max_attempts || 3);
      setTimeLimit(quiz.time_limit_minutes || "");
    }
  }, [quiz]);

  useEffect(() => {
    if (existingQuestions.length > 0) {
      setQuestions(existingQuestions.map((q: any) => ({
        id: q.id,
        question_text_ko: q.question_text_ko,
        question_text: q.question_text,
        options: Array.isArray(q.options) ? q.options : [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
        correct_answer_index: q.correct_answer_index,
        explanation_ko: q.explanation_ko || "",
        sort_order: q.sort_order,
      })));
    }
  }, [existingQuestions]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        question_text_ko: "",
        question_text: "",
        options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
        correct_answer_index: 0,
        explanation_ko: "",
        sort_order: prev.length,
        _isNew: true,
      },
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let currentQuizId = quizId;

      if (!currentQuizId) {
        const { data, error } = await supabase
          .from("institute_quizzes" as any)
          .insert({
            module_id: moduleId,
            title_ko: titleKo || "퀴즈",
            title: titleKo || "Quiz",
            pass_threshold: passThreshold,
            max_attempts: maxAttempts,
            time_limit_minutes: timeLimit || null,
            is_published: true,
          } as any)
          .select("id")
          .single();
        if (error) throw error;
        currentQuizId = (data as any).id;
      } else {
        const { error } = await supabase
          .from("institute_quizzes" as any)
          .update({
            title_ko: titleKo,
            title: titleKo,
            pass_threshold: passThreshold,
            max_attempts: maxAttempts,
            time_limit_minutes: timeLimit || null,
          } as any)
          .eq("id", currentQuizId);
        if (error) throw error;
      }

      // Delete removed questions
      const existingIds = existingQuestions.map((q: any) => q.id);
      const currentIds = questions.filter((q) => !q._isNew).map((q) => q.id);
      const deletedIds = existingIds.filter((id: string) => !currentIds.includes(id));
      if (deletedIds.length > 0) {
        await supabase.from("institute_quiz_questions" as any).delete().in("id", deletedIds);
      }

      // Upsert questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const payload = {
          quiz_id: currentQuizId,
          question_text: q.question_text_ko,
          question_text_ko: q.question_text_ko,
          options: q.options,
          correct_answer_index: q.correct_answer_index,
          explanation_ko: q.explanation_ko || null,
          sort_order: i,
        };

        if (q._isNew) {
          const { error } = await supabase.from("institute_quiz_questions" as any).insert(payload as any);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("institute_quiz_questions" as any).update(payload as any).eq("id", q.id);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-quizzes"] });
      toast.success(language === "ko" ? "퀴즈 저장됨" : "Quiz saved");
      onClose();
    },
    onError: () => toast.error(language === "ko" ? "저장 실패" : "Save failed"),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setQuestions((prev) => {
      const oldIdx = prev.findIndex((q) => q.id === active.id);
      const newIdx = prev.findIndex((q) => q.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="border-b border-border px-4 py-2.5 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
          <span className="text-lg font-bold">{language === "ko" ? "퀴즈 편집" : "Edit Quiz"}</span>
        </div>
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-3.5 h-3.5 mr-1" />
          {language === "ko" ? "저장" : "Save"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[680px] mx-auto px-6 py-6 space-y-6">
          {/* Quiz settings */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">{language === "ko" ? "퀴즈 제목" : "Quiz Title"}</Label>
              <Input value={titleKo} onChange={(e) => setTitleKo(e.target.value)} placeholder="퀴즈 제목" />
            </div>
            <div>
              <Label className="text-xs">{language === "ko" ? "합격 기준 (%)" : "Pass Threshold (%)"}</Label>
              <Input type="number" value={passThreshold} onChange={(e) => setPassThreshold(Number(e.target.value))} min={0} max={100} />
            </div>
            <div>
              <Label className="text-xs">{language === "ko" ? "최대 시도" : "Max Attempts"}</Label>
              <Input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} min={1} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">{language === "ko" ? "제한 시간 (분, 선택)" : "Time Limit (min, optional)"}</Label>
              <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : "")} placeholder="없음" />
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold">
                {language === "ko" ? "질문" : "Questions"} ({questions.length})
              </span>
              <Button size="sm" variant="outline" onClick={addQuestion}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                {language === "ko" ? "질문 추가" : "Add Question"}
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                {questions.map((q, idx) => (
                  <SortableQuestionCard
                    key={q.id}
                    q={q}
                    idx={idx}
                    onChange={(updated) => setQuestions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
                    onDelete={() => setQuestions((prev) => prev.filter((x) => x.id !== q.id))}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {questions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                {language === "ko" ? "질문을 추가하세요" : "Add questions"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
