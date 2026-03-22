import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTier, canAccess } from "@/hooks/useUserTier";
import { useTierFeature } from "@/hooks/useTierFeature";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { InstituteInvitationBanner } from "@/components/institute/InstituteInvitationBanner";
import { Play, Sparkles, ChevronRight, Lock } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Institute() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userTier } = useUserTier();
  const { hasFeature } = useTierFeature();
  const [showAiLocked, setShowAiLocked] = useState(false);

  const canUseCoach = hasFeature("institute_ai_coach");

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
    navigate("/membership");
  };

  return (
    <InstituteLayout>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Invitation banner */}
        <InstituteInvitationBanner />

        {/* ═══ Hero ═══ */}
        <Card className="mb-6">
          <CardContent className="p-5 md:p-6">
            <Badge variant="secondary" className="mb-3">
              🎓 K-WORSHIP CERTIFIED
            </Badge>

            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
              한국 예배 사역자를 위한{" "}
              <span className="text-primary">공식 자격증 스쿨</span>
            </h1>

            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              찬양인도자, 예배팀 리더, 사역자를 위한 온라인 커리큘럼 · AI 학습 코치 · 공식 배지 발급
            </p>

            {/* 2-column: vertical video + right stats/AI */}
            <div className="flex gap-4 mt-5">
              {/* Left: vertical video */}
              <div className="w-[140px] md:w-[160px] flex-shrink-0 bg-foreground rounded-xl relative overflow-hidden" style={{ aspectRatio: "9/16" }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="w-4 h-4 text-primary-foreground" fill="currentColor" />
                  </div>
                  <span className="text-xs text-white/60">AI 강사 소개 영상</span>
                </div>
              </div>

              {/* Right: stats + AI coach */}
              <div className="flex-1 flex flex-col gap-2.5 min-w-0">
                <div className="flex flex-col gap-2">
                  <div className="bg-muted border border-border rounded-lg p-2.5 flex items-center gap-2.5">
                    <span className="text-base font-bold text-primary">3+</span>
                    <span className="text-xs text-muted-foreground">자격증 과정</span>
                  </div>
                  <div className="bg-muted border border-border rounded-lg p-2.5 flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">AI 학습 코치</span>
                  </div>
                  <div className="bg-muted border border-border rounded-lg p-2.5 flex items-center gap-2.5">
                    <span className="text-base font-bold text-primary">∞</span>
                    <span className="text-xs text-muted-foreground">평생 수강</span>
                  </div>
                </div>

                {/* AI Coach Banner */}
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow border-primary/20"
                  onClick={handleAiCoachClick}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex-shrink-0 bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">
                      AI
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">AI 코치에게 질문하기</div>
                      <div className="text-xs text-muted-foreground mt-0.5">예배 신학, 선곡, 사역 고민을 함께 나눠요</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] whitespace-nowrap flex-shrink-0">
                      정식멤버
                    </Badge>
                  </CardContent>
                </Card>

                {showAiLocked && !canUseCoach && (
                  <div className="bg-muted border border-border rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
                    AI 코치는 정식멤버(Full Member) 이상에서 이용 가능합니다.
                    <button onClick={() => navigate("/membership")} className="block mt-1.5 text-xs font-semibold text-primary bg-transparent border-none cursor-pointer p-0">
                      멤버십 보기 →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══ Certifications ═══ */}
        {certifications.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap">자격증 과정</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="flex gap-3.5 overflow-x-auto pb-1 scrollbar-hide">
              {certifications.map((cert: any) => (
                <Card
                  key={cert.id}
                  className="min-w-[200px] flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden"
                  onClick={() => navigate(`/institute/certification/${cert.id}`)}
                >
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary" />
                  <CardContent className="p-5">
                    <span className="text-[32px] mb-3 block">🎓</span>
                    <div className="text-[15px] font-bold text-foreground mb-1 leading-tight">{cert.title_ko}</div>
                    <div className="text-xs text-muted-foreground mb-3">{cert.courseCount}개 과목 포함</div>
                    <Badge variant="secondary" className="text-[10px]">
                      K-WORSHIP CERTIFIED
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ═══ All Courses ═══ */}
        <section className="mb-6">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap">전체 과목</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {courses.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center text-muted-foreground text-sm">
                등록된 과목이 없습니다
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2.5">
              {courses.map((course) => {
                const instructorName = getInstructorName(course.instructor_user_id);
                const enrollment = enrollmentMap.get(course.id);
                const totalModules = moduleCounts[course.id] || 0;
                const locked = !canAccess(course.required_tier, userTier);
                const hasCert = certCourseIds.has(course.id);
                const completed = enrollment?.completed_modules || 0;
                const pct = totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0;

                return (
                  <Card
                    key={course.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${locked ? "opacity-50" : ""}`}
                    onClick={() => !locked && navigate(`/institute/${course.id}`)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-[52px] h-[52px] rounded-lg bg-muted border border-border flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span>📖</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[15px] font-bold text-foreground">{course.title_ko}</span>
                          {locked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        {instructorName && <div className="text-xs text-muted-foreground mt-0.5">{instructorName}</div>}
                        {hasCert && (
                          <Badge variant="secondary" className="text-[10px] mt-1">
                            수료증 발급
                          </Badge>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <Progress value={pct} className="h-1 flex-1" />
                          <span className="text-xs text-primary font-semibold whitespace-nowrap">
                            {enrollment ? `${completed}/${totalModules} 완료` : "미시작"}
                          </span>
                        </div>
                        {enrollment?.completed_at && (
                          <Badge className="mt-1.5 text-[10px]">수강 완료</Badge>
                        )}
                      </div>

                      <ChevronRight className="w-5 h-5 text-muted-foreground/40 flex-shrink-0" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </InstituteLayout>
  );
}
