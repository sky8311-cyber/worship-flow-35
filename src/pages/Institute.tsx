import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserTier, canAccess } from "@/hooks/useUserTier";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, BookOpen, Lock, GraduationCap } from "lucide-react";

const Institute = () => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const { userTier } = useUserTier();

  // Certifications with course count
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
        if (cc.certification_id) {
          counts[cc.certification_id] = (counts[cc.certification_id] || 0) + 1;
        }
      });

      return (certs || []).map((c) => ({ ...c, courseCount: counts[c.id] || 0 }));
    },
  });

  // Published courses
  const { data: courses = [] } = useQuery({
    queryKey: ["institute-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_courses")
        .select("*")
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  // Instructors
  const { data: instructors = [] } = useQuery({
    queryKey: ["institute-instructors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_instructors")
        .select("user_id, display_name");
      if (error) throw error;
      return data || [];
    },
  });

  // Certification-course links
  const { data: certCourseLinks = [] } = useQuery({
    queryKey: ["institute-cert-course-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_certification_courses")
        .select("course_id");
      if (error) throw error;
      return data || [];
    },
  });
  const certCourseIds = new Set(certCourseLinks.map((l) => l.course_id));

  // User enrollments
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

  // Module counts per course
  const { data: moduleCounts = {} as Record<string, number> } = useQuery({
    queryKey: ["institute-module-counts", courses.map((c) => c.id).join(",")],
    queryFn: async () => {
      const courseIds = courses.map((c) => c.id);
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
    enabled: courses.length > 0,
  });

  const getInstructorName = (userId: string | null) => {
    if (!userId) return null;
    return instructors.find((i) => i.user_id === userId)?.display_name || null;
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <GraduationCap className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold">K-Worship Institute</h1>
        </div>

        {/* Certifications */}
        {certifications.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              {language === "ko" ? "자격증 프로그램" : "Certification Programs"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certifications.map((cert) => (
                <Link key={cert.id} to={`/institute/certification/${cert.id}`}>
                  <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer border-primary/20 hover:border-primary/40">
                    <div className="flex items-start gap-3">
                      {cert.badge_image_url ? (
                        <img src={cert.badge_image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Award className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{cert.title_ko}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {cert.courseCount}{language === "ko" ? "개 과목" : " courses"}
                        </p>
                        <p className="text-xs text-primary mt-1">
                          K-Worship Certified {language === "ko" ? "공식 자격 취득" : "Official Certification"}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Courses */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {language === "ko" ? "전체 과목" : "All Courses"}
          </h2>
          {courses.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              {language === "ko" ? "등록된 과목이 없습니다" : "No courses available yet"}
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <Link key={course.id} to={`/institute/${course.id}`}>
                    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                      <div className="aspect-video bg-muted relative">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                          </div>
                        )}
                        {locked && (
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="font-medium text-sm flex-1 line-clamp-2">{course.title_ko}</h3>
                        {instructorName && (
                          <p className="text-xs text-muted-foreground">{instructorName}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {hasCert && (
                            <Badge variant="secondary" className="text-xs">
                              <Award className="w-3 h-3 mr-1" />
                              {language === "ko" ? "수료증 발급 과정" : "Certificate Course"}
                            </Badge>
                          )}
                        </div>
                        {enrollment && !enrollment.completed_at && totalModules > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{enrollment.completed_modules || 0}/{totalModules}</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                          </div>
                        )}
                        {enrollment?.completed_at && (
                          <Badge variant="default" className="text-xs">
                            {language === "ko" ? "수강 완료" : "Completed"}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default Institute;
