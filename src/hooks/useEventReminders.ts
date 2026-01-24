import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserCommunities } from "@/hooks/useUserCommunities";

/**
 * Hook that checks for upcoming calendar events and creates reminder notifications
 * when the notification time window is reached.
 * 
 * This runs on the client side when the user is on the dashboard,
 * checking for events that should trigger reminders.
 */
export function useEventReminders() {
  const { user } = useAuth();
  const { data: communitiesData } = useUserCommunities();
  const communityIds = communitiesData?.communityIds || [];
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only run once per session
    if (!user || communityIds.length === 0 || hasCheckedRef.current) return;
    
    const checkAndCreateReminders = async () => {
      try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        // Get upcoming events with notifications enabled in user's communities
        const { data: events, error: eventsError } = await supabase
          .from("calendar_events")
          .select("id, title, event_date, start_time, notification_enabled, notification_time, community_id, created_by")
          .in("community_id", communityIds)
          .eq("notification_enabled", true)
          .gte("event_date", today)
          .order("event_date", { ascending: true })
          .limit(20);

        if (eventsError || !events || events.length === 0) {
          hasCheckedRef.current = true;
          return;
        }

        // Check which events need reminders
        for (const event of events) {
          // Calculate event datetime
          const eventTime = event.start_time || "00:00:00";
          const eventDateTimeStr = `${event.event_date}T${eventTime}`;
          const eventDateTime = new Date(eventDateTimeStr);
          
          // Calculate notification time
          const notifyMinutes = event.notification_time || 60;
          const notifyDateTime = new Date(eventDateTime.getTime() - notifyMinutes * 60 * 1000);
          
          // Check if we're in the reminder window
          if (now >= notifyDateTime && now < eventDateTime) {
            // Check if this user already received this reminder
            const { data: existingReminder } = await supabase
              .from("event_reminder_log")
              .select("id")
              .eq("event_id", event.id)
              .eq("user_id", user.id)
              .single();

            if (existingReminder) continue; // Already reminded

            // Get community name for the notification
            const { data: community } = await supabase
              .from("worship_communities")
              .select("name")
              .eq("id", event.community_id)
              .single();

            // Get event creator info
            const { data: creatorProfile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", event.created_by)
              .single();

            // Calculate time until event
            const minutesUntil = Math.round((eventDateTime.getTime() - now.getTime()) / (60 * 1000));
            let timeMessage = "";
            let timeMessageEn = "";
            
            if (minutesUntil < 60) {
              timeMessage = `${minutesUntil}분 후`;
              timeMessageEn = `${minutesUntil} minutes`;
            } else if (minutesUntil < 1440) {
              const hours = Math.round(minutesUntil / 60);
              timeMessage = `${hours}시간 후`;
              timeMessageEn = `${hours} hour${hours > 1 ? 's' : ''}`;
            } else {
              const days = Math.round(minutesUntil / 1440);
              timeMessage = `${days}일 후`;
              timeMessageEn = `${days} day${days > 1 ? 's' : ''}`;
            }

            // Create notification
            const { error: notifError } = await supabase
              .from("notifications")
              .insert({
                user_id: user.id,
                type: "event_reminder",
                title: "일정 알림 / Event Reminder",
                message: `"${event.title}" 일정이 ${timeMessage} 시작됩니다. / Starts in ${timeMessageEn}.`,
                related_id: event.id,
                related_type: "calendar_event",
                metadata: {
                  event_title: event.title,
                  event_date: event.event_date,
                  event_time: event.start_time,
                  community_name: community?.name,
                  actor_name: creatorProfile?.full_name,
                  actor_avatar: creatorProfile?.avatar_url,
                },
              });

            if (!notifError) {
              // Log the reminder to prevent duplicates
              await supabase
                .from("event_reminder_log")
                .insert({
                  event_id: event.id,
                  user_id: user.id,
                });
            }
          }
        }
        
        hasCheckedRef.current = true;
      } catch (error) {
        console.error("Error checking event reminders:", error);
        hasCheckedRef.current = true;
      }
    };

    // Delay check to not block initial render
    const timer = setTimeout(checkAndCreateReminders, 2000);
    return () => clearTimeout(timer);
  }, [user, communityIds]);
}
