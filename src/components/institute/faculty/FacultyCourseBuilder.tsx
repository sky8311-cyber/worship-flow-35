import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers } from "lucide-react";
import { FacultyModulePanel } from "./FacultyModulePanel";
import { FacultyChapterPanel } from "./FacultyChapterPanel";

export const FacultyCourseBuilder = () => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");

  const { data: courses = [] } = useQuery({
    queryKey: ["faculty-courses-list", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_courses")
        .select("id, title, title_ko")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  if (!selectedCourseId) {
    return (
      <div className="space-y-4">
        <div className="max-w-md">
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            {language === "ko" ? "코스 선택" : "Select Course"}
          </label>
          <Select onValueChange={setSelectedCourseId}>
            <SelectTrigger>
              <SelectValue placeholder={language === "ko" ? "코스를 선택하세요" : "Choose a course"} />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {language === "ko" ? c.title_ko : c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-center py-16 text-muted-foreground">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{language === "ko" ? "코스를 선택하면 모듈과 페이지를 관리할 수 있습니다" : "Select a course to manage modules and pages"}</p>
        </div>
      </div>
    );
  }

  const selectedCourse = courses.find((c: any) => c.id === selectedCourseId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={selectedCourseId} onValueChange={(v) => { setSelectedCourseId(v); setSelectedModuleId(""); }}>
          <SelectTrigger className="max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>
                {language === "ko" ? c.title_ko : c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4 min-h-[500px]">
        <FacultyModulePanel
          courseId={selectedCourseId}
          selectedModuleId={selectedModuleId}
          onSelectModule={setSelectedModuleId}
        />
        <div className="flex-1 min-w-0">
          {selectedModuleId ? (
            <FacultyChapterPanel
              courseId={selectedCourseId}
              moduleId={selectedModuleId}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              {language === "ko" ? "왼쪽에서 모듈을 선택하세요" : "Select a module from the left"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
