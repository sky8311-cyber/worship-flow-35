import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, FileText, Play, Pause, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface CommunityRecurringCalendarTabProps {
  communityId: string;
}

export function CommunityRecurringCalendarTab({ communityId }: CommunityRecurringCalendarTabProps) {
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch recurring schedules for this community's templates
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["community-recurring-schedules", communityId],
    queryFn: async () => {
      // First get templates for this community
      const { data: templates, error: templateError } = await supabase
        .from("worship_set_templates")
        .select("id, name")
        .eq("community_id", communityId);

      if (templateError) throw templateError;
      if (!templates || templates.length === 0) return [];

      const templateIds = templates.map((t) => t.id);

      // Get recurring schedules for these templates
      const { data: schedulesData, error: schedulesError } = await supabase
        .from("recurring_schedules")
        .select("*")
        .in("template_id", templateIds)
        .order("created_at", { ascending: false });

      if (schedulesError) throw schedulesError;

      // Merge template names
      return (schedulesData || []).map((schedule) => ({
        ...schedule,
        template_name: templates.find((t) => t.id === schedule.template_id)?.name || "Unknown",
      }));
    },
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ scheduleId, isActive }: { scheduleId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("recurring_schedules")
        .update({ is_active: isActive })
        .eq("id", scheduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-recurring-schedules", communityId] });
      toast({ title: t("recurringCalendar.toggleSuccess") });
    },
    onError: (error: any) => {
      toast({
        title: t("recurringCalendar.toggleError"),
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  const getPatternLabel = (pattern: string) => {
    switch (pattern) {
      case "weekly":
        return language === "ko" ? "매주" : "Weekly";
      case "biweekly":
        return language === "ko" ? "격주" : "Biweekly";
      case "monthly":
        return language === "ko" ? "매월" : "Monthly";
      default:
        return pattern;
    }
  };

  const getDaysOfWeekLabel = (days: number[] | null) => {
    if (!days || days.length === 0) return "";
    const dayNames = language === "ko"
      ? ["일", "월", "화", "수", "목", "금", "토"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map((d) => dayNames[d]).join(", ");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "PPP", { locale: language === "ko" ? ko : enUS });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("common.loading")}
        </CardContent>
      </Card>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            {t("recurringCalendar.title")}
          </CardTitle>
          <CardDescription>{t("recurringCalendar.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">{t("recurringCalendar.noSchedules")}</p>
          <Button asChild variant="outline">
            <Link to="/templates">
              <FileText className="h-4 w-4 mr-2" />
              {t("recurringCalendar.goToTemplates")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          {t("recurringCalendar.title")}
        </CardTitle>
        <CardDescription>{t("recurringCalendar.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedules.map((schedule: any) => (
            <div
              key={schedule.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{schedule.template_name}</p>
                  <Badge variant={schedule.is_active ? "default" : "secondary"}>
                    {schedule.is_active
                      ? t("recurringCalendar.active")
                      : t("recurringCalendar.inactive")}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p>
                    <span className="font-medium">{t("recurringCalendar.pattern")}:</span>{" "}
                    {getPatternLabel(schedule.pattern)}
                    {schedule.days_of_week && schedule.days_of_week.length > 0 && (
                      <> ({getDaysOfWeekLabel(schedule.days_of_week)})</>
                    )}
                  </p>
                  <p>
                    <span className="font-medium">{t("recurringCalendar.nextGeneration")}:</span>{" "}
                    {formatDate(schedule.next_generation_date)}
                  </p>
                  {schedule.create_days_before && (
                    <p>
                      <span className="font-medium">{t("recurringCalendar.createBefore")}:</span>{" "}
                      {schedule.create_days_before} {t("recurringCalendar.daysBefore")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {schedule.is_active ? (
                    <Pause className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Play className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={schedule.is_active}
                    onCheckedChange={(checked) =>
                      toggleScheduleMutation.mutate({
                        scheduleId: schedule.id,
                        isActive: checked,
                      })
                    }
                    disabled={toggleScheduleMutation.isPending}
                  />
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/templates">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
