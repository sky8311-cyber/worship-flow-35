import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserTier, canAccess } from "@/hooks/useUserTier";
import { useIsMobile } from "@/hooks/use-mobile";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { InstituteCompletionModal } from "@/components/institute/InstituteCompletionModal";
import { Lock, Check, ChevronLeft, ChevronRight, PlayCircle, BookOpen, Headphones, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const InstituteModule = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { language } = useTranslation();
  const { userTier } = useUserTier();
  const isMobile = useIsMobile();
  const [showCompletion, setShowCompletion] = useState(false);

  const { data: course } = useQuery({
    queryKey: ["institute-course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_courses").select("*").eq("id", courseId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["institute-modules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_modules").select("*").eq("course_id", courseId!).order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["institute-enrollment", user?.id, courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_enrollments").select("*").eq("user_id", user!.id).eq("course_id", courseId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!courseId,
  });

  const { data: certLink } = useQuery({
    queryKey: ["institute-cert-link", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_certification_courses").select("certification_id").eq("course_id", courseId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ["institute-chapters", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_chapters").select("*").eq("module_id", moduleId!).order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!moduleId,
  });

  const { data: chapterProgress = [] } = useQuery({
    queryKey: ["institute-chapter-progress", user?.id, moduleId],
    queryFn: async () => {
      const chapterIds = chapters.map((c) => c.id);
      if (chapterIds.length === 0) return [];
      const { data, error } = await supabase.from("institute_chapter_progress").select("*").eq("user_id", user!.id).in("chapter_id", chapterIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && chapters.length > 0,
  });

  // Quiz data
  const { data: moduleQuiz } = useQuery({
    queryKey: ["institute-module-quiz", moduleId],
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

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ["institute-quiz-attempts", moduleQuiz?.id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_quiz_attempts" as any)
        .select("*")
        .eq("quiz_id", moduleQuiz.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!moduleQuiz?.id && !!user?.id,
  });

  const currentModule = modules.find((m) => m.id === moduleId);
  const currentIndex = modules.findIndex((m) => m.id === moduleId);
  const prevModule = currentIndex > 0 ? modules[currentIndex - 1] : null;
  const nextModule = currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null;
  const isLastModule = currentIndex === modules.length - 1 && currentIndex >= 0;

  const hasChapters = chapters.length > 0;
  const completedChapterCount = chapterProgress.filter((p) => p.completed_at).length;
  const allChaptersCompleted = hasChapters && completedChapterCount === chapters.length;
  const quizPassed = moduleQuiz ? quizAttempts.some((a: any) => a.passed) : true;
  const moduleReady = allChaptersCompleted && quizPassed;

  useEffect(() => {
    if (enrollment === null && user) navigate(`/institute/${courseId}`, { replace: true });
    if (currentModule && !canAccess(currentModule.required_tier, userTier)) navigate(`/institute/${courseId}`, { replace: true });
  }, [enrollment, currentModule, userTier, courseId, navigate, user]);

  const completeAndNext = useMutation({
    mutationFn: async () => {
      if (!enrollment) return;
      const newCompleted = Math.max((enrollment.completed_modules || 0), currentIndex + 1);
      if (isLastModule) {
        await supabase.from("institute_enrollments").update({ completed_modules: newCompleted, completed_at: new Date().toISOString() }).eq("id", enrollment.id);
      } else {
        await supabase.from("institute_enrollments").update({ completed_modules: newCompleted }).eq("id", enrollment.id);
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["institute-enrollment", user?.id, courseId] });
      queryClient.invalidateQueries({ queryKey: ["institute-enrollments"] });
      if (isLastModule) {
        if (certLink?.certification_id) {
          try {
            await supabase.auth.refreshSession();
            const { data: { session } } = await supabase.auth.getSession();
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-institute-badge`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
              body: JSON.stringify({ user_id: user!.id, certification_id: certLink.certification_id }),
            });
          } catch {}
        }
        setShowCompletion(true);
      } else if (nextModule && canAccess(nextModule.required_tier, userTier)) {
        navigate(`/institute/${courseId}/${nextModule.id}`);
      }
    },
  });

  const getChapterIcon = (ch: any) => {
    if (ch.video_url) return <PlayCircle className="w-3.5 h-3.5" />;
    if (ch.audio_url) return <Headphones className="w-3.5 h-3.5" />;
    return <BookOpen className="w-3.5 h-3.5" />;
  };

  if (!currentModule || !course) {
    return (
      <InstituteLayout pageTitle={language === "ko" ? "모듈" : "Module"} showBackButton>
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      </InstituteLayout>
    );
  }

  const completedModules = enrollment?.completed_modules || 0;

  return (
    <InstituteLayout pageTitle={currentModule.title_ko} showBackButton>
      <div className="flex min-h-0">
        {/* Sidebar — desktop only */}
        {!isMobile && (
          <aside className="w-[220px] bg-muted border-r border-border overflow-y-auto p-4 flex-shrink-0 hidden md:block">
            <div className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-3.5">
              {course.title_ko}
            </div>
            {modules.map((mod, idx) => {
              const accessible = canAccess(mod.required_tier, userTier);
              const isActive = mod.id === moduleId;
              const isCompleted = idx < completedModules;
              const isLocked = !accessible;

              return (
                <button
                  key={mod.id}
                  disabled={isLocked}
                  onClick={() => accessible && navigate(`/institute/${courseId}/${mod.id}`)}
                  className={`flex items-center gap-2 w-full text-left py-2 px-2.5 rounded-lg text-[13px] mb-0.5 transition-colors ${
                    isActive
                      ? "bg-primary/10 border border-primary/20 text-foreground font-semibold"
                      : isCompleted
                      ? "text-primary"
                      : isLocked
                      ? "text-muted-foreground opacity-40 cursor-not-allowed"
                      : "text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {isLocked ? (
                    <Lock className="w-3 h-3 flex-shrink-0" />
                  ) : isCompleted ? (
                    <Check className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <span className="w-3 text-center flex-shrink-0">{idx + 1}</span>
                  )}
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {language === "ko" ? mod.title_ko : mod.title}
                  </span>
                </button>
              );
            })}
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            {/* Mobile progress bar */}
            {isMobile && (
              <div className="px-5 py-3 bg-card border-b border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-semibold text-foreground">
                    {language === "ko" ? currentModule.title_ko : currentModule.title}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    모듈 {currentIndex + 1}/{modules.length}
                  </span>
                </div>
                <Progress value={modules.length > 0 ? ((currentIndex + 1) / modules.length) * 100 : 0} className="h-1" />
              </div>
            )}

            <div className="max-w-[680px] mx-auto px-5 py-6">
              {/* Module title */}
              {!isMobile && (
                <h1 className="text-xl font-bold text-foreground tracking-tight mb-2">
                  {language === "ko" ? currentModule.title_ko : currentModule.title}
                </h1>
              )}

              {/* Module guide text */}
              {(currentModule.content_ko || currentModule.content) && !hasChapters && (
                <div
                  className="inst-prose"
                  dangerouslySetInnerHTML={{ __html: (language === "ko" ? currentModule.content_ko : currentModule.content) || "" }}
                />
              )}

              {hasChapters && (currentModule.content_ko || currentModule.content) && (
                <div
                  className="text-sm text-muted-foreground leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: (language === "ko" ? currentModule.content_ko : currentModule.content) || "" }}
                />
              )}

              {/* Chapters list */}
              {hasChapters && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {completedChapterCount}/{chapters.length} {language === "ko" ? "챕터 완료" : "chapters completed"}
                    </span>
                    <Progress value={(completedChapterCount / chapters.length) * 100} className="h-1 w-20" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {chapters.map((ch, idx) => {
                      const accessible = canAccess(ch.required_tier ?? 0, userTier);
                      const done = chapterProgress.some((p) => p.chapter_id === ch.id && p.completed_at);
                      // First incomplete chapter is the "current" one
                      const isCurrentPage = !done && !chapters.slice(0, idx).some(
                        (prev) => !chapterProgress.some((p) => p.chapter_id === prev.id && p.completed_at)
                      );

                      return (
                        <Card
                          key={ch.id}
                          className={`${accessible && enrollment ? "cursor-pointer hover:shadow-sm" : ""} ${!accessible ? "opacity-50" : ""} ${isCurrentPage ? "ring-2 ring-primary/30 border-primary/20" : ""}`}
                          onClick={() => {
                            if (accessible && enrollment) navigate(`/institute/${courseId}/${moduleId}/${ch.id}`);
                          }}
                        >
                          <CardContent className="p-3.5 flex items-center gap-3">
                            {/* Completion circle */}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                done
                                  ? "bg-primary text-primary-foreground"
                                  : isCurrentPage
                                  ? "bg-foreground text-background"
                                  : !accessible
                                  ? "bg-muted text-muted-foreground border border-border"
                                  : "bg-muted text-muted-foreground border border-border"
                              }`}
                            >
                              {done ? <Check className="w-4 h-4" /> : !accessible ? <Lock className="w-3 h-3" /> : isCurrentPage ? (idx + 1) : getChapterIcon(ch)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium ${!accessible ? "text-muted-foreground" : isCurrentPage ? "text-foreground font-semibold" : "text-foreground"}`}>
                                {language === "ko" ? ch.title_ko || ch.title : ch.title || ch.title_ko}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {ch.video_url ? "영상" : ch.audio_url ? "오디오" : "텍스트"}
                                {isCurrentPage && <span className="ml-1 text-primary font-medium">· 현재</span>}
                                {!accessible && (
                                  <span className="ml-1">
                                    · {(ch.required_tier ?? 0) === 2 ? "정식멤버 이상" : (ch.required_tier ?? 0) === 1 ? "기본멤버 이상" : "공동체계정"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {done && (
                              <Check className="w-4 h-4 text-primary flex-shrink-0" />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Quiz card */}
                  {moduleQuiz && (
                    <Card
                      className={`mt-3 ${allChaptersCompleted && enrollment ? "cursor-pointer hover:shadow-sm" : "opacity-50"}`}
                      onClick={() => {
                        if (allChaptersCompleted && enrollment) navigate(`/institute/${courseId}/${moduleId}/quiz`);
                      }}
                    >
                      <CardContent className="p-3.5 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          quizPassed
                            ? "bg-primary text-primary-foreground"
                            : !allChaptersCompleted
                            ? "bg-muted text-muted-foreground border border-border"
                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                        }`}>
                          {quizPassed ? <Check className="w-4 h-4" /> : !allChaptersCompleted ? <Lock className="w-3 h-3" /> : <HelpCircle className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">{moduleQuiz.title_ko || "퀴즈"}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {!allChaptersCompleted
                              ? (language === "ko" ? "모든 챕터 완료 후 풀 수 있습니다" : "Complete all chapters first")
                              : quizPassed
                              ? (language === "ko" ? "합격" : "Passed")
                              : (language === "ko" ? `합격 기준 ${moduleQuiz.pass_threshold}%` : `Pass: ${moduleQuiz.pass_threshold}%`)}
                          </div>
                        </div>
                        {quizPassed && <Badge className="bg-green-500/10 text-green-600 border-green-200 text-[9px]">✓</Badge>}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="bg-card border-t border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              disabled={!prevModule || !canAccess(prevModule.required_tier, userTier)}
              onClick={() => prevModule && navigate(`/institute/${courseId}/${prevModule.id}`)}
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              {language === "ko" ? "이전" : "Prev"}
            </Button>

            <Button
              size="sm"
              disabled={hasChapters ? (!moduleReady || completeAndNext.isPending) : (completeAndNext.isPending || (!isLastModule && nextModule != null && !canAccess(nextModule.required_tier, userTier)))}
              onClick={() => completeAndNext.mutate()}
            >
              {isLastModule
                ? (language === "ko" ? "수강 완료 ✓" : "Complete ✓")
                : (
                  <>
                    {language === "ko" ? "다음 모듈" : "Next"}
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
            </Button>
          </div>
        </div>
      </div>

      <InstituteCompletionModal
        open={showCompletion}
        onClose={() => { setShowCompletion(false); navigate(`/institute/${courseId}`); }}
        courseName={course.title_ko}
        hasCert={!!certLink}
        language={language}
      />
    </InstituteLayout>
  );
};

export default InstituteModule;
