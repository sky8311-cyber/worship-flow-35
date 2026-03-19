import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserTier, canAccess, tierLabel } from "@/hooks/useUserTier";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, BookOpen, ChevronRight, ArrowLeft, Award } from "lucide-react";
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
      const { data, error } = await supabase
        .from("institute_courses")
        .select("*")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["institute-modules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_modules")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
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
        .from("institute_enrollments")
        .select("*")
        .eq("user_id", user!.id)
        .eq("course_id", courseId!)
        .maybeSingle();
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
        .eq("course_id", courseId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const enroll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("institute_enrollments").insert({
        user_id: user!.id,
        course_id: courseId!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institute-enrollment", user?.id, courseId] });
      queryClient.invalidateQueries({ queryKey: ["institute-enrollments"] });
      toast({ title: language === "ko" ? "수강 신청이 완료되었습니다" : "Successfully enrolled" });
      const firstAccessible = modules.find((m) => canAccess(m.required_tier, userTier));
      if (firstAccessible) {
        navigate(`/institute/${courseId}/${firstAccessible.id}`);
      }
    },
  });

  if (!course) return <AppLayout><div className="p-8 text-center text-muted-foreground">Loading...</div></AppLayout>;

  const courseLocked = !canAccess(course.required_tier, userTier);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/institute")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {language === "ko" ? "목록으로" : "Back"}
        </Button>

        <div className="mb-6">
          {course.thumbnail_url && (
            <img src={course.thumbnail_url} alt="" className="w-full aspect-video rounded-lg object-cover mb-4" />
          )}
          <h1 className="text-2xl font-bold mb-2">{course.title_ko}</h1>
          {instructor?.display_name && (
            <p className="text-sm text-muted-foreground mb-2">{instructor.display_name}</p>
          )}
          {certLink && (
            <Badge variant="secondary" className="mb-3">
              <Award className="w-3 h-3 mr-1" />
              {language === "ko" ? "수료증 발급 과정" : "Certificate Course"}
            </Badge>
          )}
          {course.description_ko && (
            <p className="text-sm text-muted-foreground leading-relaxed">{course.description_ko}</p>
          )}
        </div>

        {/* Enrollment CTA */}
        <Card className="p-4 mb-6">
          {courseLocked ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-5 h-5" />
                <span className="font-medium text-sm">
                  {course.required_tier === 2
                    ? language === "ko"
                      ? "이 과정은 정식멤버(Full Member)와 공동체계정(Community Account)에 포함되어 있습니다."
                      : "This course is included in Full Member and Community Account plans."
                    : course.required_tier === 1
                    ? language === "ko"
                      ? "이 과정은 기본멤버(Basic Member)부터 수강할 수 있습니다."
                      : "This course is available for Basic Member and above."
                    : language === "ko"
                    ? "이 과정은 공동체계정(Community Account)에서 이용 가능합니다."
                    : "This course is available for Community Account."}
                </span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={course.required_tier === 1 ? "/request-worship-leader" : "/membership"}>
                  {language === "ko" ? "자세히 보기" : "Learn more"}
                </Link>
              </Button>
            </div>
          ) : enrollment ? (
            <Button
              onClick={() => {
                const next = modules.find((m) => canAccess(m.required_tier, userTier));
                if (next) navigate(`/institute/${courseId}/${next.id}`);
              }}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {language === "ko" ? "이어서 수강" : "Continue Learning"}
            </Button>
          ) : (
            <Button onClick={() => enroll.mutate()} disabled={enroll.isPending}>
              <BookOpen className="w-4 h-4 mr-2" />
              {language === "ko" ? "수강 신청" : "Enroll"}
            </Button>
          )}
        </Card>

        {/* Module list */}
        <h2 className="text-lg font-semibold mb-3">
          {language === "ko" ? "커리큘럼" : "Curriculum"} ({modules.length})
        </h2>
        <div className="space-y-2">
          {modules.map((mod, idx) => {
            const accessible = canAccess(mod.required_tier, userTier);
            return (
              <Card
                key={mod.id}
                className={`p-4 ${accessible && enrollment ? "cursor-pointer hover:bg-muted/30" : ""} transition-colors`}
                onClick={() => {
                  if (accessible && enrollment) navigate(`/institute/${courseId}/${mod.id}`);
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-6 text-center">{idx + 1}</span>
                  {accessible ? (
                    <>
                      <span className="flex-1 text-sm font-medium">
                        {language === "ko" ? mod.title_ko : mod.title}
                      </span>
                      {enrollment && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 text-sm text-muted-foreground">
                        {tierLabel(mod.required_tier, language)}
                      </span>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default InstituteCourse;
