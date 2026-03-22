import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserTier, canAccess } from "@/hooks/useUserTier";
import { useIsMobile } from "@/hooks/use-mobile";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const InstituteChapter = () => {
  const { courseId, moduleId, chapterId } = useParams<{
    courseId: string;
    moduleId: string;
    chapterId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { language } = useTranslation();
  const { userTier } = useUserTier();
  const isMobile = useIsMobile();

  const { data: course } = useQuery({
    queryKey: ["institute-course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_courses").select("*").eq("id", courseId!).single();
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

  const { data: currentModule } = useQuery({
    queryKey: ["institute-module-single", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_modules").select("*").eq("id", moduleId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!moduleId,
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

  const chapter = chapters.find((c) => c.id === chapterId);
  const currentIndex = chapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  const isLastChapter = currentIndex === chapters.length - 1 && currentIndex >= 0;

  const isCompleted = chapterProgress.some((p) => p.chapter_id === chapterId && p.completed_at);

  useEffect(() => {
    if (enrollment === null && user) navigate(`/institute/${courseId}`, { replace: true });
    if (chapter && !canAccess(chapter.required_tier ?? 0, userTier)) navigate(`/institute/${courseId}/${moduleId}`, { replace: true });
  }, [enrollment, chapter, userTier, courseId, moduleId, navigate, user]);

  const completeChapter = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from("institute_chapter_progress").upsert(
        { user_id: user.id, chapter_id: chapterId!, completed_at: new Date().toISOString() },
        { onConflict: "user_id,chapter_id" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institute-chapter-progress", user?.id, moduleId] });
      if (nextChapter && canAccess(nextChapter.required_tier ?? 0, userTier)) {
        navigate(`/institute/${courseId}/${moduleId}/${nextChapter.id}`);
      } else {
        navigate(`/institute/${courseId}/${moduleId}`);
      }
    },
  });

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  if (!chapter || !course) {
    return (
      <InstituteLayout pageTitle={language === "ko" ? "챕터" : "Chapter"} showBackButton>
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      </InstituteLayout>
    );
  }

  return (
    <InstituteLayout pageTitle={chapter.title_ko || chapter.title || ""} showBackButton>
      <div className="flex min-h-0">
        {/* Sidebar — desktop only */}
        {!isMobile && (
          <aside className="w-[220px] bg-muted border-r border-border overflow-y-auto p-4 flex-shrink-0 hidden md:block">
            <div className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-3.5">
              {currentModule?.title_ko || currentModule?.title}
            </div>
            {chapters.map((ch, idx) => {
              const accessible = canAccess(ch.required_tier ?? 0, userTier);
              const isActive = ch.id === chapterId;
              const done = chapterProgress.some((p) => p.chapter_id === ch.id && p.completed_at);

              return (
                <button
                  key={ch.id}
                  disabled={!accessible}
                  onClick={() => accessible && navigate(`/institute/${courseId}/${moduleId}/${ch.id}`)}
                  className={`flex items-center gap-2 w-full text-left py-2 px-2.5 rounded-lg text-[13px] mb-0.5 transition-colors ${
                    isActive
                      ? "bg-primary/10 border border-primary/20 text-foreground font-semibold"
                      : done
                      ? "text-primary"
                      : !accessible
                      ? "text-muted-foreground opacity-40 cursor-not-allowed"
                      : "text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {done ? (
                    <Check className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <span className="w-3 text-center flex-shrink-0">{idx + 1}</span>
                  )}
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {language === "ko" ? ch.title_ko || ch.title : ch.title || ch.title_ko}
                  </span>
                </button>
              );
            })}
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            {/* Mobile: Chapter progress header */}
            {isMobile && (
              <div className="px-5 py-3 bg-card border-b border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-semibold text-foreground truncate pr-2">
                    {chapter.title_ko || chapter.title}
                  </div>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">
                    {currentIndex + 1}/{chapters.length}
                  </Badge>
                </div>
                <Progress value={chapters.length > 0 ? ((currentIndex + 1) / chapters.length) * 100 : 0} className="h-1" />
              </div>
            )}

            <div className="max-w-[680px] mx-auto px-5 py-6">
              {/* Video */}
              {chapter.video_url && (() => {
                const ytUrl = getYouTubeEmbedUrl(chapter.video_url);
                return (
                  <div className="bg-foreground rounded-xl overflow-hidden mb-5 relative" style={{ paddingTop: "56.25%" }}>
                    {ytUrl ? (
                      <iframe src={ytUrl} className="absolute inset-0 w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    ) : (
                      <video src={chapter.video_url} controls className="absolute inset-0 w-full h-full" />
                    )}
                  </div>
                );
              })()}

              {/* Title — desktop */}
              {!isMobile && (
                <h1 className="text-xl font-bold text-foreground tracking-tight mb-4">
                  {language === "ko" ? chapter.title_ko || chapter.title : chapter.title || chapter.title_ko}
                </h1>
              )}

              {/* Content */}
              {chapter.content_ko && (
                <div
                  className="inst-prose"
                  dangerouslySetInnerHTML={{ __html: chapter.content_ko }}
                />
              )}

              {/* Audio */}
              {chapter.audio_url && (
                <div className="mt-6">
                  <audio src={chapter.audio_url} controls className="w-full rounded-lg" />
                </div>
              )}

              {/* Completion indicator */}
              {isCompleted && (
                <div className="mt-6 flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">
                    {language === "ko" ? "이 챕터를 완료했습니다" : "Chapter completed"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="bg-card border-t border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              disabled={!prevChapter}
              onClick={() => prevChapter && navigate(`/institute/${courseId}/${moduleId}/${prevChapter.id}`)}
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              {language === "ko" ? "이전" : "Prev"}
            </Button>

            <Button
              variant={isCompleted ? "outline" : "default"}
              size="sm"
              disabled={completeChapter.isPending}
              onClick={() => completeChapter.mutate()}
            >
              {isCompleted ? (
                <>
                  {isLastChapter ? (language === "ko" ? "모듈로 돌아가기" : "Back to Module") : (language === "ko" ? "다음 챕터" : "Next")}
                  {!isLastChapter && <ChevronRight className="w-3.5 h-3.5 ml-1" />}
                </>
              ) : (
                <>
                  {isLastChapter ? (language === "ko" ? "완료 ✓" : "Complete ✓") : (language === "ko" ? "완료 & 다음" : "Done & Next")}
                  {!isLastChapter && <ChevronRight className="w-3.5 h-3.5 ml-1" />}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </InstituteLayout>
  );
};

export default InstituteChapter;
