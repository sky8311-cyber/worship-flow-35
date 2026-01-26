import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  UserX, Users, Music, Save, Eye, Loader2, Clock, RefreshCw, ChevronDown, ChevronUp, Edit3
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { AutomatedEmailPreviewDialog } from "./AutomatedEmailPreviewDialog";
import { AutomatedEmailTemplatePreviewDialog } from "./AutomatedEmailTemplatePreviewDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AutomatedEmailConfig {
  id: string;
  email_type: string;
  enabled: boolean;
  subject_template: string;
  body_template: string;
  trigger_days: number;
  cooldown_days: number;
  schedule_hour: number;
  updated_at: string | null;
}

interface EmailTypeInfo {
  icon: React.ReactNode;
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
}

const emailTypeInfo: Record<string, EmailTypeInfo> = {
  inactive_user: {
    icon: <UserX className="w-5 h-5" />,
    title: "Inactive User Reminder",
    titleKo: "미접속자 리마인더",
    description: "Send to users who haven't logged in for a specified period",
    descriptionKo: "일정 기간 로그인하지 않은 사용자에게 발송",
  },
  no_team_invite: {
    icon: <Users className="w-5 h-5" />,
    title: "Team Invite Reminder",
    titleKo: "팀원 초대 리마인더",
    description: "Send to community owners who are alone in their community",
    descriptionKo: "혼자 운영 중인 커뮤니티 소유자에게 발송",
  },
  no_worship_set: {
    icon: <Music className="w-5 h-5" />,
    title: "Worship Set Reminder",
    titleKo: "워십세트 생성 리마인더",
    description: "Send to worship leaders who haven't created sets recently",
    descriptionKo: "세트를 만들지 않은 예배인도자에게 발송",
  },
};

// Generate hour options (0-23 in UTC, display in KST)
const hourOptions = Array.from({ length: 24 }, (_, i) => {
  const kstHour = (i + 9) % 24;
  return {
    value: i.toString(),
    label: `${kstHour.toString().padStart(2, "0")}:00 KST`,
  };
});

export const AutomatedEmailSettings = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [templatePreviewType, setTemplatePreviewType] = useState<string | null>(null);
  const [editedSettings, setEditedSettings] = useState<Record<string, Partial<AutomatedEmailConfig>>>({});

  // Fetch automated email settings
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["automated-email-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automated_email_settings")
        .select("*")
        .order("email_type");
      if (error) throw error;
      return data as AutomatedEmailConfig[];
    },
  });

  // Fetch last execution info
  const { data: lastExecution } = useQuery({
    queryKey: ["last-automated-email-execution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automated_email_log")
        .select("sent_at, email_type")
        .order("sent_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
  });

  // Fetch recipient counts for each type
  const { data: recipientCounts = {} } = useQuery({
    queryKey: ["automated-email-recipient-counts", settings, editedSettings],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const setting of settings) {
        const { data, error } = await supabase.rpc("get_automated_email_recipients", {
          p_email_type: setting.email_type,
          p_trigger_days: editedSettings[setting.email_type]?.trigger_days ?? setting.trigger_days,
          p_cooldown_days: editedSettings[setting.email_type]?.cooldown_days ?? setting.cooldown_days ?? 7,
        });
        counts[setting.email_type] = error ? 0 : (data?.length || 0);
      }
      return counts;
    },
    enabled: settings.length > 0,
  });

  // Update setting mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AutomatedEmailConfig> }) => {
      const { error } = await supabase
        .from("automated_email_settings")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "설정이 저장되었습니다" : "Settings saved");
      queryClient.invalidateQueries({ queryKey: ["automated-email-settings"] });
      queryClient.invalidateQueries({ queryKey: ["automated-email-recipient-counts"] });
      setEditedSettings({});
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  // Run now mutation
  const runNowMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke("process-automated-emails");
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      const inactiveCount = data.results?.inactive_user?.sent || 0;
      const teamInviteCount = data.results?.no_team_invite?.sent || 0;
      const worshipSetCount = data.results?.no_worship_set?.sent || 0;
      const total = inactiveCount + teamInviteCount + worshipSetCount;
      toast.success(
        language === "ko" 
          ? `자동 이메일 발송 완료: 총 ${total}명 (미접속 ${inactiveCount} + 팀초대 ${teamInviteCount} + 워십세트 ${worshipSetCount})`
          : `Automated emails sent: ${total} recipients (Inactive ${inactiveCount} + Team ${teamInviteCount} + Set ${worshipSetCount})`
      );
      queryClient.invalidateQueries({ queryKey: ["last-automated-email-execution"] });
      queryClient.invalidateQueries({ queryKey: ["automated-email-log"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to run automated emails");
    },
  });

  const toggleCard = (emailType: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(emailType)) {
      newExpanded.delete(emailType);
    } else {
      newExpanded.add(emailType);
    }
    setExpandedCards(newExpanded);
  };

  const handleToggleEnabled = (setting: AutomatedEmailConfig) => {
    updateMutation.mutate({
      id: setting.id,
      updates: { enabled: !setting.enabled },
    });
  };

  const handleSaveSettings = (setting: AutomatedEmailConfig) => {
    const updates = editedSettings[setting.email_type];
    if (!updates || Object.keys(updates).length === 0) {
      toast.info(language === "ko" ? "변경 사항이 없습니다" : "No changes to save");
      return;
    }
    updateMutation.mutate({ id: setting.id, updates });
  };

  const getEditedValue = <K extends keyof AutomatedEmailConfig>(
    setting: AutomatedEmailConfig,
    key: K
  ): AutomatedEmailConfig[K] => {
    return (editedSettings[setting.email_type]?.[key] ?? setting[key]) as AutomatedEmailConfig[K];
  };

  const updateEditedSetting = (emailType: string, key: keyof AutomatedEmailConfig, value: any) => {
    setEditedSettings((prev) => ({
      ...prev,
      [emailType]: {
        ...prev[emailType],
        [key]: value,
      },
    }));
  };

  const hasChanges = (emailType: string) => {
    const changes = editedSettings[emailType];
    return changes && Object.keys(changes).length > 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-72" />
                </div>
                <Skeleton className="w-12 h-6 rounded-full" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {language === "ko" ? "🤖 자동 발송 설정" : "🤖 Automated Email Settings"}
          </CardTitle>
          <CardDescription>
            {language === "ko"
              ? "자동 리마인더 이메일의 발송 조건과 템플릿을 관리합니다"
              : "Manage automated reminder emails, their triggers, and templates"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.map((setting) => {
            const info = emailTypeInfo[setting.email_type];
            const isExpanded = expandedCards.has(setting.email_type);
            const count = recipientCounts[setting.email_type] || 0;

            return (
              <Collapsible key={setting.id} open={isExpanded} onOpenChange={() => toggleCard(setting.email_type)}>
                <Card className={setting.enabled ? "" : "opacity-60"}>
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${setting.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {info?.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">
                              {language === "ko" ? info?.titleKo : info?.title}
                            </CardTitle>
                            <Badge variant={setting.enabled ? "default" : "secondary"} className="text-xs">
                              {setting.enabled ? (language === "ko" ? "활성" : "Active") : (language === "ko" ? "비활성" : "Inactive")}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs mt-0.5">
                            {language === "ko" ? info?.descriptionKo : info?.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">{count}</p>
                          <p className="text-xs text-muted-foreground">
                            {language === "ko" ? "대상" : "Recipients"}
                          </p>
                          <p className="text-xs text-primary">
                            {(() => {
                              const scheduleHour = getEditedValue(setting, "schedule_hour");
                              const now = new Date();
                              const next = new Date(now);
                              next.setUTCHours(scheduleHour, 0, 0, 0);
                              if (next <= now) next.setDate(next.getDate() + 1);
                              const kstHour = (scheduleHour + 9) % 24;
                              const isToday = next.toDateString() === now.toDateString();
                              return language === "ko"
                                ? `다음: ${isToday ? "오늘" : "내일"} ${kstHour.toString().padStart(2, "0")}:00`
                                : `Next: ${isToday ? "Today" : "Tomorrow"} ${kstHour.toString().padStart(2, "0")}:00 KST`;
                            })()}
                          </p>
                        </div>
                        <Switch
                          checked={setting.enabled}
                          onCheckedChange={() => handleToggleEnabled(setting)}
                          disabled={updateMutation.isPending}
                        />
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4 border-t">
                      <div className="grid gap-4 md:grid-cols-3 pt-4">
                        {/* Trigger Days */}
                        <div className="space-y-2">
                          <Label>
                            {language === "ko" ? "발송 조건 (일)" : "Trigger Days"}
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            max={365}
                            value={getEditedValue(setting, "trigger_days")}
                            onChange={(e) => updateEditedSetting(setting.email_type, "trigger_days", parseInt(e.target.value) || 1)}
                          />
                          <p className="text-xs text-muted-foreground">
                            {language === "ko"
                              ? `${getEditedValue(setting, "trigger_days")}일 이상 조건 충족 시`
                              : `After ${getEditedValue(setting, "trigger_days")} days`}
                          </p>
                        </div>

                        {/* Cooldown Days */}
                        <div className="space-y-2">
                          <Label>
                            {language === "ko" ? "발송 주기 (일)" : "Cooldown (days)"}
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            max={90}
                            value={getEditedValue(setting, "cooldown_days") || 7}
                            onChange={(e) => updateEditedSetting(setting.email_type, "cooldown_days", parseInt(e.target.value) || 7)}
                          />
                          <p className="text-xs text-muted-foreground">
                            {language === "ko"
                              ? `${getEditedValue(setting, "cooldown_days") || 7}일 내 재발송 안함`
                              : `No re-send within ${getEditedValue(setting, "cooldown_days") || 7} days`}
                          </p>
                        </div>

                        {/* Schedule Hour */}
                        <div className="space-y-2">
                          <Label>
                            {language === "ko" ? "발송 시간" : "Schedule Time"}
                          </Label>
                          <Select
                            value={getEditedValue(setting, "schedule_hour").toString()}
                            onValueChange={(val) => updateEditedSetting(setting.email_type, "schedule_hour", parseInt(val))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {hourOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {language === "ko" ? "매일 이 시간에 체크" : "Daily check time"}
                          </p>
                        </div>
                      </div>

                      {/* Subject Template */}
                      <div className="space-y-2">
                        <Label>
                          {language === "ko" ? "제목 템플릿" : "Subject Template"}
                        </Label>
                        <Input
                          value={getEditedValue(setting, "subject_template")}
                          onChange={(e) => updateEditedSetting(setting.email_type, "subject_template", e.target.value)}
                        />
                      </div>

                      {/* Body Template */}
                      <div className="space-y-2">
                        <Label>
                          {language === "ko" ? "본문 템플릿 (HTML)" : "Body Template (HTML)"}
                        </Label>
                        <Textarea
                          value={getEditedValue(setting, "body_template")}
                          onChange={(e) => updateEditedSetting(setting.email_type, "body_template", e.target.value)}
                          className="min-h-[200px] font-mono text-xs"
                        />
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="text-muted-foreground">
                            {language === "ko" ? "사용 가능 변수:" : "Variables:"}
                          </span>
                          <code className="px-1.5 py-0.5 bg-muted rounded">{"{{user_name}}"}</code>
                          <code className="px-1.5 py-0.5 bg-muted rounded">{"{{days}}"}</code>
                          <code className="px-1.5 py-0.5 bg-muted rounded">{"{{community_name}}"}</code>
                          <code className="px-1.5 py-0.5 bg-muted rounded">{"{{app_url}}"}</code>
                          <code className="px-1.5 py-0.5 bg-muted rounded">{"{{cta_url}}"}</code>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewType(setting.email_type)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {language === "ko" ? "수신자 보기" : "View Recipients"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTemplatePreviewType(setting.email_type)}
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            {language === "ko" ? "템플릿 미리보기" : "Preview Template"}
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSaveSettings(setting)}
                          disabled={updateMutation.isPending || !hasChanges(setting.email_type)}
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {language === "ko" ? "저장" : "Save"}
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>

      {/* Last Execution & Run Now */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === "ko" ? "마지막 실행" : "Last Execution"}
              </p>
              <p className="text-sm font-medium">
                {lastExecution?.sent_at
                  ? new Date(lastExecution.sent_at).toLocaleString(language === "ko" ? "ko-KR" : "en-US")
                  : (language === "ko" ? "기록 없음" : "No records")}
              </p>
            </div>
            <Button
              onClick={() => runNowMutation.mutate()}
              disabled={runNowMutation.isPending}
            >
              {runNowMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {language === "ko" ? "지금 실행" : "Run Now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recipients Preview Dialog */}
      <AutomatedEmailPreviewDialog
        open={!!previewType}
        onOpenChange={() => setPreviewType(null)}
        emailType={previewType || ""}
        triggerDays={
          previewType
            ? (editedSettings[previewType]?.trigger_days ?? settings.find((s) => s.email_type === previewType)?.trigger_days ?? 7)
            : 7
        }
        cooldownDays={
          previewType
            ? (editedSettings[previewType]?.cooldown_days ?? settings.find((s) => s.email_type === previewType)?.cooldown_days ?? 7)
            : 7
        }
      />

      {/* Template Preview Dialog - always render for proper close animation */}
      <AutomatedEmailTemplatePreviewDialog
        open={!!templatePreviewType}
        onOpenChange={(isOpen) => {
          if (!isOpen) setTemplatePreviewType(null);
        }}
        emailType={templatePreviewType || "inactive_user"}
        subject={
          templatePreviewType
            ? (editedSettings[templatePreviewType]?.subject_template 
                ?? settings.find((s) => s.email_type === templatePreviewType)?.subject_template 
                ?? "")
            : ""
        }
        body={
          templatePreviewType
            ? (editedSettings[templatePreviewType]?.body_template 
                ?? settings.find((s) => s.email_type === templatePreviewType)?.body_template 
                ?? "")
            : ""
        }
        triggerDays={
          templatePreviewType
            ? (editedSettings[templatePreviewType]?.trigger_days 
                ?? settings.find((s) => s.email_type === templatePreviewType)?.trigger_days 
                ?? 7)
            : 7
        }
      />
    </div>
  );
};
