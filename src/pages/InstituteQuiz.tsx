import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Clock, Target, RotateCcw, ChevronRight, CheckCircle2, XCircle } from "lucide-react";

const InstituteQuiz = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useTranslation();

  const [phase, setPhase] = useState<"start" | "progress" | "result">("start");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean; details: any[] } | null>(null);

  const { data: quiz } = useQuery({
    queryKey: ["student-quiz", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_quizzes" as any)
        .select("*")
        .eq("module_id", moduleId!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!moduleId,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["student-quiz-questions", quiz?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_quiz_questions" as any)
        .select("*")
        .eq("quiz_id", quiz.id)
        .order("sort_order");
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!quiz?.id,
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ["student-quiz-attempts", quiz?.id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_quiz_attempts" as any)
        .select("*")
        .eq("quiz_id", quiz.id)
        .eq("user_id", user!.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!quiz?.id && !!user?.id,
  });

  const hasPassed = attempts.some((a: any) => a.passed);
  const attemptsUsed = attempts.length;
  const maxAttempts = quiz?.max_attempts || 3;
  const canRetry = !hasPassed && attemptsUsed < maxAttempts;

  const submitMutation = useMutation({
    mutationFn: async () => {
      let correct = 0;
      const details = questions.map((q: any) => {
        const selected = answers[q.id];
        const isCorrect = selected === q.correct_answer_index;
        if (isCorrect) correct++;
        return { question_id: q.id, selected_index: selected, correct_index: q.correct_answer_index, is_correct: isCorrect, explanation_ko: q.explanation_ko };
      });

      const total = questions.length;
      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
      const passed = score >= (quiz?.pass_threshold || 70);

      const { error } = await supabase
        .from("institute_quiz_attempts" as any)
        .insert({
          user_id: user!.id,
          quiz_id: quiz.id,
          answers: questions.map((q: any) => ({ question_id: q.id, selected_index: answers[q.id] ?? -1 })),
          score,
          total_questions: total,
          passed,
        } as any);
      if (error) throw error;

      return { score, total: correct, totalQ: total, passed, details };
    },
    onSuccess: (data) => {
      setResult({ score: data.score, total: data.totalQ, passed: data.passed, details: data.details });
      setPhase("result");
    },
  });

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length && questions.length > 0;

  if (!quiz) {
    return (
      <InstituteLayout pageTitle={language === "ko" ? "퀴즈" : "Quiz"} showBackButton>
        <div className="p-8 text-center text-muted-foreground text-sm">
          {language === "ko" ? "퀴즈가 없습니다" : "No quiz available"}
        </div>
      </InstituteLayout>
    );
  }

  return (
    <InstituteLayout pageTitle={quiz.title_ko || "퀴즈"} showBackButton>
      <div className="max-w-[680px] mx-auto px-5 py-6">
        {/* START */}
        {phase === "start" && (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{quiz.title_ko || "퀴즈"}</h1>
              {quiz.description_ko && <p className="text-sm text-muted-foreground mt-2">{quiz.description_ko}</p>}
            </div>
            <div className="flex justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><HelpCircle className="w-4 h-4" /> {questions.length}{language === "ko" ? "문항" : " questions"}</span>
              <span className="flex items-center gap-1"><Target className="w-4 h-4" /> {language === "ko" ? `합격 ${quiz.pass_threshold}%` : `Pass ${quiz.pass_threshold}%`}</span>
              {quiz.time_limit_minutes && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {quiz.time_limit_minutes}{language === "ko" ? "분" : "min"}</span>}
            </div>
            <div className="text-sm">
              {hasPassed ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-200">{language === "ko" ? "합격 완료" : "Passed"}</Badge>
              ) : (
                <span className="text-muted-foreground">
                  {language === "ko" ? `시도 ${attemptsUsed}/${maxAttempts}` : `Attempts ${attemptsUsed}/${maxAttempts}`}
                </span>
              )}
            </div>
            {hasPassed ? (
              <Button onClick={() => navigate(`/institute/${courseId}/${moduleId}`)}>
                {language === "ko" ? "모듈로 돌아가기" : "Back to Module"}
              </Button>
            ) : canRetry ? (
              <Button size="lg" onClick={() => { setAnswers({}); setResult(null); setPhase("progress"); }}>
                {language === "ko" ? "퀴즈 시작" : "Start Quiz"}
              </Button>
            ) : (
              <div className="text-sm text-destructive">{language === "ko" ? "시도 횟수를 모두 사용했습니다" : "No attempts remaining"}</div>
            )}
          </div>
        )}

        {/* PROGRESS */}
        {phase === "progress" && (
          <div className="space-y-6">
            <div className="sticky top-0 bg-background/95 backdrop-blur py-3 z-10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">{answeredCount}/{questions.length} {language === "ko" ? "답변 완료" : "answered"}</span>
                <span className="text-xs text-muted-foreground">{Math.round((answeredCount / questions.length) * 100)}%</span>
              </div>
              <Progress value={(answeredCount / questions.length) * 100} className="h-1.5" />
            </div>

            {questions.map((q: any, idx: number) => (
              <Card key={q.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-foreground mb-3">
                    <span className="text-primary font-bold mr-2">{idx + 1}.</span>
                    {q.question_text_ko}
                  </div>
                  <RadioGroup
                    value={answers[q.id] !== undefined ? String(answers[q.id]) : ""}
                    onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: parseInt(v) }))}
                    className="space-y-2"
                  >
                    {(q.options as { text: string }[]).map((opt, optIdx) => (
                      <div key={optIdx} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                        answers[q.id] === optIdx ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      }`}>
                        <RadioGroupItem value={String(optIdx)} id={`q-${q.id}-${optIdx}`} />
                        <Label htmlFor={`q-${q.id}-${optIdx}`} className="flex-1 cursor-pointer text-sm">
                          <span className="font-medium mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                          {opt.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}

            <Button size="lg" className="w-full" disabled={!allAnswered || submitMutation.isPending} onClick={() => submitMutation.mutate()}>
              {submitMutation.isPending ? (language === "ko" ? "채점 중..." : "Grading...") : (language === "ko" ? "제출하기" : "Submit")}
            </Button>
          </div>
        )}

        {/* RESULT */}
        {phase === "result" && result && (
          <div className="space-y-6">
            <div className={`text-center py-8 rounded-xl ${result.passed ? "bg-green-50 dark:bg-green-950/20" : "bg-orange-50 dark:bg-orange-950/20"}`}>
              <div className={`text-4xl font-bold ${result.passed ? "text-green-600" : "text-orange-600"}`}>
                {result.score}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {result.details.filter((d) => d.is_correct).length}/{result.total} {language === "ko" ? "정답" : "correct"}
              </div>
              <Badge className={`mt-3 ${result.passed ? "bg-green-500/10 text-green-600 border-green-200" : "bg-orange-500/10 text-orange-600 border-orange-200"}`}>
                {result.passed ? (language === "ko" ? "🎉 합격!" : "🎉 Passed!") : (language === "ko" ? "불합격" : "Not Passed")}
              </Badge>
            </div>

            {/* Per-question review */}
            {result.details.map((d, idx) => {
              const q = questions[idx];
              if (!q) return null;
              return (
                <Card key={q.id} className={`overflow-hidden border-l-4 ${d.is_correct ? "border-l-green-500" : "border-l-red-500"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2 mb-2">
                      {d.is_correct ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                      <span className="text-sm font-medium">{q.question_text_ko}</span>
                    </div>
                    <div className="ml-7 space-y-1">
                      {(q.options as { text: string }[]).map((opt, optIdx) => {
                        const isCorrect = optIdx === d.correct_index;
                        const isSelected = optIdx === d.selected_index;
                        return (
                          <div key={optIdx} className={`text-sm px-2 py-1 rounded ${
                            isCorrect ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-medium" :
                            isSelected && !isCorrect ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 line-through" : "text-muted-foreground"
                          }`}>
                            {String.fromCharCode(65 + optIdx)}. {opt.text}
                            {isCorrect && " ✓"}
                          </div>
                        );
                      })}
                      {!d.is_correct && d.explanation_ko && (
                        <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                          💡 {d.explanation_ko}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex gap-3">
              {result.passed ? (
                <Button className="flex-1" onClick={() => navigate(`/institute/${courseId}/${moduleId}`)}>
                  {language === "ko" ? "모듈로 돌아가기" : "Back to Module"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <>
                  {canRetry && (
                    <Button variant="outline" className="flex-1" onClick={() => { setAnswers({}); setResult(null); setPhase("start"); }}>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      {language === "ko" ? `다시 도전 (${maxAttempts - attemptsUsed - 1}회 남음)` : `Retry (${maxAttempts - attemptsUsed - 1} left)`}
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1" onClick={() => navigate(`/institute/${courseId}/${moduleId}`)}>
                    {language === "ko" ? "모듈로 돌아가기" : "Back"}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </InstituteLayout>
  );
};

export default InstituteQuiz;
