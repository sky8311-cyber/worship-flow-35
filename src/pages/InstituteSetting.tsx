import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, UserCheck, Settings } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { AdminInstituteInstructors } from "@/components/institute/AdminInstituteInstructors";
import { AdminInstituteContentTree } from "@/components/institute/AdminInstituteContentTree";
import { AdminInstituteEnrollments } from "@/components/institute/AdminInstituteEnrollments";

const InstituteSetting = () => {
  const { language } = useTranslation();
  const navigate = useNavigate();

  return (
    <InstituteLayout showBackButton>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">
            {language === "ko" ? "Institute 설정" : "Institute Settings"}
          </h1>
        </div>

        <Tabs defaultValue="courses">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="courses" className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {language === "ko" ? "과목" : "Courses"}
            </TabsTrigger>
            <TabsTrigger value="instructors" className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {language === "ko" ? "강사" : "Instructors"}
            </TabsTrigger>
            <TabsTrigger value="certifications" className="flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              {language === "ko" ? "자격증" : "Certifications"}
            </TabsTrigger>
            <TabsTrigger value="enrollments" className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              {language === "ko" ? "수강생" : "Enrollments"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <AdminInstituteCourses />
          </TabsContent>

          <TabsContent value="instructors">
            <AdminInstituteInstructors />
          </TabsContent>

          <TabsContent value="certifications">
            <AdminInstituteCertifications />
          </TabsContent>

          <TabsContent value="enrollments">
            <AdminInstituteEnrollments />
          </TabsContent>
        </Tabs>
      </div>
    </InstituteLayout>
  );
};

export default InstituteSetting;
