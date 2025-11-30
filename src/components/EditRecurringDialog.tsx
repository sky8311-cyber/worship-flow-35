import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

interface EditRecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    id: string;
    name: string;
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
  };
}

const DAYS_OF_WEEK = [
  { value: 0, labelKo: "일요일", labelEn: "Sunday" },
  { value: 1, labelKo: "월요일", labelEn: "Monday" },
  { value: 2, labelKo: "화요일", labelEn: "Tuesday" },
  { value: 3, labelKo: "수요일", labelEn: "Wednesday" },
  { value: 4, labelKo: "목요일", labelEn: "Thursday" },
  { value: 5, labelKo: "금요일", labelEn: "Friday" },
  { value: 6, labelKo: "토요일", labelEn: "Saturday" },
];

const PATTERNS = [
  { value: "weekly", labelKo: "매주", labelEn: "Weekly" },
  { value: "biweekly", labelKo: "격주", labelEn: "Biweekly" },
  { value: "monthly", labelKo: "매월 (날짜)", labelEn: "Monthly (by date)" },
  { value: "nth_weekday", labelKo: "매월 (n번째 요일)", labelEn: "Monthly (nth weekday)" },
];

export const EditRecurringDialog = ({
  open,
  onOpenChange,
  template,
}: EditRecurringDialogProps) => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();

  const existingSchedule = template.recurring_schedules?.[0];

  const [isActive, setIsActive] = useState(existingSchedule?.is_active ?? true);
  const [pattern, setPattern] = useState(existingSchedule?.pattern || "weekly");
  const [startDate, setStartDate] = useState(
    existingSchedule?.start_date || new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(existingSchedule?.end_date || "");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    existingSchedule?.days_of_week || [0]
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    existingSchedule?.day_of_month?.toString() || "1"
  );
  const [nthWeekday, setNthWeekday] = useState(
    existingSchedule?.nth_weekday?.toString() || "1"
  );
  const [weekdayForNth, setWeekdayForNth] = useState(
    existingSchedule?.weekday_for_nth?.toString() || "0"
  );
  const [createDaysBefore, setCreateDaysBefore] = useState(
    existingSchedule?.create_days_before?.toString() || "5"
  );
  const [createAtTime, setCreateAtTime] = useState(
    existingSchedule?.create_at_time || "09:00"
  );

  useEffect(() => {
    if (existingSchedule) {
      setIsActive(existingSchedule.is_active ?? true);
      setPattern(existingSchedule.pattern);
      setStartDate(existingSchedule.start_date);
      setEndDate(existingSchedule.end_date || "");
      setDaysOfWeek(existingSchedule.days_of_week || [0]);
      setDayOfMonth(existingSchedule.day_of_month?.toString() || "1");
      setNthWeekday(existingSchedule.nth_weekday?.toString() || "1");
      setWeekdayForNth(existingSchedule.weekday_for_nth?.toString() || "0");
      setCreateDaysBefore(existingSchedule.create_days_before?.toString() || "5");
      setCreateAtTime(existingSchedule.create_at_time || "09:00");
    }
  }, [existingSchedule]);

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const scheduleData = {
        template_id: template.id,
        is_active: isActive,
        pattern,
        start_date: startDate,
        end_date: endDate || null,
        days_of_week: (pattern === "weekly" || pattern === "biweekly") ? daysOfWeek : null,
        day_of_month: pattern === "monthly" ? parseInt(dayOfMonth) : null,
        nth_weekday: pattern === "nth_weekday" ? parseInt(nthWeekday) : null,
        weekday_for_nth: pattern === "nth_weekday" ? parseInt(weekdayForNth) : null,
        create_days_before: parseInt(createDaysBefore),
        create_at_time: createAtTime,
      };

      if (existingSchedule) {
        // Update existing
        const { error } = await supabase
          .from("recurring_schedules")
          .update(scheduleData)
          .eq("id", existingSchedule.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("recurring_schedules")
          .insert(scheduleData);
        if (error) throw error;

        // Update template is_recurring flag
        const { error: templateError } = await supabase
          .from("worship_set_templates")
          .update({ is_recurring: true })
          .eq("id", template.id);
        if (templateError) throw templateError;
      }
    },
    onSuccess: () => {
      toast.success(
        language === "ko" 
          ? "반복 일정이 저장되었습니다" 
          : "Recurring schedule saved"
      );
      queryClient.invalidateQueries({ queryKey: ["worship-templates"] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error(language === "ko" ? "저장 실패" : "Save failed");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            {existingSchedule 
              ? (language === "ko" ? "반복 일정 수정" : "Edit Recurring Schedule")
              : (language === "ko" ? "반복 일정 설정" : "Set Recurring Schedule")
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <Label>{language === "ko" ? "활성화" : "Active"}</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* Pattern */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "반복 패턴" : "Pattern"}</Label>
            <Select value={pattern} onValueChange={setPattern}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PATTERNS.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    {language === "ko" ? p.labelKo : p.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Days of Week (for weekly/biweekly) */}
          {(pattern === "weekly" || pattern === "biweekly") && (
            <div className="space-y-2">
              <Label>{language === "ko" ? "요일 선택" : "Select Days"}</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={daysOfWeek.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDayOfWeek(day.value)}
                  >
                    {language === "ko" ? day.labelKo.slice(0, 1) : day.labelEn.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {pattern === "monthly" && (
            <div className="space-y-2">
              <Label>{language === "ko" ? "날짜" : "Day of Month"}</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
              />
            </div>
          )}

          {/* Nth Weekday (for nth_weekday) */}
          {pattern === "nth_weekday" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{language === "ko" ? "몇 번째" : "Which"}</Label>
                <Select value={nthWeekday} onValueChange={setNthWeekday}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{language === "ko" ? "첫 번째" : "First"}</SelectItem>
                    <SelectItem value="2">{language === "ko" ? "두 번째" : "Second"}</SelectItem>
                    <SelectItem value="3">{language === "ko" ? "세 번째" : "Third"}</SelectItem>
                    <SelectItem value="4">{language === "ko" ? "네 번째" : "Fourth"}</SelectItem>
                    <SelectItem value="-1">{language === "ko" ? "마지막" : "Last"}</SelectItem>
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
                    {DAYS_OF_WEEK.map(day => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {language === "ko" ? day.labelKo : day.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Start Date */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "시작일" : "Start Date"}</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date (optional) */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "종료일 (선택)" : "End Date (optional)"}</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Create Days Before */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{language === "ko" ? "생성 시점 (일 전)" : "Create Days Before"}</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={createDaysBefore}
                onChange={(e) => setCreateDaysBefore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "ko" ? "생성 시간" : "Create Time"}</Label>
              <Input
                type="time"
                value={createAtTime}
                onChange={(e) => setCreateAtTime(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {language === "ko" 
              ? `예배일 ${createDaysBefore}일 전 ${createAtTime}에 자동으로 임시저장 워십세트가 생성됩니다.`
              : `A draft worship set will be automatically created ${createDaysBefore} days before at ${createAtTime}.`
            }
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "ko" ? "취소" : "Cancel"}
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {language === "ko" ? "저장" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
