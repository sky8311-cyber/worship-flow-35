import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserTier, canAccess } from "@/hooks/useUserTier";
import { useIsMobile } from "@/hooks/use-mobile";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { InstituteAiCoach } from "@/components/institute/InstituteAiCoach";
import { InstituteCompletionModal } from "@/components/institute/InstituteCompletionModal";
import { Lock, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

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

  const currentModule = modules.find((m) => m.id === moduleId);
  const currentIndex = modules.findIndex((m) => m.id === moduleId);
  const prevModule = currentIndex > 0 ? modules[currentIndex - 1] : null;
  const nextModule = currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null;
  const isLastModule = currentIndex === modules.length - 1 && currentIndex >= 0;

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

  if (!currentModule || !course) {
    return (
      <InstituteLayout pageTitle={language === "ko" ? "모듈" : "Module"}>
        <div style={{ padding: 32, textAlign: "center", color: "var(--inst-ink3)" }}>Loading...</div>
      </InstituteLayout>
    );
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const completedModules = enrollment?.completed_modules || 0;

  return (
    <InstituteLayout pageTitle={currentModule.title_ko}>
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
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
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "var(--inst-ink3)",
                marginBottom: 14,
              }}
            >
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    border: isActive ? "1px solid var(--inst-gold-bdr)" : "1px solid transparent",
                    background: isActive ? "var(--inst-gold-bg)" : "transparent",
                    color: isCompleted ? "var(--inst-gold)" : isActive ? "var(--inst-ink)" : isLocked ? "var(--inst-ink3)" : "var(--inst-ink2)",
                    fontWeight: isActive ? 600 : 400,
                    opacity: isLocked ? 0.4 : 1,
                    cursor: isLocked ? "not-allowed" : "pointer",
                    marginBottom: 2,
                  }}
                >
                  {isLocked ? (
                    <Lock className="w-3 h-3" style={{ flexShrink: 0 }} />
                  ) : isCompleted ? (
                    <Check className="w-3 h-3" style={{ flexShrink: 0 }} />
                  ) : (
                    <span style={{ width: 12, textAlign: "center", flexShrink: 0 }}>{idx + 1}</span>
                  )}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {language === "ko" ? mod.title_ko : mod.title}
                  </span>
                </button>
              );
            })}
          </aside>
        )}

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", background: "var(--inst-bg)" }}>
            {/* Mobile progress bar */}
            {isMobile && (
              <div style={{ padding: "12px 20px", background: "var(--inst-surface)", borderBottom: "1px solid var(--inst-border)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--inst-ink)", marginBottom: 6 }}>
                  {language === "ko" ? currentModule.title_ko : currentModule.title}
                </div>
                <div className="inst-progress">
                  <div className="inst-progress-fill" style={{ width: `${modules.length > 0 ? ((currentIndex + 1) / modules.length) * 100 : 0}%` }} />
                </div>
              </div>
            )}

            <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px" }}>
              {/* Video */}
              {currentModule.video_url && (() => {
                const ytUrl = getYouTubeEmbedUrl(currentModule.video_url);
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
                      <iframe src={ytUrl} className="absolute inset-0 w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    ) : (
                      <video src={currentModule.video_url} controls className="absolute inset-0 w-full h-full" />
                    )}
                  </div>
                );
              })()}

              {/* Title */}
              {!isMobile && (
                <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--inst-ink)", letterSpacing: -0.3, marginBottom: 16 }}>
                  {language === "ko" ? currentModule.title_ko : currentModule.title}
                </h1>
              )}

              {/* Content */}
              {(language === "ko" ? currentModule.content_ko : currentModule.content) && (
                <div
                  className="inst-prose"
                  dangerouslySetInnerHTML={{ __html: (language === "ko" ? currentModule.content_ko : currentModule.content) || "" }}
                />
              )}

              {/* AI Coach */}
              <div style={{ marginTop: 24 }}>
                <InstituteAiCoach courseId={courseId!} moduleId={moduleId!} />
              </div>
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
              disabled={!prevModule || !canAccess(prevModule.required_tier, userTier)}
              onClick={() => prevModule && navigate(`/institute/${courseId}/${prevModule.id}`)}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <ChevronLeft className="w-3.5 h-3.5" />
                {language === "ko" ? "이전 모듈" : "Previous"}
              </span>
            </button>

            <button
              className="inst-btn-gold-sm"
              disabled={completeAndNext.isPending || (!isLastModule && nextModule != null && !canAccess(nextModule.required_tier, userTier))}
              onClick={() => completeAndNext.mutate()}
            >
              {isLastModule
                ? (language === "ko" ? "수강 완료 ✓" : "Complete Course ✓")
                : (
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {language === "ko" ? "다음 모듈로" : "Next Module"}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
            </button>
          </div>
        </div>
      </div>

      {/* Completion modal */}
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
