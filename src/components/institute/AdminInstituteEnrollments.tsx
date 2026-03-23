import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, UserCheck, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const AdminInstituteEnrollments = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const { data: courses = [] } = useQuery({
    queryKey: ["institute-courses-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_courses")
        .select("id, title_ko, title")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["admin-institute-enrollments", courseFilter],
    queryFn: async () => {
      let query = supabase
        .from("institute_enrollments")
        .select("*, institute_courses(title_ko, title)")
        .order("enrolled_at", { ascending: false });

      if (courseFilter !== "all") {
        query = query.eq("course_id", courseFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profile info for each user
      const userIds = [...new Set((data || []).map((e) => e.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      return (data || []).map((e: any) => ({
        ...e,
        profile: profileMap.get(e.user_id),
      }));
    },
  });

  const deleteEnrollment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("institute_enrollments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institute-enrollments"] });
      toast({ title: language === "ko" ? "수강 취소됨" : "Enrollment removed" });
    },
  });

  const { data: moduleCounts = {} as Record<string, number> } = useQuery({
    queryKey: ["institute-module-counts-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_modules")
        .select("course_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((m) => {
        counts[m.course_id] = (counts[m.course_id] || 0) + 1;
      });
      return counts;
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            {language === "ko" ? "수강생 관리" : "Enrollment Management"}
          </CardTitle>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={language === "ko" ? "과목 필터" : "Filter by course"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === "ko" ? "전체 과목" : "All Courses"}
              </SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title_ko || c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {language === "ko" ? "로딩 중..." : "Loading..."}
          </p>
        ) : enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {language === "ko" ? "수강생이 없습니다" : "No enrollments found"}
          </p>
        ) : (
          <div className="space-y-2">
            {enrollments.map((enrollment: any) => {
              const totalModules = moduleCounts[enrollment.course_id] || 0;
              const completed = enrollment.completed_modules || 0;
              const isCompleted = !!enrollment.completed_at;

              return (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {enrollment.profile?.full_name || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {enrollment.profile?.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <BookOpen className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {enrollment.institute_courses?.title_ko || "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {completed}/{totalModules} modules
                      </span>
                      {isCompleted ? (
                        <Badge variant="default" className="text-[10px]">
                          {language === "ko" ? "수강 완료" : "Completed"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          {language === "ko" ? "진행 중" : "In Progress"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => deleteEnrollment.mutate(enrollment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
