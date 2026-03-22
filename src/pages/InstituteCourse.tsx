import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserTier, canAccess } from "@/hooks/useUserTier";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { Lock, Check, BookOpen, Users, Award, Layers } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

  // Fetch chapter counts per module
  const { data: chapterCounts = {} as Record<string, number> } = useQuery({
    queryKey: ["institute-chapter-counts", modules.map(m => m.id).join(",")],
    queryFn: async () => {
      const moduleIds = modules.map(m => m.id);
      if (moduleIds.length === 0) return {};
      const { data, error } = await supabase.from("institute_chapters").select("module_id").in("module_id", moduleIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((c) => { counts[c.module_id!] = (counts[c.module_id!] || 0) + 1; });
      return counts;
    },
    enabled: modules.length > 0,
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
      <InstituteLayout pageTitle={language === "ko" ? "과목 상세" : "Course Detail"} showBackButton>
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      </InstituteLayout>
    );
  }

  const courseLocked = !canAccess(course.required_tier, userTier);
  const completedModules = enrollment?.completed_modules || 0;
  const pct = modules.length > 0 ? Math.round((completedModules / modules.length) * 100) : 0;

  return (
    <InstituteLayout pageTitle={course.title_ko} showBackButton>
      <div className="container mx-auto max-w-3xl">
        {/* ═══ Dark Hero Banner ═══ */}
        <div className="relative w-full" style={{ aspectRatio: "16/9", maxHeight: 240 }}>
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-foreground to-foreground/80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            {certLink && (
              <Badge className="mb-2 text-[9px]">🎓 K-WORSHIP CERTIFIED</Badge>
            )}
            <h1 className="text-xl font-bold text-white leading-tight">{course.title_ko}</h1>
            {instructor?.display_name && (
              <div className="text-xs text-white/70 mt-1">{instructor.display_name}</div>
            )}
          </div>
        </div>

        <div className="px-4 py-5">
          {/* ═══ Course Meta ═══ */}
          <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>{modules.length}개 모듈</span>
            </div>
            {instructor?.display_name && (
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>{instructor.display_name}</span>
              </div>
            )}
            {certLink && (
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-primary" />
                <span>수료증 발급</span>
              </div>
            )}
          </div>

          {/* Description */}
          {course.description_ko && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{course.description_ko}</p>
          )}

          {/* Progress bar for enrolled users */}
          {enrollment && (
            <div className="flex items-center gap-3 mb-4">
              <Progress value={pct} className="h-1.5 flex-1" />
              <span className="text-xs text-primary font-semibold">{completedModules}/{modules.length}</span>
            </div>
          )}

          {/* CTA */}
          <div className="mb-6">
            {courseLocked ? (
              <Card className="bg-muted">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      {course.required_tier === 2
                        ? "이 과정은 정식멤버(Full Member)와 공동체계정(Community Account)에 포함되어 있습니다."
                        : course.required_tier === 1
                        ? "이 과정은 기본멤버(Basic Member)부터 수강할 수 있습니다."
                        : "이 과정은 공동체계정(Community Account)에서 이용 가능합니다."}
                    </span>
                  </div>
                  <Link to={course.required_tier === 1 ? "/request-worship-leader" : "/membership"}>
                    <Button variant="outline" size="sm">
                      {language === "ko" ? "자세히 보기" : "Learn more"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : enrollment ? (
              <Button
                className="w-full"
                onClick={() => {
                  const next = modules.find((m) => canAccess(m.required_tier, userTier));
                  if (next) navigate(`/institute/${courseId}/${next.id}`);
                }}
              >
                {language === "ko" ? "이어서 수강하기" : "Continue Learning"}
              </Button>
            ) : (
              <Button className="w-full" onClick={() => enroll.mutate()} disabled={enroll.isPending}>
                {language === "ko" ? "수강 신청하기" : "Enroll Now"}
              </Button>
            )}
          </div>

          {/* ═══ Curriculum ═══ */}
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              커리큘럼
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex flex-col gap-1.5">
            {modules.map((mod, idx) => {
              const accessible = canAccess(mod.required_tier, userTier);
              const isCompleted = idx < completedModules;
              const isCurrent = idx === completedModules && !!enrollment;
              const isLocked = !accessible;
              const chapCount = chapterCounts[mod.id] || 0;

              return (
                <Card
                  key={mod.id}
                  onClick={() => {
                    if (accessible && enrollment) navigate(`/institute/${courseId}/${mod.id}`);
                  }}
                  className={`transition-shadow ${accessible && enrollment ? "cursor-pointer hover:shadow-sm" : ""} ${isLocked ? "opacity-50" : ""}`}
                >
                  <CardContent className="p-3.5 flex items-center gap-3">
                    {/* Status circle */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : isLocked ? <Lock className="w-3 h-3" /> : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                        {language === "ko" ? mod.title_ko : mod.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {chapCount > 0 ? `${chapCount}개 챕터` : ""}
                        {isLocked && (
                          <span className="ml-1">
                            · {mod.required_tier === 2 ? "정식멤버 이상" : mod.required_tier === 1 ? "기본멤버 이상" : "공동체계정"}
                          </span>
                        )}
                      </div>
                    </div>

                    {isCompleted && (
                      <span className="text-[10px] text-primary font-semibold">완료</span>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </InstituteLayout>
  );
};

export default InstituteCourse;
