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
      const { data, error } = await supabase
        .from("institute_courses")
        .select("*")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ["institute-chapters", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_chapters")
        .select("*")
        .eq("module_id", moduleId!)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!moduleId,
  });

  const { data: currentModule } = useQuery({
    queryKey: ["institute-module-single", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_modules")
        .select("*")
        .eq("id", moduleId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!moduleId,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["institute-enrollment", user?.id, courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_enrollments")
        .select("*")
        .eq("user_id", user!.id)
        .eq("course_id", courseId!)
        .maybeSingle();
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
      const { data, error } = await supabase
        .from("institute_chapter_progress")
        .select("*")
        .eq("user_id", user!.id)
        .in("chapter_id", chapterIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && chapters.length > 0,
  });

  const chapter = chapters.find((c) => c.id === chapterId);
  const currentIndex = chapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  const isLastChapter = currentIndex === chapters.length - 1 && currentIndex >= 0;

  const isCompleted = chapterProgress.some(
    (p) => p.chapter_id === chapterId && p.completed_at
  );

  useEffect(() => {
    if (enrollment === null && user) {
      navigate(`/institute/${courseId}`, { replace: true });
    }
    if (chapter && !canAccess(chapter.required_tier ?? 0, userTier)) {
      navigate(`/institute/${courseId}/${moduleId}`, { replace: true });
    }
  }, [enrollment, chapter, userTier, courseId, moduleId, navigate, user]);

  const completeChapter = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from("institute_chapter_progress").upsert(
        {
          user_id: user.id,
          chapter_id: chapterId!,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,chapter_id" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["institute-chapter-progress", user?.id, moduleId],
      });
      if (nextChapter && canAccess(nextChapter.required_tier ?? 0, userTier)) {
        navigate(`/institute/${courseId}/${moduleId}/${nextChapter.id}`);
      } else {
        navigate(`/institute/${courseId}/${moduleId}`);
      }
    },
  });

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  if (!chapter || !course) {
    return (
      <InstituteLayout pageTitle={language === "ko" ? "챕터" : "Chapter"}>
        <div
          style={{
            padding: 32,
            textAlign: "center",
            color: "var(--inst-ink3)",
          }}
        >
          Loading...
        </div>
      </InstituteLayout>
    );
  }

  return (
    <InstituteLayout pageTitle={chapter.title_ko || chapter.title || ""}>
      <div
        style={{ display: "flex", height: "100%", overflow: "hidden" }}
      >
        {/* Sidebar — desktop only */}
        {!isMobile && (
          <aside
            style={{
              width: 220,
              background: "var(--inst-surface2)",
              borderRight: "1px solid var(--inst-border)",
              overflowY: "auto",
              padding: "16px 12px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "var(--inst-ink3)",
                marginBottom: 14,
              }}
            >
              {currentModule?.title_ko || currentModule?.title}
            </div>
            {chapters.map((ch, idx) => {
              const accessible = canAccess(ch.required_tier ?? 0, userTier);
              const isActive = ch.id === chapterId;
              const done = chapterProgress.some(
                (p) => p.chapter_id === ch.id && p.completed_at
              );

              return (
                <button
                  key={ch.id}
                  disabled={!accessible}
                  onClick={() =>
                    accessible &&
                    navigate(
                      `/institute/${courseId}/${moduleId}/${ch.id}`
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 10px",
                    borderRadius: 8,
                    fontSize: 13,
                    border: isActive
                      ? "1px solid var(--inst-gold-bdr)"
                      : "1px solid transparent",
                    background: isActive
                      ? "var(--inst-gold-bg)"
                      : "transparent",
                    color: done
                      ? "var(--inst-gold)"
                      : isActive
                      ? "var(--inst-ink)"
                      : !accessible
                      ? "var(--inst-ink3)"
                      : "var(--inst-ink2)",
                    fontWeight: isActive ? 600 : 400,
                    opacity: !accessible ? 0.4 : 1,
                    cursor: !accessible ? "not-allowed" : "pointer",
                    marginBottom: 2,
                  }}
                >
                  {done ? (
                    <Check
                      className="w-3 h-3"
                      style={{ flexShrink: 0 }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 12,
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                  )}
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {language === "ko"
                      ? ch.title_ko || ch.title
                      : ch.title || ch.title_ko}
                  </span>
                </button>
              );
            })}
          </aside>
        )}

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              background: "var(--inst-bg)",
            }}
          >
            {/* Mobile progress bar */}
            {isMobile && (
              <div
                style={{
                  padding: "12px 20px",
                  background: "var(--inst-surface)",
                  borderBottom: "1px solid var(--inst-border)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--inst-ink)",
                    marginBottom: 6,
                  }}
                >
                  {chapter.title_ko || chapter.title}
                </div>
                <div className="inst-progress">
                  <div
                    className="inst-progress-fill"
                    style={{
                      width: `${
                        chapters.length > 0
                          ? ((currentIndex + 1) / chapters.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div
              style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px" }}
            >
              {/* Video */}
              {chapter.video_url &&
                (() => {
                  const ytUrl = getYouTubeEmbedUrl(chapter.video_url);
                  return (
                    <div
                      style={{
                        background: "var(--inst-ink)",
                        borderRadius: 12,
                        overflow: "hidden",
                        marginBottom: 22,
                        position: "relative",
                        paddingTop: "56.25%",
                      }}
                    >
                      {ytUrl ? (
                        <iframe
                          src={ytUrl}
                          className="absolute inset-0 w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      ) : (
                        <video
                          src={chapter.video_url}
                          controls
                          className="absolute inset-0 w-full h-full"
                        />
                      )}
                    </div>
                  );
                })()}

              {/* Title */}
              {!isMobile && (
                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "var(--inst-ink)",
                    letterSpacing: -0.3,
                    marginBottom: 16,
                  }}
                >
                  {language === "ko"
                    ? chapter.title_ko || chapter.title
                    : chapter.title || chapter.title_ko}
                </h1>
              )}

              {/* Content */}
              {chapter.content_ko && (
                <div
                  className="inst-prose"
                  dangerouslySetInnerHTML={{
                    __html: chapter.content_ko,
                  }}
                />
              )}

              {/* Audio */}
              {chapter.audio_url && (
                <div style={{ marginTop: 24 }}>
                  <audio
                    src={chapter.audio_url}
                    controls
                    style={{ width: "100%", borderRadius: 8 }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom nav */}
          <div
            style={{
              background: "var(--inst-surface)",
              borderTop: "1px solid var(--inst-border)",
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <button
              className="inst-btn-outline"
              disabled={!prevChapter}
              onClick={() =>
                prevChapter &&
                navigate(
                  `/institute/${courseId}/${moduleId}/${prevChapter.id}`
                )
              }
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {language === "ko" ? "이전" : "Previous"}
              </span>
            </button>

            <button
              className={isCompleted ? "inst-btn-outline" : "inst-btn-gold-sm"}
              disabled={completeChapter.isPending}
              onClick={() => completeChapter.mutate()}
            >
              {isCompleted ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {isLastChapter
                    ? language === "ko"
                      ? "모듈로 돌아가기"
                      : "Back to Module"
                    : language === "ko"
                    ? "다음 챕터"
                    : "Next Chapter"}
                  {!isLastChapter && (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
              ) : (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {isLastChapter
                    ? language === "ko"
                      ? "완료하기 ✓"
                      : "Complete ✓"
                    : language === "ko"
                    ? "완료 & 다음"
                    : "Complete & Next"}
                  {!isLastChapter && (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </InstituteLayout>
  );
};

export default InstituteChapter;
