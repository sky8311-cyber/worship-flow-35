import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTier, canAccess } from "@/hooks/useUserTier";
import { InstituteLayout } from "@/layouts/InstituteLayout";

const S = {
  page: { background: '#f5f4f0', minHeight: '100%', padding: '20px' } as React.CSSProperties,
  sectionHd: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' } as React.CSSProperties,
  sectionTxt: { fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' as const, color: '#9a9890', whiteSpace: 'nowrap' as const },
  sectionLine: { flex: 1, height: '1px', background: '#e8e6e0' },
  certScroll: { display: 'flex', gap: '12px', overflowX: 'auto' as const, paddingBottom: '4px', marginBottom: '24px', scrollbarWidth: 'none' as const } as React.CSSProperties,
  certCard: {
    minWidth: '175px', flexShrink: 0, background: '#ffffff',
    border: '1px solid #e8d090', borderRadius: '14px', padding: '18px 16px',
    position: 'relative' as const, overflow: 'hidden' as const, cursor: 'pointer',
    transition: 'box-shadow 0.15s',
  },
  certBar: { position: 'absolute' as const, top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #b8902a, #d4a840)' },
  certEmoji: { fontSize: '26px', marginBottom: '10px', display: 'block' },
  certName: { fontSize: '13px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px', lineHeight: 1.3 },
  certMeta: { fontSize: '11px', color: '#9a9890', marginBottom: '10px' },
  certTag: { display: 'inline-flex', alignItems: 'center', background: '#fdf6e8', border: '1px solid #e8d090', borderRadius: '20px', padding: '3px 10px' },
  certTagTxt: { color: '#b8902a', fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' },
  courseList: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  courseCard: {
    background: '#ffffff', border: '1px solid #e8e6e0',
    borderRadius: '12px', padding: '14px 16px',
    display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  courseCardHover: {
    borderColor: '#e8d090',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  courseThumb: {
    width: '46px', height: '46px', borderRadius: '10px',
    background: '#f9f8f5', border: '1px solid #e8e6e0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '20px', flexShrink: 0,
  } as React.CSSProperties,
  courseInfo: { flex: 1, minWidth: 0 },
  courseTitle: { fontSize: '13px', fontWeight: 700, color: '#1a1a1a', marginBottom: '2px' },
  courseInstructor: { fontSize: '11px', color: '#9a9890', marginBottom: '7px' },
  progRow: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' },
  progBar: { flex: 1, height: '3px', background: '#e8e6e0', borderRadius: '3px', overflow: 'hidden' as const },
  progFill: (pct: number) => ({ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #b8902a, #d4a840)', borderRadius: '3px' }),
  progTxt: { fontSize: '10px', color: '#b8902a', fontWeight: 600, whiteSpace: 'nowrap' as const },
  certPip: { display: 'inline-flex', alignItems: 'center', background: '#fdf6e8', border: '1px solid #e8d090', borderRadius: '20px', padding: '2px 8px', marginBottom: '5px' },
  certPipTxt: { color: '#b8902a', fontSize: '9px', fontWeight: 700 },
  chev: { color: '#e8e6e0', fontSize: '16px', flexShrink: 0 } as React.CSSProperties,
  lockIcon: { color: '#9a9890', fontSize: '12px', marginLeft: '4px' },
  empty: {
    background: '#ffffff', border: '1px solid #e8e6e0',
    borderRadius: '12px', padding: '48px 20px',
    textAlign: 'center' as const, color: '#9a9890', fontSize: '13px',
  },
};

export default function Institute() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
      return (certs || []).map((c: any) => ({ ...c, courseCount: counts[c.id] || 0 }));
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
      <div style={S.page}>
        {/* Certifications */}
        {certifications.length > 0 && (
          <section>
            <div style={S.sectionHd}>
              <span style={S.sectionTxt}>자격증 과정</span>
              <div style={S.sectionLine} />
            </div>
            <div style={S.certScroll}>
              {certifications.map((cert: any) => (
                <div
                  key={cert.id}
                  style={S.certCard}
                  onClick={() => navigate(`/institute/certification/${cert.id}`)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(184,144,42,0.12)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                  <div style={S.certBar} />
                  <span style={S.certEmoji}>🎓</span>
                  <div style={S.certName}>{cert.title_ko}</div>
                  <div style={S.certMeta}>{cert.courseCount}개 과목 포함</div>
                  <div style={S.certTag}>
                    <span style={S.certTagTxt}>K-WORSHIP CERTIFIED</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Courses */}
        <section>
          <div style={S.sectionHd}>
            <span style={S.sectionTxt}>전체 과목</span>
            <div style={S.sectionLine} />
          </div>

          {courses.length === 0 ? (
            <div style={S.empty}>등록된 과목이 없습니다</div>
          ) : (
            <div style={S.courseList}>
              {courses.map((course) => {
                const instructorName = getInstructorName(course.instructor_user_id);
                const enrollment = enrollmentMap.get(course.id);
                const totalModules = moduleCounts[course.id] || 0;
                const locked = !canAccess(course.required_tier, userTier);
                const hasCert = certCourseIds.has(course.id);
                const completed = enrollment?.completed_modules || 0;
                const pct = totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0;

                return (
                  <div
                    key={course.id}
                    style={{ ...S.courseCard, opacity: locked ? 0.45 : 1 }}
                    onClick={() => !locked && navigate(`/institute/${course.id}`)}
                    onMouseEnter={(e) => {
                      if (!locked) {
                        (e.currentTarget as HTMLDivElement).style.borderColor = '#e8d090';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#e8e6e0';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={S.courseThumb}>
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                      ) : (
                        <span>📖</span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={S.courseInfo}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={S.courseTitle}>{course.title_ko}</span>
                        {locked && <span style={S.lockIcon}>🔒</span>}
                      </div>
                      {instructorName && <div style={S.courseInstructor}>{instructorName}</div>}
                      {hasCert && (
                        <div style={S.certPip}>
                          <span style={S.certPipTxt}>수료증 발급</span>
                        </div>
                      )}

                      {/* Progress */}
                      <div style={S.progRow}>
                        <div style={S.progBar}>
                          <div style={S.progFill(pct)} />
                        </div>
                        <span style={S.progTxt}>
                          {enrollment ? `${completed}/${totalModules} 완료` : '미시작'}
                        </span>
                      </div>

                      {enrollment?.completed_at && (
                        <div style={{ ...S.certPip, marginTop: '6px', marginBottom: 0, background: '#b8902a', border: 'none' }}>
                          <span style={{ ...S.certPipTxt, color: '#fff' }}>수강 완료</span>
                        </div>
                      )}
                    </div>

                    {/* Chevron */}
                    <span style={S.chev}>›</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </InstituteLayout>
  );
}
