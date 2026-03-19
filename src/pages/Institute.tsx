import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserTier, canAccess } from "@/hooks/useUserTier";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { Lock } from "lucide-react";

const Institute = () => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const { userTier } = useUserTier();

  const { data: certifications = [] } = useQuery({
    queryKey: ["institute-certifications"],
    queryFn: async () => {
      const { data: certs, error } = await supabase
        .from("institute_certifications")
        .select("*")
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      const { data: certCourses } = await supabase
        .from("institute_certification_courses")
        .select("certification_id");
      const counts: Record<string, number> = {};
      certCourses?.forEach((cc) => {
        if (cc.certification_id) counts[cc.certification_id] = (counts[cc.certification_id] || 0) + 1;
      });
      return (certs || []).map((c) => ({ ...c, courseCount: counts[c.id] || 0 }));
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["institute-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_courses").select("*").eq("is_published", true).order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ["institute-instructors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_instructors").select("user_id, display_name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: certCourseLinks = [] } = useQuery({
    queryKey: ["institute-cert-course-links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_certification_courses").select("course_id");
      if (error) throw error;
      return data || [];
    },
  });
  const certCourseIds = new Set(certCourseLinks.map((l) => l.course_id));

  const { data: enrollments = [] } = useQuery({
    queryKey: ["institute-enrollments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("institute_enrollments")
        .select("course_id, completed_modules, completed_at")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
  const enrollmentMap = new Map(enrollments.map((e) => [e.course_id, e]));

  const { data: moduleCounts = {} as Record<string, number> } = useQuery({
    queryKey: ["institute-module-counts", courses.map((c) => c.id).join(",")],
    queryFn: async () => {
      const courseIds = courses.map((c) => c.id);
      if (courseIds.length === 0) return {};
      const { data, error } = await supabase.from("institute_modules").select("course_id").in("course_id", courseIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((m) => { counts[m.course_id] = (counts[m.course_id] || 0) + 1; });
      return counts;
    },
    enabled: courses.length > 0,
  });

  const getInstructorName = (userId: string | null) => {
    if (!userId) return null;
    return instructors.find((i) => i.user_id === userId)?.display_name || null;
  };

  return (
    <InstituteLayout>
      <div style={{ padding: 20 }}>
        {/* Certifications */}
        {certifications.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div className="inst-section-header">
              <span>{language === "ko" ? "자격증 프로그램" : "CERTIFICATION PROGRAMS"}</span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                paddingBottom: 4,
              }}
            >
              {certifications.map((cert) => (
                <Link key={cert.id} to={`/institute/certification/${cert.id}`} style={{ textDecoration: "none" }}>
                  <div
                    className="inst-card-hover"
                    style={{
                      minWidth: 175,
                      background: "var(--inst-surface)",
                      border: "1px solid var(--inst-gold-bdr)",
                      borderRadius: 14,
                      padding: "18px 16px",
                      position: "relative",
                      overflow: "hidden",
                      scrollSnapAlign: "start",
                    }}
                  >
                    {/* Gold top bar */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: "linear-gradient(90deg, var(--inst-gold), var(--inst-gold-lt))",
                      }}
                    />
                    <div style={{ fontSize: 26, marginBottom: 10 }}>🎓</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--inst-ink)", marginBottom: 4 }}>
                      {cert.title_ko}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--inst-ink3)", marginBottom: 10 }}>
                      {cert.courseCount}{language === "ko" ? "개 과목" : " courses"}
                    </div>
                    <span className="inst-badge-certified">K-WORSHIP CERTIFIED</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Courses */}
        <section>
          <div className="inst-section-header">
            <span>{language === "ko" ? "전체 과목" : "ALL COURSES"}</span>
          </div>
          {courses.length === 0 ? (
            <div
              style={{
                background: "var(--inst-surface)",
                border: "1px solid var(--inst-border)",
                borderRadius: 12,
                padding: "48px 20px",
                textAlign: "center",
                color: "var(--inst-ink3)",
                fontSize: 13,
              }}
            >
              {language === "ko" ? "등록된 과목이 없습니다" : "No courses available yet"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {courses.map((course) => {
                const instructorName = getInstructorName(course.instructor_user_id);
                const enrollment = enrollmentMap.get(course.id);
                const totalModules = moduleCounts[course.id] || 0;
                const locked = !canAccess(course.required_tier, userTier);
                const hasCert = certCourseIds.has(course.id);
                const progress = enrollment && totalModules > 0
                  ? Math.round(((enrollment.completed_modules || 0) / totalModules) * 100)
                  : 0;

                return (
                  <Link key={course.id} to={`/institute/${course.id}`} style={{ textDecoration: "none" }}>
                    <div
                      className="inst-card-hover"
                      style={{
                        background: "var(--inst-surface)",
                        border: "1px solid var(--inst-border)",
                        borderRadius: 12,
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        opacity: locked ? 0.45 : 1,
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 10,
                          background: "var(--inst-surface2)",
                          flexShrink: 0,
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: 18, color: "var(--inst-ink3)" }}>📘</span>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--inst-ink)" }}>
                            {course.title_ko}
                          </span>
                          {locked && <Lock className="w-3 h-3" style={{ color: "var(--inst-ink3)" }} />}
                        </div>
                        {instructorName && (
                          <div style={{ fontSize: 11, color: "var(--inst-ink3)" }}>{instructorName}</div>
                        )}
                        {hasCert && (
                          <span className="inst-badge-certified" style={{ marginTop: 4 }}>
                            수료증 발급 과정
                          </span>
                        )}
                        {enrollment && !enrollment.completed_at && totalModules > 0 && (
                          <div style={{ marginTop: 6 }}>
                            <div className="inst-progress">
                              <div className="inst-progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                            <div style={{ fontSize: 10, color: "var(--inst-gold)", fontWeight: 600, marginTop: 3 }}>
                              {enrollment.completed_modules || 0}/{totalModules} ({progress}%)
                            </div>
                          </div>
                        )}
                        {enrollment?.completed_at && (
                          <span
                            className="inst-badge-certified"
                            style={{ marginTop: 4, background: "var(--inst-gold)", color: "#fff", border: "none" }}
                          >
                            {language === "ko" ? "수강 완료" : "Completed"}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </InstituteLayout>
  );
};

export default Institute;
