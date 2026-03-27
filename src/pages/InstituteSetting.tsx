import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, UserCheck, Settings } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { AdminInstituteInstructors } from "@/components/institute/AdminInstituteInstructors";
import { AdminInstituteContentTree } from "@/components/institute/AdminInstituteContentTree";
import { AdminInstituteEnrollments } from "@/components/institute/AdminInstituteEnrollments";

const InstituteSetting = () => {
  const { language } = useTranslation();
  const navigate = useNavigate();

  const settingsBreadcrumb = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild><Link to="/institute">Institute</Link></BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{language === "ko" ? "설정" : "Settings"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <InstituteLayout showBackButton breadcrumb={settingsBreadcrumb}>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">
            {language === "ko" ? "Institute 설정" : "Institute Settings"}
          </h1>
        </div>

        <Tabs defaultValue="curriculum">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="curriculum" className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {language === "ko" ? "커리큘럼" : "Curriculum"}
            </TabsTrigger>
            <TabsTrigger value="instructors" className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {language === "ko" ? "강사" : "Instructors"}
            </TabsTrigger>
            <TabsTrigger value="enrollments" className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              {language === "ko" ? "수강생" : "Enrollments"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="curriculum">
            <AdminInstituteContentTree />
          </TabsContent>

          <TabsContent value="instructors">
            <AdminInstituteInstructors />
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
