import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const InstituteCertification = () => {
  const { certId } = useParams<{ certId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { language } = useTranslation();
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);
  const [awardedBadge, setAwardedBadge] = useState<any>(null);

  const { data: cert } = useQuery({
    queryKey: ["institute-certification", certId],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_certifications").select("*").eq("id", certId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!certId,
  });

  const { data: certCourses = [] } = useQuery({
    queryKey: ["institute-cert-courses", certId],
    queryFn: async () => {
      const { data: links, error } = await supabase
        .from("institute_certification_courses")
        .select("course_id, sort_order")
        .eq("certification_id", certId!)
        .order("sort_order");
      if (error) throw error;
      if (!links || links.length === 0) return [];
      const courseIds = links.map((l) => l.course_id).filter(Boolean) as string[];
      const { data: courses } = await supabase.from("institute_courses").select("id, title_ko, title, instructor_user_id").in("id", courseIds);
      const courseMap = new Map((courses || []).map((c) => [c.id, c]));
      return links.map((l) => ({ ...courseMap.get(l.course_id!), sort_order: l.sort_order })).filter((c): c is any => !!c.id);
    },
    enabled: !!certId,
  });

  const courseIds = certCourses.map((c: any) => c.id).filter(Boolean);
  const { data: enrollments = [] } = useQuery({
    queryKey: ["institute-cert-enrollments", user?.id, courseIds.join(",")],
    queryFn: async () => {
      if (!user?.id || courseIds.length === 0) return [];
      const { data, error } = await supabase
        .from("institute_enrollments")
        .select("course_id, completed_at")
        .eq("user_id", user.id)
        .in("course_id", courseIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && courseIds.length > 0,
  });
  const enrollmentMap = new Map(enrollments.map((e) => [e.course_id, e]));
  const completedCount = enrollments.filter((e) => e.completed_at).length;
  const allCompleted = completedCount === certCourses.length && certCourses.length > 0;
  const remaining = certCourses.length - completedCount;

  const awardBadge = useMutation({
    mutationFn: async () => {
      await supabase.auth.refreshSession();
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-institute-badge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ user_id: user!.id, certification_id: certId }),
      });
      if (!resp.ok) throw new Error("Failed");
      return resp.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setAwardedBadge(data.badge);
        setShowBadgeDialog(true);
        queryClient.invalidateQueries({ queryKey: ["institute-cert-enrollments"] });
      } else if (data.reason === "courses_incomplete") {
        toast({ title: language === "ko" ? "아직 완료하지 않은 과정이 있습니다" : "Some courses are not yet completed" });
      }
    },
    onError: () => {
      toast({ title: language === "ko" ? "배지 발급에 실패했습니다" : "Failed to award badge", variant: "destructive" });
    },
  });

  if (!cert) {
    return (
      <InstituteLayout pageTitle={language === "ko" ? "자격증" : "Certification"}>
        <div style={{ padding: 32, textAlign: "center", color: "var(--inst-ink3)" }}>Loading...</div>
      </InstituteLayout>
    );
  }

  return (
    <InstituteLayout backTo="/institute" backLabel={language === "ko" ? "목록으로" : "Back"}>
      {/* Hero */}
      <div style={{ background: "var(--inst-surface)", padding: "24px 20px", borderBottom: "1px solid var(--inst-border)" }}>
        <span className="inst-badge-certified" style={{ marginBottom: 14, display: "inline-flex" }}>
          K-WORSHIP CERTIFIED
        </span>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginTop: 14 }}>
          {cert.badge_image_url ? (
            <img src={cert.badge_image_url} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover" }} />
          ) : (
            <div style={{ fontSize: 44 }}>🎓</div>
          )}
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--inst-ink)" }}>{cert.title_ko}</h1>
            {cert.description_ko && (
              <p style={{ fontSize: 13, color: "var(--inst-ink2)", marginTop: 6, lineHeight: 1.6 }}>{cert.description_ko}</p>
            )}
          </div>
        </div>
      </div>

      {/* Courses */}
      <div style={{ padding: "16px 20px" }}>
        <div className="inst-section-header">
          <span>{language === "ko" ? "포함 과목" : "INCLUDED COURSES"} ({certCourses.length})</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {certCourses.map((course: any) => {
            const isCompleted = !!enrollmentMap.get(course.id)?.completed_at;
            return (
              <Link key={course.id} to={`/institute/${course.id}`} style={{ textDecoration: "none" }}>
                <div
                  className="inst-card-hover"
                  style={{
                    background: "var(--inst-surface)",
                    border: "1px solid var(--inst-border)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    className={`inst-status ${isCompleted ? "inst-status-done" : "inst-status-pending"}`}
                    style={{ width: 24, height: 24, fontSize: 10 }}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : ""}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--inst-ink)" }}>{course.title_ko}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Badge CTA */}
        <div
          style={{
            background: "var(--inst-surface)",
            border: "1px solid var(--inst-border)",
            borderRadius: 14,
            padding: "24px 20px",
            textAlign: "center",
            marginTop: 20,
          }}
        >
          {allCompleted ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--inst-ink)", marginBottom: 16 }}>
                {language === "ko" ? "모든 과정을 완료했습니다!" : "All courses completed!"}
              </p>
              <button className="inst-btn-gold" style={{ width: "auto", padding: "12px 24px" }} onClick={() => awardBadge.mutate()} disabled={awardBadge.isPending}>
                {language === "ko" ? "K-Worship Certified 배지 신청" : "Request K-Worship Certified Badge"}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 12, color: "var(--inst-ink3)", marginBottom: 12 }}>
                {language === "ko"
                  ? `${remaining}개 과정을 완료하면 배지를 신청할 수 있습니다.`
                  : `Complete ${remaining} more course${remaining > 1 ? "s" : ""} to request the badge.`}
              </p>
              <button className="inst-btn-gold" style={{ width: "auto", padding: "12px 24px", opacity: 0.4, cursor: "not-allowed" }} disabled>
                {language === "ko" ? "K-Worship Certified 배지 신청" : "Request Badge"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Badge dialog */}
      {showBadgeDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(245,244,240,0.9)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowBadgeDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--inst-surface)",
              border: "1px solid var(--inst-gold-bdr)",
              borderRadius: 20,
              padding: "36px 28px",
              textAlign: "center",
              maxWidth: 320,
              width: "100%",
              boxShadow: "0 20px 60px rgba(184,144,42,0.15)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, var(--inst-gold), var(--inst-gold-lt))" }} />
            {cert.badge_image_url ? (
              <img src={cert.badge_image_url} alt="" style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", margin: "0 auto 12px" }} />
            ) : (
              <div style={{ fontSize: 44, marginBottom: 12 }}>🎓</div>
            )}
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--inst-ink)", marginBottom: 4 }}>K-Worship Certified</h2>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--inst-gold)", marginBottom: 8 }}>{cert.title_ko}</div>
            <p style={{ fontSize: 12, color: "var(--inst-ink2)", lineHeight: 1.6, marginBottom: 4 }}>
              {language === "ko" ? "축하합니다! 자격을 취득하셨습니다." : "Congratulations! You've earned your certification."}
            </p>
            {awardedBadge?.awarded_at && (
              <p style={{ fontSize: 11, color: "var(--inst-ink3)" }}>
                {new Date(awardedBadge.awarded_at).toLocaleDateString(language === "ko" ? "ko-KR" : "en-US")}
              </p>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
              <button className="inst-btn-outline" onClick={() => setShowBadgeDialog(false)}>
                {language === "ko" ? "확인" : "OK"}
              </button>
              <button className="inst-btn-gold-sm" onClick={() => { setShowBadgeDialog(false); navigate("/dashboard"); }}>
                {language === "ko" ? "프로필 보기" : "View Profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </InstituteLayout>
  );
};

export default InstituteCertification;
