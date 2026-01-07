import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TemplateCard } from "@/components/TemplateCard";
import { EditTemplateDialog } from "@/components/EditTemplateDialog";
import { EditRecurringDialog } from "@/components/EditRecurringDialog";

interface Template {
  id: string;
  name: string;
  service_name: string | null;
  community_id: string | null;
  worship_leader: string | null;
  band_name: string | null;
  theme: string | null;
  scripture_reference: string | null;
  target_audience: string | null;
  worship_duration: number | null;
  service_time: string | null;
  notes: string | null;
  is_recurring: boolean | null;
  created_at: string | null;
  template_components: Array<{
    id: string;
    component_type: string;
    label: string;
    position: number;
    duration_minutes: number | null;
    notes: string | null;
    default_assigned_to: string | null;
    default_content: string | null;
  }>;
  recurring_schedules: Array<{
    id: string;
    pattern: string;
    start_date: string;
    end_date: string | null;
    days_of_week: number[] | null;
    day_of_month: number | null;
    nth_weekday: number | null;
    weekday_for_nth: number | null;
    interval_value: number | null;
    create_days_before: number | null;
    create_at_time: string | null;
    is_active: boolean | null;
  }>;
  worship_communities: {
    name: string;
  } | null;
}

const TemplateManager = () => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const navigate = useNavigate();
  
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingRecurring, setEditingRecurring] = useState<Template | null>(null);

  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ["worship-templates-full", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("worship_set_templates")
        .select(`
          *,
          template_components(*),
          recurring_schedules(*),
          worship_communities(name)
        `)
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as Template[];
    },
    enabled: !!user,
  });

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
  };

  const handleEditRecurring = (template: Template) => {
    setEditingRecurring(template);
  };

  const handleDialogClose = () => {
    setEditingTemplate(null);
    setEditingRecurring(null);
    refetch();
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-soft">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {language === "ko" ? "템플릿 관리" : "Template Manager"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {language === "ko" 
                    ? "저장된 템플릿과 반복 일정을 관리합니다"
                    : "Manage saved templates and recurring schedules"}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/set-builder")}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              {language === "ko" ? "새 워십세트" : "New Set"}
            </Button>
          </div>


          {/* Templates List */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              {language === "ko" ? "로딩 중..." : "Loading..."}
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="space-y-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEditTemplate={() => handleEditTemplate(template)}
                  onEditRecurring={() => handleEditRecurring(template)}
                  onRefetch={refetch}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">
                {language === "ko" 
                  ? "저장된 템플릿이 없습니다"
                  : "No templates saved yet"}
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/set-builder")}
              >
                {language === "ko" ? "워십세트 만들기" : "Create Worship Set"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <EditTemplateDialog
          open={!!editingTemplate}
          onOpenChange={(open) => !open && handleDialogClose()}
          template={editingTemplate}
        />
      )}

      {/* Edit Recurring Dialog */}
      {editingRecurring && (
        <EditRecurringDialog
          open={!!editingRecurring}
          onOpenChange={(open) => !open && handleDialogClose()}
          template={editingRecurring}
        />
      )}
    </AppLayout>
  );
};

export default TemplateManager;
