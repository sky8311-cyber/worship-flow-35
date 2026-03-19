import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTier, canAccess } from "@/hooks/useUserTier";
import { useTierFeature } from "@/hooks/useTierFeature";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { Play, Sparkles } from "lucide-react";
import { useState } from "react";

/* ── Inline styles ── */
const S = {
  page: { background: '#f5f4f0', minHeight: '100%' } as React.CSSProperties,

  /* Hero */
  hero: { background: '#ffffff', padding: '28px 20px 24px', borderBottom: '1px solid #e8e6e0' } as React.CSSProperties,
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: '#fdf6e8', border: '1px solid #e8d090', borderRadius: '20px',
    padding: '5px 14px', fontSize: '11px', fontWeight: 700, color: '#b8902a', letterSpacing: '0.5px',
  } as React.CSSProperties,
  heroTitle: { fontSize: '22px', fontWeight: 800, color: '#1a1a1a', lineHeight: 1.3, marginTop: '16px', letterSpacing: '-0.3px' } as React.CSSProperties,
  heroGold: { color: '#b8902a' },
  heroSub: { fontSize: '13px', color: '#5a5850', lineHeight: 1.7, marginTop: '10px' } as React.CSSProperties,

  /* Video + right column 2-col layout */
  twoCol: { display: 'flex', gap: '16px', marginTop: '20px' } as React.CSSProperties,

  /* Vertical video placeholder */
  videoBox: {
    width: '160px', flexShrink: 0, background: '#1a1a1a', borderRadius: '12px',
    position: 'relative' as const, aspectRatio: '9/16', overflow: 'hidden' as const,
  } as React.CSSProperties,
  videoOverlay: {
    position: 'absolute' as const, inset: 0, display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center', gap: '8px',
  } as React.CSSProperties,
  playBtn: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'rgba(184,144,42,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  } as React.CSSProperties,
  videoLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 },

  /* Right column */
  rightCol: { flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '10px', minWidth: 0 } as React.CSSProperties,

  /* Stats */
  statsCol: { display: 'flex', flexDirection: 'column' as const, gap: '8px' } as React.CSSProperties,
  statCard: {
    background: '#f9f8f5', border: '1px solid #e8e6e0', borderRadius: '10px',
    padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px',
  } as React.CSSProperties,
  statNum: { fontSize: '16px', fontWeight: 800, color: '#b8902a' },
  statLabel: { fontSize: '11px', color: '#5a5850', fontWeight: 500 },

  /* AI Coach Banner */
  aiBanner: {
    margin: '16px 20px 0', background: '#ffffff', border: '1px solid #e8d090',
    borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
    cursor: 'pointer', boxShadow: '0 2px 10px rgba(184,144,42,0.08)',
  } as React.CSSProperties,
  aiIcon: {
    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
    background: 'linear-gradient(135deg, #b8902a, #d4a840)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '10px', fontWeight: 800,
  } as React.CSSProperties,
  aiTitle: { fontSize: '14px', fontWeight: 700, color: '#1a1a1a' },
  aiSub: { fontSize: '12px', color: '#9a9890', marginTop: '2px' },
  aiBadge: {
    display: 'inline-flex', alignItems: 'center', background: '#fdf6e8', border: '1px solid #e8d090',
    borderRadius: '20px', padding: '4px 10px', fontSize: '10px', fontWeight: 700, color: '#b8902a',
    whiteSpace: 'nowrap' as const, flexShrink: 0,
  } as React.CSSProperties,

  /* Locked banner */
  lockedBanner: {
    margin: '8px 20px 0', background: '#fdf6e8', border: '1px solid #e8d090', borderRadius: '10px',
    padding: '12px 16px', fontSize: '12px', color: '#5a5850', lineHeight: 1.6,
  } as React.CSSProperties,
  lockedLink: {
    display: 'block', marginTop: '8px', fontSize: '11px', fontWeight: 700,
    color: '#b8902a', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  } as React.CSSProperties,

  /* Sections */
  section: { padding: '24px 20px 0' } as React.CSSProperties,
  sectionHd: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' } as React.CSSProperties,
  sectionTxt: { fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' as const, color: '#9a9890', whiteSpace: 'nowrap' as const },
  sectionLine: { flex: 1, height: '1px', background: '#e8e6e0' },

  /* Cert scroll */
  certScroll: { display: 'flex', gap: '14px', overflowX: 'auto' as const, paddingBottom: '4px', marginBottom: '8px', scrollbarWidth: 'none' as const } as React.CSSProperties,
  certCard: {
    minWidth: '200px', flexShrink: 0, background: '#ffffff',
    border: '1px solid #e8d090', borderRadius: '14px', padding: '20px 18px',
    position: 'relative' as const, overflow: 'hidden' as const, cursor: 'pointer',
    transition: 'box-shadow 0.15s',
  },
  certBar: { position: 'absolute' as const, top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #b8902a, #d4a840)' },
  certEmoji: { fontSize: '32px', marginBottom: '12px', display: 'block' },
  certName: { fontSize: '15px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px', lineHeight: 1.3 },
  certMeta: { fontSize: '12px', color: '#9a9890', marginBottom: '12px' },
  certTag: { display: 'inline-flex', alignItems: 'center', background: '#fdf6e8', border: '1px solid #e8d090', borderRadius: '20px', padding: '4px 12px' },
  certTagTxt: { color: '#b8902a', fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' },

  /* Course list */
  courseList: { display: 'flex', flexDirection: 'column' as const, gap: '10px', paddingBottom: '24px' },
  courseCard: {
    background: '#ffffff', border: '1px solid #e8e6e0',
    borderRadius: '12px', padding: '16px 18px',
    display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  courseThumb: {
    width: '52px', height: '52px', borderRadius: '10px',
    background: '#f9f8f5', border: '1px solid #e8e6e0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px', flexShrink: 0,
  } as React.CSSProperties,
  courseInfo: { flex: 1, minWidth: 0 },
  courseTitle: { fontSize: '15px', fontWeight: 700, color: '#1a1a1a', marginBottom: '2px' },
  courseInstructor: { fontSize: '12px', color: '#9a9890', marginBottom: '7px' },
  progRow: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' },
  progBar: { flex: 1, height: '3px', background: '#e8e6e0', borderRadius: '3px', overflow: 'hidden' as const },
  progFill: (pct: number) => ({ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #b8902a, #d4a840)', borderRadius: '3px' }),
  progTxt: { fontSize: '11px', color: '#b8902a', fontWeight: 600, whiteSpace: 'nowrap' as const },
  certPip: { display: 'inline-flex', alignItems: 'center', background: '#fdf6e8', border: '1px solid #e8d090', borderRadius: '20px', padding: '3px 10px', marginBottom: '5px' },
  certPipTxt: { color: '#b8902a', fontSize: '10px', fontWeight: 700 },
  chev: { color: '#e8e6e0', fontSize: '20px', flexShrink: 0 } as React.CSSProperties,
  lockIcon: { color: '#9a9890', fontSize: '13px', marginLeft: '4px' },
  empty: {
    background: '#ffffff', border: '1px solid #e8e6e0',
    borderRadius: '12px', padding: '56px 24px',
    textAlign: 'center' as const, color: '#9a9890', fontSize: '14px',
  },
};

export default function Institute() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userTier } = useUserTier();
  const { hasFeature } = useTierFeature();
  const [showAiLocked, setShowAiLocked] = useState(false);

  const canUseCoach = hasFeature("institute_ai_coach");

  /* ── Data queries (unchanged) ── */
  const { data: certifications = [] } = useQuery({
    queryKey: ["institute-certifications"],
    queryFn: async () => {
      const { data: certs, error } = await supabase.from("institute_certifications").select("*").eq("is_published", true).order("sort_order");
      if (error) throw error;
      const { data: certCourses } = await supabase.from("institute_certification_courses").select("certification_id");
      const counts: Record<string, number> = {};
      certCourses?.forEach((cc) => { if (cc.certification_id) counts[cc.certification_id] = (counts[cc.certification_id] || 0) + 1; });
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
      const { data, error } = await supabase.from("institute_enrollments").select("course_id, completed_modules, completed_at").eq("user_id", user.id);
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

  const handleAiCoachClick = () => {
    if (!canUseCoach) {
      setShowAiLocked(true);
      return;
    }
    // Navigate to first enrolled course's first module, or show info
    navigate("/membership");
  };

  return (
    <InstituteLayout>
      <div style={S.page}>

        {/* ═══ Hero ═══ */}
        <div style={S.hero}>
          <div style={S.eyebrow}>🎓 K-WORSHIP CERTIFIED</div>

          <h1 style={S.heroTitle}>
            한국 예배 사역자를 위한{' '}
            <span style={S.heroGold}>공식 자격증 스쿨</span>
          </h1>

          <p style={S.heroSub}>
            찬양인도자, 예배팀 리더, 사역자를 위한 온라인 커리큘럼 · AI 학습 코치 · 공식 배지 발급
          </p>

          {/* Video placeholder */}
          <div style={S.videoBox}>
            <div style={S.videoOverlay}>
              <div style={S.playBtn}>
                <Play className="w-5 h-5 text-white" fill="white" />
              </div>
              <span style={S.videoLabel}>AI 강사 소개 영상</span>
            </div>
          </div>

          {/* Stats */}
          <div style={S.statsRow}>
            <div style={S.statCard}>
              <div style={S.statNum}>3+</div>
              <div style={S.statLabel}>자격증 과정</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statNum}>
                <Sparkles className="w-4 h-4 inline-block" style={{ marginBottom: 2 }} />
              </div>
              <div style={S.statLabel}>AI 학습 코치</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statNum}>∞</div>
              <div style={S.statLabel}>평생 수강</div>
            </div>
          </div>
        </div>

        {/* ═══ AI Coach Banner ═══ */}
        <div style={S.aiBanner} onClick={handleAiCoachClick}>
          <div style={S.aiIcon}>AI</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.aiTitle}>AI 코치에게 질문하기</div>
            <div style={S.aiSub}>예배 신학, 선곡, 사역 고민을 함께 나눠요</div>
          </div>
          <div style={S.aiBadge}>정식멤버</div>
        </div>

        {showAiLocked && !canUseCoach && (
          <div style={S.lockedBanner}>
            AI 코치는 정식멤버(Full Member) 이상에서 이용 가능합니다.
            <button onClick={() => navigate("/membership")} style={S.lockedLink}>
              멤버십 보기 →
            </button>
          </div>
        )}

        {/* ═══ Certifications ═══ */}
        {certifications.length > 0 && (
          <section style={S.section}>
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

        {/* ═══ All Courses ═══ */}
        <section style={S.section}>
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
                    <div style={S.courseThumb}>
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                      ) : (
                        <span>📖</span>
                      )}
                    </div>

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
