import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTier, canAccess } from "@/hooks/useUserTier";
import { useTierFeature } from "@/hooks/useTierFeature";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { InstituteInvitationBanner } from "@/components/institute/InstituteInvitationBanner";
import { Sparkles, ChevronRight, Lock, BookOpen, Users, Award } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Institute() {
  const navigate = useNavigate();
  const { user, isAdmin, profile } = useAuth();
  const { userTier } = useUserTier();
  const { hasFeature } = useTierFeature();
  const [showAiLocked, setShowAiLocked] = useState(false);

  const canUseCoach = hasFeature("institute_ai_coach");

  // ─── Data queries (unchanged) ───
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

  // ─── Continue Learning query ───
  const { data: continueLearning } = useQuery({
    queryKey: ["institute-continue-learning", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: enrollment, error } = await supabase
        .from("institute_enrollments")
        .select("course_id, completed_modules, completed_at")
        .eq("user_id", user.id)
        .is("completed_at", null)
        .order("enrolled_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !enrollment) return null;

      const { data: course } = await supabase
        .from("institute_courses")
        .select("id, title_ko")
        .eq("id", enrollment.course_id)
        .maybeSingle();

      const completedCount = enrollment.completed_modules || 0;
      const { data: modules } = await supabase
        .from("institute_modules")
        .select("id, title_ko")
        .eq("course_id", enrollment.course_id)
        .order("sort_order")
        .range(completedCount, completedCount);

      const { count: totalModules } = await supabase
        .from("institute_modules")
        .select("id", { count: "exact", head: true })
        .eq("course_id", enrollment.course_id);

      return {
        courseId: enrollment.course_id,
        courseName: course?.title_ko || "",
        currentModuleTitle: modules?.[0]?.title_ko || "",
        currentModuleId: modules?.[0]?.id || null,
        completed: completedCount,
        total: totalModules || 0,
        pct: totalModules ? Math.round((completedCount / totalModules) * 100) : 0,
      };
    },
    enabled: !!user?.id,
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

  const firstName = profile?.full_name?.split(" ")[0] || profile?.full_name || "";

  return (
    <InstituteLayout>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <InstituteInvitationBanner />

        {/* ═══ 4b. Personal Greeting ═══ */}
        {user && firstName && (
          <p className="text-sm text-muted-foreground mb-4">
            안녕하세요, {firstName}님
          </p>
        )}

        {/* ═══ 4c. Continue Learning Card ═══ */}
        {user && (
          <Card className="mb-6">
            <CardContent className="p-4">
              {continueLearning ? (
                <>
                  <div className="text-[11px] text-muted-foreground mb-1.5">이어서 학습하기</div>
                  <div className="text-sm font-bold text-foreground leading-snug">{continueLearning.courseName}</div>
                  {continueLearning.currentModuleTitle && (
                    <div className="text-xs text-muted-foreground mt-0.5">{continueLearning.currentModuleTitle}</div>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <Progress value={continueLearning.pct} className="h-1.5 flex-1" />
                    <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">
                      {continueLearning.pct}%
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => navigate(`/institute/${continueLearning.courseId}`)}
                  >
                    계속하기
                  </Button>
                </>
              ) : (
                <div className="text-center py-2">
                  <div className="text-sm text-muted-foreground mb-2">아직 시작한 과목이 없어요</div>
                  {courses.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/institute/${courses[0].id}`)}
                    >
                      첫 번째 과목 시작하기
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ═══ 4d. AI Coach — Standalone Section ═══ */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold flex-shrink-0">
                AI
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">AI 예배 코치</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              예배 신학, 선곡, 사역 고민을 함께 나눠요
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleAiCoachClick}
                className="gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                질문하기
              </Button>
              <Badge variant="outline" className="text-[10px]">정식멤버</Badge>
            </div>
            {showAiLocked && !canUseCoach && (
              <div className="mt-2 p-3 rounded-lg bg-muted text-xs text-muted-foreground leading-relaxed">
                AI 코치는 정식멤버(Full Member) 이상에서 이용 가능합니다.
                <button onClick={() => navigate("/membership")} className="block mt-1 text-xs font-semibold text-primary bg-transparent border-none cursor-pointer p-0">
                  멤버십 보기 →
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══ 4a. Hero (admin controls removed) ═══ */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-5">
            <Badge variant="secondary" className="text-[10px] mb-3">
              🎓 K-WORSHIP INSTITUTE
            </Badge>
            <h1 className="text-lg font-bold text-foreground leading-snug">
              예배 사역자를 위한 온라인 자격증 스쿨
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              찬양인도자, 예배팀 리더, 사역자를 위한 커리큘럼 · AI 학습 코치 · 공식 배지 발급
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>{courses.length}개 과목</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Award className="w-3.5 h-3.5 text-primary" />
                <span>{certifications.length}개 자격증</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>AI 코치</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══ Certifications ═══ */}
        {certifications.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">자격증 과정</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {certifications.map((cert: any) => (
                <Card
                  key={cert.id}
                  className="min-w-[180px] flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/institute/certification/${cert.id}`)}
                >
                  <CardContent className="p-4">
                    <span className="text-2xl mb-2 block">🎓</span>
                    <div className="text-sm font-bold text-foreground leading-tight">{cert.title_ko}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{cert.courseCount}개 과목 포함</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ═══ 4f. All Courses — Responsive Grid ═══ */}
        <section className="mb-6" id="courses">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">전체 과목</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {courses.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center text-muted-foreground text-sm">
                등록된 과목이 없습니다
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${locked ? "opacity-60" : ""}`}
                    onClick={() => !locked && navigate(`/institute/${course.id}`)}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-full aspect-video lg:aspect-[3/2]">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title_ko}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary/30 flex items-center justify-center relative">
                          <BookOpen className="w-10 h-10 text-primary-foreground/40" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 left-4 right-4">
                            <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">{course.title_ko}</h3>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          {hasCert && <Badge className="text-[9px] px-1.5 py-0">수료증</Badge>}
                          {locked && <Lock className="w-3 h-3 text-white/70" />}
                        </div>
                        <h3 className="text-base font-bold text-white leading-tight">{course.title_ko}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {instructorName && <span className="text-[11px] text-white/70">{instructorName}</span>}
                          <span className="text-[11px] text-white/50">·</span>
                          <span className="text-[11px] text-white/70">{totalModules}개 모듈</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer with progress + CTA */}
                    <CardContent className="p-3 lg:p-2">
                      {course.description_ko && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">{course.description_ko}</p>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">
                          {enrollment ? (enrollment.completed_at ? "수강 완료 ✓" : `${completed}/${totalModules}`) : "미시작"}
                        </span>
                      </div>
                      {/* 4e. CTA Button */}
                      {!locked && (
                        <Button
                          size="sm"
                          variant={enrollment?.completed_at ? "outline" : "default"}
                          className="w-full text-xs"
                          disabled={!!enrollment?.completed_at}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/institute/${course.id}`);
                          }}
                        >
                          {enrollment?.completed_at ? "완료됨 ✓" : enrollment ? "계속하기" : "시작하기"}
                        </Button>
                      )}
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
