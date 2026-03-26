import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Wrench, Upload, Users, Layers } from "lucide-react";
import { FacultyCourseBuilder } from "@/components/institute/faculty/FacultyCourseBuilder";
import { BulkUploadPanel } from "@/components/institute/faculty/BulkUploadPanel";

const InstituteFaculty = () => {
  const { user } = useAuth();
  const { language } = useTranslation();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["faculty-courses", user?.id],
    queryFn: async () => {
      // For now, fetch all courses (admin sees all; later filter by instructor_user_id)
      const { data, error } = await supabase
        .from("institute_courses")
        .select("*, institute_modules(id)")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: enrollmentCounts = {} } = useQuery({
    queryKey: ["faculty-enrollment-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_enrollments")
        .select("course_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((e) => {
        counts[e.course_id] = (counts[e.course_id] || 0) + 1;
      });
      return counts;
    },
  });

  return (
    <InstituteLayout pageTitle="Faculty Dashboard">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Faculty Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              {language === "ko" ? "코스 및 콘텐츠 관리" : "Manage courses & content"}
            </p>
          </div>
        </div>

        <Tabs defaultValue="courses">
          <TabsList>
            <TabsTrigger value="courses" className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {language === "ko" ? "내 코스" : "My Courses"}
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              {language === "ko" ? "코스 빌더" : "Course Builder"}
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-1.5">
              <Upload className="w-4 h-4" />
              {language === "ko" ? "벌크 업로드" : "Bulk Upload"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {language === "ko" ? "담당 코스가 없습니다" : "No courses assigned"}
              </div>
            ) : (
              <div className="grid gap-3">
                {courses.map((course: any) => {
                  const moduleCount = course.institute_modules?.length || 0;
                  const studentCount = enrollmentCounts[course.id] || 0;

                  return (
                    <Card key={course.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4 flex items-center gap-4">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt=""
                            className="w-20 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-foreground truncate">
                            {language === "ko" ? course.title_ko : course.title}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {moduleCount} {language === "ko" ? "모듈" : "modules"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {studentCount} {language === "ko" ? "수강생" : "students"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={course.is_published ? "default" : "secondary"} className="text-[10px]">
                            {course.is_published
                              ? language === "ko" ? "공개" : "Published"
                              : language === "ko" ? "비공개" : "Draft"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="builder" className="mt-4">
            <FacultyCourseBuilder />
          </TabsContent>

          <TabsContent value="bulk" className="mt-4">
            <BulkUploadPanel />
          </TabsContent>
        </Tabs>
      </div>
    </InstituteLayout>
  );
};

export default InstituteFaculty;
