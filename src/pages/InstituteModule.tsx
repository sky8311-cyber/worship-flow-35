import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserTier, canAccess } from "@/hooks/useUserTier";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Lock, Check, ChevronLeft, ChevronRight, BookOpen, PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";
import { AiCoachPanel } from "@/components/institute/AiCoachPanel";

const InstituteModule = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { language } = useTranslation();
  const { userTier } = useUserTier();
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

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

  const currentModule = modules.find((m) => m.id === moduleId);
  const currentIndex = modules.findIndex((m) => m.id === moduleId);
  const prevModule = currentIndex > 0 ? modules[currentIndex - 1] : null;
  const nextModule = currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null;
  const isLastModule = currentIndex === modules.length - 1 && currentIndex >= 0;

  // Redirect if not enrolled or module not accessible
  useEffect(() => {
    if (enrollment === null && user) {
      navigate(`/institute/${courseId}`, { replace: true });
    }
    if (currentModule && !canAccess(currentModule.required_tier, userTier)) {
      navigate(`/institute/${courseId}`, { replace: true });
    }
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
        // Auto-award badge if this course is part of a certification
        if (certLink?.certification_id) {
          try {
            await supabase.auth.refreshSession();
            const { data: { session } } = await supabase.auth.getSession();
            await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-institute-badge`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ user_id: user!.id, certification_id: certLink.certification_id }),
              }
            );
          } catch {
            // Non-fatal — badge can be requested from certification page
          }
        }
        setShowCompletionDialog(true);
      } else if (nextModule && canAccess(nextModule.required_tier, userTier)) {
        navigate(`/institute/${courseId}/${nextModule.id}`);
      }
    },
  });

  if (!currentModule || !course) {
    return <AppLayout><div className="p-8 text-center text-muted-foreground">Loading...</div></AppLayout>;
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const completedModules = enrollment?.completed_modules || 0;

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="hidden md:block w-72 border-r bg-card flex-shrink-0">
          <div className="p-4 border-b">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => navigate(`/institute/${courseId}`)}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              {language === "ko" ? "과목으로" : "Back to course"}
            </Button>
            <h2 className="text-sm font-semibold line-clamp-2">{course.title_ko}</h2>
          </div>
          <ScrollArea className="h-[calc(100%-5rem)]">
            <div className="p-2 space-y-1">
              {modules.map((mod, idx) => {
                const accessible = canAccess(mod.required_tier, userTier);
                const isActive = mod.id === moduleId;
                const isCompleted = idx < completedModules;
                return (
                  <button
                    key={mod.id}
                    disabled={!accessible}
                    onClick={() => accessible && navigate(`/institute/${courseId}/${mod.id}`)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                      isActive ? "bg-primary/10 text-primary font-medium" :
                      accessible ? "hover:bg-muted/50" : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {!accessible ? (
                      <Lock className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                    ) : isCompleted ? (
                      <Check className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                    ) : (
                      <span className="w-3.5 h-3.5 flex-shrink-0 rounded-full border border-muted-foreground/30 text-[10px] flex items-center justify-center">{idx + 1}</span>
                    )}
                    <span className="line-clamp-1">{language === "ko" ? mod.title_ko : mod.title}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <Button variant="ghost" size="sm" className="mb-4 md:hidden -ml-2" onClick={() => navigate(`/institute/${courseId}`)}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              {language === "ko" ? "과목으로" : "Back"}
            </Button>

            <h1 className="text-xl font-bold mb-4">{language === "ko" ? currentModule.title_ko : currentModule.title}</h1>

            {/* Video */}
            {currentModule.video_url && (() => {
              const ytUrl = getYouTubeEmbedUrl(currentModule.video_url);
              if (ytUrl) {
                return (
                  <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-muted">
                    <iframe src={ytUrl} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                  </div>
                );
              }
              return (
                <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-muted">
                  <video src={currentModule.video_url} controls className="w-full h-full" />
                </div>
              );
            })()}

            {/* Content */}
            {(language === "ko" ? currentModule.content_ko : currentModule.content) && (
              <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
                <div dangerouslySetInnerHTML={{ __html: (language === "ko" ? currentModule.content_ko : currentModule.content) || "" }} />
              </div>
            )}

            {/* Navigation */}
            <Card className="p-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={!prevModule || !canAccess(prevModule.required_tier, userTier)}
                onClick={() => prevModule && navigate(`/institute/${courseId}/${prevModule.id}`)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {language === "ko" ? "이전 모듈" : "Previous"}
              </Button>

              {isLastModule ? (
                <Button size="sm" onClick={() => completeAndNext.mutate()} disabled={completeAndNext.isPending}>
                  <BookOpen className="w-4 h-4 mr-1" />
                  {language === "ko" ? "수강 완료" : "Complete Course"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => completeAndNext.mutate()}
                  disabled={completeAndNext.isPending || (nextModule != null && !canAccess(nextModule.required_tier, userTier))}
                >
                  {language === "ko" ? "다음 모듈로" : "Next Module"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Completion dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-primary" />
              {language === "ko" ? "수강 완료!" : "Course Complete!"}
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p>
                <strong>{course.title_ko}</strong>{" "}
                {language === "ko" ? "과정을 완료했습니다." : "has been completed."}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString(language === "ko" ? "ko-KR" : "en-US")}
              </p>
              {certLink && (
                <p className="text-sm text-primary mt-3">
                  {language === "ko"
                    ? "K-Worship Certified 배지 발급은 해당 자격증의 모든 과정을 완료한 후 신청할 수 있습니다."
                    : "K-Worship Certified badge can be requested after completing all courses in the certification."}
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => { setShowCompletionDialog(false); navigate(`/institute/${courseId}`); }}>
              {language === "ko" ? "확인" : "OK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default InstituteModule;
