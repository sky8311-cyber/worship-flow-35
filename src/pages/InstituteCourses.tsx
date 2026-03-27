import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Lock, GraduationCap, BookOpen } from "lucide-react";

type CourseRow = {
  id: string;
  title_ko: string;
  description_ko: string | null;
  thumbnail_url: string | null;
  required_tier: number;
  sort_order: number | null;
};

type CertRow = {
  id: string;
  title: string;
  title_ko: string;
  description_ko: string | null;
  badge_name: string | null;
  badge_image_url: string | null;
  sort_order: number | null;
};

type CertCourseLink = {
  certification_id: string | null;
  course_id: string | null;
  sort_order: number | null;
};

type Enrollment = {
  course_id: string;
  completed_modules: number | null;
  completed_at: string | null;
};

// Determine course node state within a pathway
type NodeState = "completed" | "in-progress" | "not-started" | "locked";

function getNodeState(
  courseId: string,
  idx: number,
  pathwayCourseIds: string[],
  enrollmentMap: Map<string, Enrollment>
): NodeState {
  const enrollment = enrollmentMap.get(courseId);
  if (enrollment?.completed_at) return "completed";
  if (enrollment) return "in-progress";
  // Sequential unlock: first course is always unlocked, rest require previous completed
  if (idx === 0) return "not-started";
  const prevId = pathwayCourseIds[idx - 1];
  const prevEnrollment = enrollmentMap.get(prevId);
  if (prevEnrollment?.completed_at) return "not-started";
  return "locked";
}

// ─── Node circle component ───
function NodeCircle({ state, step }: { state: NodeState; step: number }) {
  if (state === "completed") {
    return (
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
        <Check className="w-3.5 h-3.5 text-primary-foreground" />
      </div>
    );
  }
  if (state === "in-progress") {
    return (
      <div className="w-8 h-8 rounded-full bg-foreground ring-2 ring-foreground flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-background">{step}</span>
      </div>
    );
  }
  if (state === "locked") {
    return (
      <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center flex-shrink-0">
        <Lock className="w-3 h-3 text-muted-foreground" />
      </div>
    );
  }
  // not-started
  return (
    <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-medium text-muted-foreground">{step}</span>
    </div>
  );
}

// ─── Connector line between nodes ───
function ConnectorLine({ nextLocked }: { nextLocked: boolean }) {
  return (
    <div className="ml-[15px] h-8">
      <div
        className={`h-full border-l-2 ${nextLocked ? "border-dashed border-border" : "border-solid border-border"}`}
      />
    </div>
  );
}

// ─── Loading skeleton ───
function PathwaySkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="h-6 w-48 mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 mb-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function InstituteCourses() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ─── Query A: Certifications + linked courses ───
  const { data: certifications = [], isLoading: loadingCerts } = useQuery({
    queryKey: ["curriculum-certifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_certifications")
        .select("*")
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as CertRow[];
    },
  });

  const { data: certCourseLinks = [], isLoading: loadingLinks } = useQuery({
    queryKey: ["curriculum-cert-course-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_certification_courses")
        .select("certification_id, course_id, sort_order")
        .order("sort_order");
      if (error) throw error;
      return (data || []) as CertCourseLink[];
    },
  });

  // ─── Query C: All published courses ───
  const { data: allCourses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ["curriculum-all-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_courses")
        .select("id, title_ko, description_ko, thumbnail_url, required_tier, sort_order")
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as CourseRow[];
    },
  });

  // Module counts per course
  const courseIds = allCourses.map((c) => c.id);
  const { data: moduleCounts = {} as Record<string, number> } = useQuery({
    queryKey: ["curriculum-module-counts", courseIds.join(",")],
    queryFn: async () => {
      if (courseIds.length === 0) return {};
      const { data, error } = await supabase
        .from("institute_modules")
        .select("course_id")
        .in("course_id", courseIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((m) => {
        counts[m.course_id] = (counts[m.course_id] || 0) + 1;
      });
      return counts;
    },
    enabled: courseIds.length > 0,
  });

  // ─── Query B: User enrollments ───
  const { data: enrollments = [] } = useQuery({
    queryKey: ["curriculum-enrollments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("institute_enrollments")
        .select("course_id, completed_modules, completed_at")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []) as Enrollment[];
    },
    enabled: !!user?.id,
  });
  const enrollmentMap = new Map(enrollments.map((e) => [e.course_id, e]));

  // ─── Derive data ───
  const courseMap = new Map(allCourses.map((c) => [c.id, c]));

  // Build pathway data
  const pathways = certifications.map((cert) => {
    const links = certCourseLinks
      .filter((l) => l.certification_id === cert.id && l.course_id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const courses = links
      .map((l) => courseMap.get(l.course_id!))
      .filter(Boolean) as CourseRow[];
    return { cert, courses };
  });

  // Courses in at least one pathway
  const pathwayCourseIdSet = new Set(
    certCourseLinks.map((l) => l.course_id).filter(Boolean) as string[]
  );
  const otherCourses = allCourses.filter((c) => !pathwayCourseIdSet.has(c.id));

  const isLoading = loadingCerts || loadingLinks || loadingCourses;

  // ─── Empty state ───
  if (!isLoading && certifications.length === 0 && allCourses.length === 0) {
    return (
      <InstituteLayout>
        <div className="container mx-auto px-4 py-6 max-w-5xl pb-24">
          <div className="text-center py-20">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">아직 등록된 과목이 없어요</p>
            <Button size="sm" onClick={() => navigate("/institute")}>
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </InstituteLayout>
    );
  }

  return (
    <InstituteLayout>
      <div className="container mx-auto px-4 py-6 max-w-5xl pb-24">
        {/* Page title */}
        <h1 className="text-lg font-bold text-foreground mb-6">커리큘럼</h1>

        {/* Loading skeletons */}
        {isLoading && (
          <>
            <PathwaySkeleton />
            <PathwaySkeleton />
          </>
        )}

        {/* ═══ Section A: Certification Pathways ═══ */}
        {!isLoading &&
          pathways.map(({ cert, courses }) => {
            if (courses.length === 0) return null;
            const pathwayIds = courses.map((c) => c.id);
            const completedCount = pathwayIds.filter(
              (id) => enrollmentMap.get(id)?.completed_at
            ).length;
            const totalCount = courses.length;
            const remaining = totalCount - completedCount;
            const allComplete = remaining === 0;

            return (
              <section key={cert.id} className="mb-10">
                {/* A1. Pathway header */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🎓</span>
                  <h2 className="text-base font-bold text-foreground">{cert.title_ko}</h2>
                  <Badge variant="secondary" className="text-[10px] ml-1">
                    {totalCount}개 과목
                  </Badge>
                </div>
                {cert.description_ko && (
                  <p className="text-xs text-muted-foreground mb-4 ml-7 leading-relaxed">
                    {cert.description_ko}
                  </p>
                )}

                {/* A2. Visual step tree */}
                <div className="ml-1">
                  {courses.map((course, idx) => {
                    const state = getNodeState(course.id, idx, pathwayIds, enrollmentMap);
                    const enrollment = enrollmentMap.get(course.id);
                    const total = moduleCounts[course.id] || 0;
                    const completed = enrollment?.completed_modules || 0;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                    const isLast = idx === courses.length - 1;
                    const nextState = !isLast
                      ? getNodeState(courses[idx + 1].id, idx + 1, pathwayIds, enrollmentMap)
                      : null;

                    return (
                      <div key={course.id}>
                        {/* Node row */}
                        <div className="flex items-start gap-3">
                          <NodeCircle state={state} step={idx + 1} />

                          {/* Course info — clickable */}
                          <div
                            className={`flex-1 min-w-0 ${state !== "locked" ? "cursor-pointer" : "opacity-60"}`}
                            onClick={() => state !== "locked" && navigate(`/institute/${course.id}`)}
                          >
                            <div className="text-sm font-semibold text-foreground leading-tight">
                              {course.title_ko}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {total}개 모듈
                            </div>
                            {enrollment && !enrollment.completed_at && total > 0 && (
                              <div className="flex items-center gap-2 mt-1.5">
                                <Progress value={pct} className="h-1.5 flex-1 max-w-[120px]" />
                                <span className="text-[10px] text-muted-foreground">
                                  {completed}/{total} 완료
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action/status */}
                          <div className="flex-shrink-0 pt-0.5">
                            {state === "completed" && (
                              <span className="text-[11px] text-muted-foreground">완료 ✓</span>
                            )}
                            {state === "in-progress" && (
                              <button
                                className="text-[11px] font-semibold text-primary bg-transparent border-none cursor-pointer p-0"
                                onClick={() => navigate(`/institute/${course.id}`)}
                              >
                                계속하기 →
                              </button>
                            )}
                            {state === "not-started" && (
                              <button
                                className="text-[11px] font-semibold text-primary bg-transparent border-none cursor-pointer p-0"
                                onClick={() => navigate(`/institute/${course.id}`)}
                              >
                                시작하기 →
                              </button>
                            )}
                            {state === "locked" && (
                              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Connector line */}
                        {!isLast && (
                          <ConnectorLine nextLocked={nextState === "locked"} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* A3. Badge goal card */}
                <Card className="mt-4">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {cert.badge_image_url ? (
                        <img
                          src={cert.badge_image_url}
                          alt={cert.title_ko}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-foreground">🏅 {cert.badge_name || cert.title_ko} 배지</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {completedCount}/{totalCount} 과목 완료
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {allComplete
                          ? "배지 획득 완료! 🎉"
                          : completedCount === 0
                            ? `지금 시작하면 ${cert.badge_name || cert.title_ko} 배지를 받을 수 있어요!`
                            : `배지까지 ${remaining}과목 남았어요! 🔥`}
                      </div>
                      {allComplete && (
                        <Button
                          size="sm"
                          className="mt-2 text-xs"
                          onClick={() => navigate(`/institute/certification/${cert.id}`)}
                        >
                          배지 신청하기
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>
            );
          })}

        {/* ═══ Section B: 기타 과목 ═══ */}
        {!isLoading && otherCourses.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                기타 과목
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherCourses.map((course) => {
                const enrollment = enrollmentMap.get(course.id);
                const total = moduleCounts[course.id] || 0;
                const completed = enrollment?.completed_modules || 0;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <Card
                    key={course.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/institute/${course.id}`)}
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
                        <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary/30 flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-primary-foreground/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-3">
                        <h3 className="text-base font-bold text-white leading-tight">{course.title_ko}</h3>
                        <span className="text-[11px] text-white/70">{total}개 모듈</span>
                      </div>
                    </div>
                    <CardContent className="p-3 lg:p-2">
                      {course.description_ko && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                          {course.description_ko}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">
                          {enrollment
                            ? enrollment.completed_at
                              ? "수강 완료 ✓"
                              : `${completed}/${total}`
                            : "미시작"}
                        </span>
                      </div>
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </InstituteLayout>
  );
}
