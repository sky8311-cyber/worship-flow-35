import { useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailComposer } from "@/components/admin/email/EmailComposer";
import { TemplateLibrary } from "@/components/admin/email/TemplateLibrary";
import { EmailLogs } from "@/components/admin/email/EmailLogs";
import { useTranslation } from "@/hooks/useTranslation";
import { Mail, FileText, History } from "lucide-react";

const AdminEmail = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("compose");

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6" />
            {t("adminEmail.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("adminEmail.description")}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t("adminEmail.tabs.compose")}
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t("adminEmail.tabs.templates")}
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              {t("adminEmail.tabs.sendHistory")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose">
            <EmailComposer />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateLibrary />
          </TabsContent>

          <TabsContent value="logs">
            <EmailLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminEmail;
