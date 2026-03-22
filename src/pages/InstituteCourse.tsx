import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserTier, canAccess } from "@/hooks/useUserTier";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { Lock, Check } from "lucide-react";
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

  return (
    <InstituteLayout pageTitle={course.title_ko} showBackButton>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Hero */}
        <Card className="mb-6">
          <CardContent className="p-5 md:p-6">
            {certLink && (
              <Badge variant="secondary" className="mb-3">
                🎓 K-WORSHIP CERTIFIED
              </Badge>
            )}
            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
              {course.title_ko}
            </h1>
            {instructor?.display_name && (
              <div className="text-xs text-muted-foreground mt-1.5">{instructor.display_name}</div>
            )}
            {course.description_ko && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-2.5">{course.description_ko}</p>
            )}

            {/* CTA */}
            <div className="mt-5">
              {courseLocked ? (
                <div className="bg-muted border border-border rounded-lg p-4">
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
                </div>
              ) : enrollment ? (
                <Button
                  variant="outline"
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
          </CardContent>
        </Card>

        {/* Module list */}
        <div className="flex items-center gap-2.5 mb-4">
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap">
            {language === "ko" ? "커리큘럼" : "CURRICULUM"} ({modules.length})
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex flex-col gap-1">
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
                className={`flex items-center gap-3 py-3.5 border-b border-border ${
                  accessible && enrollment ? "cursor-pointer hover:bg-muted/50" : ""
                }`}
              >
                {/* Status indicator */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-foreground text-background"
                      : isLocked
                      ? "bg-muted text-muted-foreground border border-border opacity-40"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                    {language === "ko" ? mod.title_ko : mod.title}
                  </div>
                  {isLocked && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {mod.required_tier === 2 ? "정식멤버 이상" : mod.required_tier === 1 ? "기본멤버 이상" : "공동체계정"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </InstituteLayout>
  );
};

export default InstituteCourse;
