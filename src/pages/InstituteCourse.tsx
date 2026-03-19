import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserTier, canAccess } from "@/hooks/useUserTier";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { Lock, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const InstituteCourse = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { language } = useTranslation();
  const { userTier } = useUserTier();

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

  const { data: instructor } = useQuery({
    queryKey: ["institute-instructor", course?.instructor_user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_instructors")
        .select("display_name")
        .eq("user_id", course!.instructor_user_id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!course?.instructor_user_id,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["institute-enrollment", user?.id, courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_enrollments").select("*")
        .eq("user_id", user!.id).eq("course_id", courseId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!courseId,
  });

  const { data: certLink } = useQuery({
    queryKey: ["institute-cert-link", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_certification_courses")
        .select("certification_id")
        .eq("course_id", courseId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const enroll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("institute_enrollments").insert({ user_id: user!.id, course_id: courseId! });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institute-enrollment", user?.id, courseId] });
      queryClient.invalidateQueries({ queryKey: ["institute-enrollments"] });
      toast({ title: language === "ko" ? "수강 신청이 완료되었습니다" : "Successfully enrolled" });
      const firstAccessible = modules.find((m) => canAccess(m.required_tier, userTier));
      if (firstAccessible) navigate(`/institute/${courseId}/${firstAccessible.id}`);
    },
  });

  if (!course) {
    return (
      <InstituteLayout pageTitle={language === "ko" ? "과목 상세" : "Course Detail"}>
        <div style={{ padding: 32, textAlign: "center", color: "var(--inst-ink3)" }}>Loading...</div>
      </InstituteLayout>
    );
  }

  const courseLocked = !canAccess(course.required_tier, userTier);
  const completedModules = enrollment?.completed_modules || 0;

  return (
    <InstituteLayout backTo="/institute" backLabel={language === "ko" ? "목록으로" : "Back"}>
      {/* Hero */}
      <div style={{ background: "var(--inst-surface)", padding: "24px 20px 20px", borderBottom: "1px solid var(--inst-border)" }}>
        {certLink && (
          <span className="inst-badge-certified" style={{ marginBottom: 14, display: "inline-flex" }}>
            🎓 K-WORSHIP CERTIFIED
          </span>
        )}
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--inst-ink)", letterSpacing: -0.5, lineHeight: 1.2, marginTop: certLink ? 14 : 0 }}>
          {course.title_ko}
        </h1>
        {instructor?.display_name && (
          <div style={{ fontSize: 12, color: "var(--inst-ink3)", marginTop: 6 }}>{instructor.display_name}</div>
        )}
        {course.description_ko && (
          <p style={{ fontSize: 13, color: "var(--inst-ink2)", lineHeight: 1.7, marginTop: 10 }}>{course.description_ko}</p>
        )}

        {/* CTA */}
        <div style={{ marginTop: 20 }}>
          {courseLocked ? (
            <div
              style={{
                background: "var(--inst-surface2)",
                border: "1px solid var(--inst-border)",
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Lock className="w-4 h-4" style={{ color: "var(--inst-ink3)" }} />
                <span style={{ fontSize: 12, color: "var(--inst-ink2)", lineHeight: 1.5 }}>
                  {course.required_tier === 2
                    ? "이 과정은 정식멤버(Full Member)와 공동체계정(Community Account)에 포함되어 있습니다."
                    : course.required_tier === 1
                    ? "이 과정은 기본멤버(Basic Member)부터 수강할 수 있습니다."
                    : "이 과정은 공동체계정(Community Account)에서 이용 가능합니다."}
                </span>
              </div>
              <Link to={course.required_tier === 1 ? "/request-worship-leader" : "/membership"}>
                <button className="inst-btn-outline" style={{ fontSize: 11 }}>
                  {language === "ko" ? "자세히 보기" : "Learn more"}
                </button>
              </Link>
            </div>
          ) : enrollment ? (
            <button
              className="inst-btn-gold"
              style={{ background: "var(--inst-surface2)", color: "var(--inst-ink)", border: "1.5px solid var(--inst-border)", boxShadow: "none" }}
              onClick={() => {
                const next = modules.find((m) => canAccess(m.required_tier, userTier));
                if (next) navigate(`/institute/${courseId}/${next.id}`);
              }}
            >
              {language === "ko" ? "이어서 수강하기" : "Continue Learning"}
            </button>
          ) : (
            <button className="inst-btn-gold" onClick={() => enroll.mutate()} disabled={enroll.isPending}>
              {language === "ko" ? "수강 신청하기" : "Enroll Now"}
            </button>
          )}
        </div>
      </div>

      {/* Module list */}
      <div style={{ padding: "8px 20px 20px" }}>
        <div className="inst-section-header" style={{ marginTop: 16 }}>
          <span>{language === "ko" ? "커리큘럼" : "CURRICULUM"} ({modules.length})</span>
        </div>
        {modules.map((mod, idx) => {
          const accessible = canAccess(mod.required_tier, userTier);
          const isCompleted = idx < completedModules;
          const isCurrent = idx === completedModules && !!enrollment;
          const isLocked = !accessible;

          return (
            <div
              key={mod.id}
              onClick={() => {
                if (accessible && enrollment) navigate(`/institute/${courseId}/${mod.id}`);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 0",
                borderBottom: "1px solid var(--inst-border)",
                cursor: accessible && enrollment ? "pointer" : "default",
              }}
            >
              {/* Status indicator */}
              <div
                className={`inst-status ${
                  isCompleted ? "inst-status-done" :
                  isCurrent ? "inst-status-current" :
                  isLocked ? "inst-status-locked" : "inst-status-pending"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: isLocked ? "var(--inst-ink3)" : "var(--inst-ink)",
                  }}
                >
                  {language === "ko" ? mod.title_ko : mod.title}
                </div>
                {isLocked && (
                  <div style={{ fontSize: 10, color: "var(--inst-ink3)", marginTop: 2 }}>
                    {mod.required_tier === 2 ? "정식멤버 이상" : mod.required_tier === 1 ? "기본멤버 이상" : "공동체계정"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </InstituteLayout>
  );
};

export default InstituteCourse;
