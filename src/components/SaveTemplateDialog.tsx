import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Calendar, Clock } from "lucide-react";

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    service_name: string;
    community_id: string;
    target_audience: string;
    worship_leader: string;
    band_name: string;
    scripture_reference: string;
    theme: string;
    worship_duration: string;
    service_time: string;
    notes: string;
  };
  components: Array<{
    component_type: string;
    label: string;
    notes?: string;
    duration_minutes?: number;
    assigned_to?: string;
    content?: string;
  }>;
}

export const SaveTemplateDialog = ({ open, onOpenChange, formData, components }: SaveTemplateDialogProps) => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  
  const [templateName, setTemplateName] = useState(formData.service_name || "");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState("weekly");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0]); // Sunday
  const [startDate, setStartDate] = useState("");
  const [endOption, setEndOption] = useState<"none" | "date" | "count">("none");
  const [endDate, setEndDate] = useState("");
  const [occurrenceCount, setOccurrenceCount] = useState("");
  const [createDaysBefore, setCreateDaysBefore] = useState("5");
  const [createAtTime, setCreateAtTime] = useState("09:00");
  const [nthWeekday, setNthWeekday] = useState("1");
  const [weekdayForNth, setWeekdayForNth] = useState("0");
  const [dayOfMonth, setDayOfMonth] = useState("1");

  const dayLabels = language === "ko" 
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const toggleDay = (day: number) => {
    setDaysOfWeek(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!templateName.trim()) throw new Error("템플릿 이름을 입력해주세요");
      
      // Create template
      const { data: template, error: templateError } = await supabase
        .from("worship_set_templates")
        .insert({
          created_by: user.id,
          community_id: formData.community_id || null,
          name: templateName,
          service_name: formData.service_name || null,
          target_audience: formData.target_audience || null,
          worship_leader: formData.worship_leader || null,
          band_name: formData.band_name || null,
          scripture_reference: formData.scripture_reference || null,
          theme: formData.theme || null,
          worship_duration: formData.worship_duration ? parseInt(formData.worship_duration) : null,
          service_time: formData.service_time || null,
          notes: formData.notes || null,
          is_recurring: isRecurring,
        })
        .select()
        .single();
      
      if (templateError) throw templateError;
      
      // Create template components
      if (components.length > 0) {
        const componentsData = components.map((comp, index) => ({
          template_id: template.id,
          position: index + 1,
          component_type: comp.component_type,
          label: comp.label,
          notes: comp.notes || null,
          duration_minutes: comp.duration_minutes || null,
          default_assigned_to: comp.assigned_to || null,
          default_content: comp.content || null,
        }));
        
        const { error: compError } = await supabase
          .from("template_components")
          .insert(componentsData);
        
        if (compError) throw compError;
      }
      
      // Create recurring schedule if enabled
      if (isRecurring && startDate) {
        const scheduleData: any = {
          template_id: template.id,
          pattern: recurringPattern,
          start_date: startDate,
          create_days_before: parseInt(createDaysBefore) || 5,
          create_at_time: createAtTime || "09:00",
          is_active: true,
        };
        
        // Set pattern-specific fields
        if (recurringPattern === "weekly" || recurringPattern === "biweekly") {
          scheduleData.days_of_week = daysOfWeek;
          scheduleData.interval_value = recurringPattern === "biweekly" ? 2 : 1;
        } else if (recurringPattern === "monthly") {
          scheduleData.day_of_month = parseInt(dayOfMonth);
        } else if (recurringPattern === "nth_weekday") {
          scheduleData.nth_weekday = parseInt(nthWeekday);
          scheduleData.weekday_for_nth = parseInt(weekdayForNth);
        } else if (recurringPattern === "weekdays") {
          scheduleData.days_of_week = [1, 2, 3, 4, 5]; // Mon-Fri
        }
        
        // Set end option
        if (endOption === "date" && endDate) {
          scheduleData.end_date = endDate;
        } else if (endOption === "count" && occurrenceCount) {
          scheduleData.occurrence_count = parseInt(occurrenceCount);
        }
        
        const { error: scheduleError } = await supabase
          .from("recurring_schedules")
          .insert(scheduleData);
        
        if (scheduleError) throw scheduleError;
      }
      
      return template;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "템플릿이 저장되었습니다" : "Template saved");
      queryClient.invalidateQueries({ queryKey: ["worship-templates"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            {language === "ko" ? "템플릿으로 저장" : "Save as Template"}
          </DialogTitle>
          <DialogDescription>
            {language === "ko" 
              ? "현재 예배 순서를 템플릿으로 저장하여 재사용할 수 있습니다"
              : "Save the current worship order as a reusable template"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">
              {language === "ko" ? "템플릿 이름 *" : "Template Name *"}
            </Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={language === "ko" ? "예: 주일 2부 예배" : "e.g., Sunday 2nd Service"}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="is-recurring" 
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
            />
            <Label htmlFor="is-recurring" className="cursor-pointer">
              {language === "ko" ? "반복 일정으로 설정" : "Set as recurring"}
            </Label>
          </div>

          {isRecurring && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                {language === "ko" ? "반복 설정" : "Recurrence Settings"}
              </div>

              <div className="space-y-2">
                <Label>{language === "ko" ? "반복 패턴" : "Pattern"}</Label>
                <Select value={recurringPattern} onValueChange={setRecurringPattern}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{language === "ko" ? "매일" : "Daily"}</SelectItem>
                    <SelectItem value="weekly">{language === "ko" ? "매주" : "Weekly"}</SelectItem>
                    <SelectItem value="biweekly">{language === "ko" ? "격주" : "Biweekly"}</SelectItem>
                    <SelectItem value="monthly">{language === "ko" ? "매월" : "Monthly"}</SelectItem>
                    <SelectItem value="weekdays">{language === "ko" ? "평일 (월-금)" : "Weekdays"}</SelectItem>
                    <SelectItem value="nth_weekday">{language === "ko" ? "매월 n번째 요일" : "Nth weekday of month"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(recurringPattern === "weekly" || recurringPattern === "biweekly") && (
                <div className="space-y-2">
                  <Label>{language === "ko" ? "요일 선택" : "Select Days"}</Label>
                  <div className="flex gap-1 flex-wrap">
                    {dayLabels.map((label, idx) => (
                      <Button
                        key={idx}
                        type="button"
                        variant={daysOfWeek.includes(idx) ? "default" : "outline"}
                        size="sm"
                        className="w-10 h-10"
                        onClick={() => toggleDay(idx)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {recurringPattern === "monthly" && (
                <div className="space-y-2">
                  <Label>{language === "ko" ? "매월 며칠" : "Day of month"}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                  />
                </div>
              )}

              {recurringPattern === "nth_weekday" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{language === "ko" ? "몇 번째" : "Which"}</Label>
                    <Select value={nthWeekday} onValueChange={setNthWeekday}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{language === "ko" ? "첫째" : "1st"}</SelectItem>
                        <SelectItem value="2">{language === "ko" ? "둘째" : "2nd"}</SelectItem>
                        <SelectItem value="3">{language === "ko" ? "셋째" : "3rd"}</SelectItem>
                        <SelectItem value="4">{language === "ko" ? "넷째" : "4th"}</SelectItem>
                        <SelectItem value="5">{language === "ko" ? "다섯째" : "5th"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ko" ? "요일" : "Weekday"}</Label>
                    <Select value={weekdayForNth} onValueChange={setWeekdayForNth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dayLabels.map((label, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>{language === "ko" ? "시작일" : "Start Date"}</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === "ko" ? "종료 조건" : "End"}</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="end-none"
                      name="end-option"
                      checked={endOption === "none"}
                      onChange={() => setEndOption("none")}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="end-none" className="cursor-pointer font-normal">
                      {language === "ko" ? "종료일 없음" : "No end date"}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="end-date"
                      name="end-option"
                      checked={endOption === "date"}
                      onChange={() => setEndOption("date")}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="end-date" className="cursor-pointer font-normal">
                      {language === "ko" ? "종료일:" : "End by:"}
                    </Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={endOption !== "date"}
                      className="w-40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="end-count"
                      name="end-option"
                      checked={endOption === "count"}
                      onChange={() => setEndOption("count")}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="end-count" className="cursor-pointer font-normal">
                      {language === "ko" ? "반복 횟수:" : "After:"}
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={occurrenceCount}
                      onChange={(e) => setOccurrenceCount(e.target.value)}
                      disabled={endOption !== "count"}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {language === "ko" ? "회" : "times"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  {language === "ko" ? "임시저장 생성 시점" : "Draft Creation Timing"}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={createDaysBefore}
                    onChange={(e) => setCreateDaysBefore(e.target.value)}
                    className="w-16"
                  />
                  <span className="text-sm">
                    {language === "ko" ? "일 전," : "days before,"}
                  </span>
                  <Input
                    type="time"
                    value={createAtTime}
                    onChange={(e) => setCreateAtTime(e.target.value)}
                    className="w-28"
                  />
                  <span className="text-sm">
                    {language === "ko" ? "시" : ""}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "ko" ? "취소" : "Cancel"}
          </Button>
          <Button onClick={() => saveTemplateMutation.mutate()} disabled={saveTemplateMutation.isPending}>
            {saveTemplateMutation.isPending
              ? (language === "ko" ? "저장 중..." : "Saving...")
              : (language === "ko" ? "템플릿 저장" : "Save Template")
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
