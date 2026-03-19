import { AdminLayout } from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, Award } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { AdminInstituteInstructors } from "@/components/institute/AdminInstituteInstructors";
import { AdminInstituteCourses } from "@/components/institute/AdminInstituteCourses";
import { AdminInstituteCertifications } from "@/components/institute/AdminInstituteCertifications";

const AdminInstitute = () => {
  const { language } = useTranslation();

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">K-Worship Institute</h1>
        </div>

        <Tabs defaultValue="courses">
          <TabsList>
            <TabsTrigger value="instructors" className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {language === "ko" ? "강사 관리" : "Instructors"}
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {language === "ko" ? "과목 관리" : "Courses"}
            </TabsTrigger>
            <TabsTrigger value="certifications" className="flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              {language === "ko" ? "Certification 관리" : "Certifications"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instructors">
            <AdminInstituteInstructors />
          </TabsContent>

          <TabsContent value="courses">
            <AdminInstituteCourses />
          </TabsContent>

          <TabsContent value="certifications">
            <AdminInstituteCertifications />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminInstitute;
