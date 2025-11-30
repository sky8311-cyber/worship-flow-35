import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  MoreVertical, 
  Pencil, 
  Calendar, 
  Trash2, 
  RefreshCw,
  Clock,
  Users,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { getComponentLabel, WorshipComponentType } from "@/lib/worshipComponents";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    service_name: string | null;
    community_id: string | null;
    is_recurring: boolean | null;
    template_components: Array<{
      id: string;
      component_type: string;
      label: string;
      position: number;
    }>;
    recurring_schedules: Array<{
      id: string;
      pattern: string;
      days_of_week: number[] | null;
      create_days_before: number | null;
      is_active: boolean | null;
    }>;
    worship_communities: {
      name: string;
    } | null;
  };
  onEditTemplate: () => void;
  onEditRecurring: () => void;
  onRefetch: () => void;
}

export const TemplateCard = ({
  template,
  onEditTemplate,
  onEditRecurring,
  onRefetch,
}: TemplateCardProps) => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [showDeleteTemplate, setShowDeleteTemplate] = useState(false);
  const [showDeleteRecurring, setShowDeleteRecurring] = useState(false);

  const recurringSchedule = template.recurring_schedules?.[0];

  const deleteTemplateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("worship_set_templates")
        .delete()
        .eq("id", template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "템플릿이 삭제되었습니다" : "Template deleted");
      queryClient.invalidateQueries({ queryKey: ["worship-templates"] });
      onRefetch();
    },
    onError: () => {
      toast.error(language === "ko" ? "삭제 실패" : "Delete failed");
    },
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: async () => {
      if (!recurringSchedule) return;
      
      // Delete recurring schedule
      const { error: scheduleError } = await supabase
        .from("recurring_schedules")
        .delete()
        .eq("id", recurringSchedule.id);
      if (scheduleError) throw scheduleError;

      // Update template is_recurring flag
      const { error: templateError } = await supabase
        .from("worship_set_templates")
        .update({ is_recurring: false })
        .eq("id", template.id);
      if (templateError) throw templateError;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "반복 일정이 삭제되었습니다" : "Recurring schedule deleted");
      queryClient.invalidateQueries({ queryKey: ["worship-templates"] });
      onRefetch();
    },
    onError: () => {
      toast.error(language === "ko" ? "삭제 실패" : "Delete failed");
    },
  });

  const getPatternLabel = (pattern: string) => {
    const patterns: Record<string, { ko: string; en: string }> = {
      daily: { ko: "매일", en: "Daily" },
      weekly: { ko: "매주", en: "Weekly" },
      biweekly: { ko: "격주", en: "Biweekly" },
      monthly: { ko: "매월", en: "Monthly" },
      weekdays: { ko: "평일", en: "Weekdays" },
      nth_weekday: { ko: "매월 n번째 요일", en: "Nth weekday" },
    };
    return patterns[pattern]?.[language] || pattern;
  };

  const getDayLabels = (days: number[] | null) => {
    if (!days || days.length === 0) return "";
    const dayNames = language === "ko" 
      ? ["일", "월", "화", "수", "목", "금", "토"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map(d => dayNames[d]).join(", ");
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Template Name */}
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <h3 className="font-semibold truncate">{template.name}</h3>
              </div>

              {/* Community */}
              {template.worship_communities && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>{template.worship_communities.name}</span>
                </div>
              )}

              {/* Recurring Info */}
              {recurringSchedule && recurringSchedule.is_active ? (
                <div className="flex items-center gap-1.5 text-sm text-primary mb-2">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {getPatternLabel(recurringSchedule.pattern)}
                    {recurringSchedule.days_of_week && recurringSchedule.days_of_week.length > 0 && (
                      <> • {getDayLabels(recurringSchedule.days_of_week)}</>
                    )}
                    {recurringSchedule.create_days_before && (
                      <> • {recurringSchedule.create_days_before}
                        {language === "ko" ? "일 전 생성" : " days before"}
                      </>
                    )}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{language === "ko" ? "반복 설정 없음" : "No recurring schedule"}</span>
                </div>
              )}

              {/* Components */}
              {template.template_components.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {template.template_components
                    .sort((a, b) => a.position - b.position)
                    .slice(0, 6)
                    .map((comp) => (
                      <span
                        key={comp.id}
                        className="text-xs bg-muted px-2 py-0.5 rounded-full"
                      >
                        {getComponentLabel(comp.component_type as WorshipComponentType, language)}
                      </span>
                    ))}
                  {template.template_components.length > 6 && (
                    <span className="text-xs text-muted-foreground">
                      +{template.template_components.length - 6}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEditTemplate}>
                  <Pencil className="w-4 h-4 mr-2" />
                  {language === "ko" ? "템플릿 수정" : "Edit Template"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEditRecurring}>
                  <Calendar className="w-4 h-4 mr-2" />
                  {recurringSchedule 
                    ? (language === "ko" ? "반복 일정 수정" : "Edit Recurring")
                    : (language === "ko" ? "반복 일정 설정" : "Set Recurring")
                  }
                </DropdownMenuItem>
                {recurringSchedule && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteRecurring(true)}
                      className="text-orange-600"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {language === "ko" ? "반복 일정만 삭제" : "Delete Recurring Only"}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteTemplate(true)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === "ko" ? "템플릿 삭제" : "Delete Template"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Delete Template Confirmation */}
      <AlertDialog open={showDeleteTemplate} onOpenChange={setShowDeleteTemplate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ko" ? "템플릿 삭제" : "Delete Template"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ko" 
                ? `"${template.name}" 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
                : `Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "ko" ? "취소" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplateMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === "ko" ? "삭제" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Recurring Only Confirmation */}
      <AlertDialog open={showDeleteRecurring} onOpenChange={setShowDeleteRecurring}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ko" ? "반복 일정 삭제" : "Delete Recurring Schedule"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ko" 
                ? "반복 일정만 삭제하고 템플릿은 유지합니다. 계속하시겠습니까?"
                : "This will delete only the recurring schedule and keep the template. Continue?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "ko" ? "취소" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRecurringMutation.mutate()}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {language === "ko" ? "반복 일정 삭제" : "Delete Recurring"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
