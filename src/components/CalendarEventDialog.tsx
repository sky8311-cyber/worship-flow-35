import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "lucide-react";
import { toast } from "sonner";

interface CalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId?: string;
  eventId?: string;
  onSuccess?: () => void;
}

interface CalendarEventForm {
  community_id: string;
  title: string;
  description?: string;
  event_type: "rehearsal" | "meeting" | "worship_service" | "other";
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  notification_enabled: boolean;
  notification_time: number;
  rsvp_enabled: boolean;
}

export function CalendarEventDialog({
  open,
  onOpenChange,
  communityId,
  eventId,
  onSuccess,
}: CalendarEventDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CalendarEventForm>({
    defaultValues: {
      community_id: communityId || "",
      event_type: "rehearsal",
      notification_enabled: true,
      notification_time: 60,
      rsvp_enabled: false,
    },
  });

  // Fetch user's communities if no communityId provided
  const { data: userCommunities } = useQuery({
    queryKey: ["user-communities", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: memberData } = await supabase
        .from("community_members")
        .select("community_id, role")
        .eq("user_id", user.id);

      const communityIds = memberData?.map((m) => m.community_id) || [];
      if (communityIds.length === 0) return [];

      const { data: communities } = await supabase
        .from("worship_communities")
        .select("id, name")
        .in("id", communityIds);

      return communities || [];
    },
    enabled: !!user && !communityId,
  });

  useEffect(() => {
    if (communityId) {
      setValue("community_id", communityId);
    }
  }, [communityId, setValue]);

  const notificationEnabled = watch("notification_enabled");
  const rsvpEnabled = watch("rsvp_enabled");

  const onSubmit = async (data: CalendarEventForm) => {
    if (!user) {
      toast.error(t("common.error"));
      return;
    }

    if (!data.community_id) {
      toast.error(t("community.selectCommunity"));
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        ...data,
        created_by: user.id,
      };

      if (eventId) {
        const { error } = await supabase
          .from("calendar_events")
          .update(eventData)
          .eq("id", eventId);

        if (error) throw error;
        toast.success(t("calendarEvent.updated"));
      } else {
        const { error } = await supabase
          .from("calendar_events")
          .insert([eventData]);

        if (error) throw error;
        toast.success(t("calendarEvent.created"));
      }

      // Invalidate queries for real-time UI update
      await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      await queryClient.invalidateQueries({ queryKey: ["community-feed"] });

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {eventId ? t("calendarEvent.editEvent") : t("calendarEvent.createEvent")}
          </DialogTitle>
          <DialogDescription>
            {t("calendarEvent.description" as any) || "Create a new calendar event for your community"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Community Selection (if not provided) */}
          {!communityId && (
            <div className="space-y-2">
              <Label htmlFor="community_id">{t("community.title")}</Label>
              <Select
                value={watch("community_id")}
                onValueChange={(value) => setValue("community_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("community.selectCommunity")} />
                </SelectTrigger>
                <SelectContent>
                  {userCommunities?.map((community) => (
                    <SelectItem key={community.id} value={community.id}>
                      {community.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.community_id && <p className="text-sm text-destructive">{t("common.error")}</p>}
            </div>
          )}

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="event_type">{t("calendarEvent.eventType")}</Label>
            <Select
              value={watch("event_type")}
              onValueChange={(value) => setValue("event_type", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rehearsal">{t("calendarEvent.types.rehearsal")}</SelectItem>
                <SelectItem value="meeting">{t("calendarEvent.types.meeting")}</SelectItem>
                <SelectItem value="worship_service">{t("calendarEvent.types.worship_service")}</SelectItem>
                <SelectItem value="other">{t("calendarEvent.types.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t("calendarEvent.eventName")}</Label>
            <Input
              id="title"
              {...register("title", { required: true })}
              placeholder={t("calendarEvent.eventName")}
            />
            {errors.title && <p className="text-sm text-destructive">{t("common.error")}</p>}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">{t("calendarEvent.eventDate")}</Label>
              <Input
                id="event_date"
                type="date"
                {...register("event_date", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">{t("calendarEvent.startTime")}</Label>
              <Input
                id="start_time"
                type="time"
                {...register("start_time")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">{t("calendarEvent.endTime")}</Label>
              <Input
                id="end_time"
                type="time"
                {...register("end_time")}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">{t("calendarEvent.location")}</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder={t("calendarEvent.location")}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("calendarEvent.description")}</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={t("calendarEvent.description")}
              rows={3}
            />
          </div>

          {/* Notification Settings */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">{t("calendarEvent.notificationSettings")}</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="notification_enabled">{t("calendarEvent.enableNotification")}</Label>
              <Switch
                id="notification_enabled"
                checked={notificationEnabled}
                onCheckedChange={(checked) => setValue("notification_enabled", checked)}
              />
            </div>

            {notificationEnabled && (
              <div className="space-y-2">
                <Label htmlFor="notification_time">{t("calendarEvent.notificationTime")}</Label>
                <Select
                  value={watch("notification_time").toString()}
                  onValueChange={(value) => setValue("notification_time", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">{t("calendarEvent.notificationTimes.5")}</SelectItem>
                    <SelectItem value="15">{t("calendarEvent.notificationTimes.15")}</SelectItem>
                    <SelectItem value="30">{t("calendarEvent.notificationTimes.30")}</SelectItem>
                    <SelectItem value="60">{t("calendarEvent.notificationTimes.60")}</SelectItem>
                    <SelectItem value="120">{t("calendarEvent.notificationTimes.120")}</SelectItem>
                    <SelectItem value="1440">{t("calendarEvent.notificationTimes.1440")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* RSVP Settings */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">{t("calendarEvent.rsvpSettings" as any) || "RSVP Settings"}</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="rsvp_enabled">{t("calendarEvent.enableRsvp" as any) || "Enable RSVP"}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("calendarEvent.enableRsvpDesc" as any) || "Allow team members to respond with attendance"}
                </p>
              </div>
              <Switch
                id="rsvp_enabled"
                checked={rsvpEnabled}
                onCheckedChange={(checked) => setValue("rsvp_enabled", checked)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
