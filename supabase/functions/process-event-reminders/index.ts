import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  notification_enabled: boolean;
  notification_time: number; // minutes before
  community_id: string;
  created_by: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time in KST (UTC+9) as reference
    const now = new Date();
    
    // Get events that:
    // 1. Have notifications enabled
    // 2. Are happening within the notification window (event time - notification_time <= now)
    // 3. Haven't started yet (event datetime > now)
    // 4. Haven't already been notified (not in reminder_log)
    
    // First, get all events with notification enabled that are today or in the future
    const today = now.toISOString().split('T')[0];
    
    const { data: events, error: eventsError } = await supabase
      .from("calendar_events")
      .select("id, title, event_date, start_time, notification_enabled, notification_time, community_id, created_by")
      .eq("notification_enabled", true)
      .gte("event_date", today)
      .order("event_date", { ascending: true });

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw eventsError;
    }

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ message: "No events to process", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notificationsSent = 0;
    const processedEvents: string[] = [];

    for (const event of events as CalendarEvent[]) {
      // Calculate event datetime
      // If no start_time, default to 00:00 (start of day)
      const eventTime = event.start_time || "00:00:00";
      const eventDateTimeStr = `${event.event_date}T${eventTime}`;
      const eventDateTime = new Date(eventDateTimeStr);
      
      // Calculate notification time (when reminder should be sent)
      const notifyMinutes = event.notification_time || 60;
      const notifyDateTime = new Date(eventDateTime.getTime() - notifyMinutes * 60 * 1000);
      
      // Check if it's time to send the reminder
      // Reminder window: from notifyDateTime to eventDateTime
      if (now >= notifyDateTime && now < eventDateTime) {
        // Get community members to notify
        const { data: members, error: membersError } = await supabase
          .from("community_members")
          .select("user_id")
          .eq("community_id", event.community_id);

        if (membersError) {
          console.error(`Error fetching members for event ${event.id}:`, membersError);
          continue;
        }

        if (!members || members.length === 0) continue;

        // Check which users already received this reminder
        const { data: existingReminders, error: reminderError } = await supabase
          .from("event_reminder_log")
          .select("user_id")
          .eq("event_id", event.id);

        if (reminderError) {
          console.error(`Error fetching reminder log for event ${event.id}:`, reminderError);
          continue;
        }

        const alreadyNotified = new Set(existingReminders?.map(r => r.user_id) || []);
        
        // Get event creator info
        const { data: creatorProfile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", event.created_by)
          .single();

        // Get community name
        const { data: community } = await supabase
          .from("worship_communities")
          .select("name")
          .eq("id", event.community_id)
          .single();

        // Calculate time until event for message
        const minutesUntil = Math.round((eventDateTime.getTime() - now.getTime()) / (60 * 1000));
        let timeMessage = "";
        if (minutesUntil < 60) {
          timeMessage = `${minutesUntil}분 후`;
        } else if (minutesUntil < 1440) {
          const hours = Math.round(minutesUntil / 60);
          timeMessage = `${hours}시간 후`;
        } else {
          const days = Math.round(minutesUntil / 1440);
          timeMessage = `${days}일 후`;
        }

        for (const member of members) {
          // Skip if already notified
          if (alreadyNotified.has(member.user_id)) continue;

          // Insert notification
          const { error: notifError } = await supabase
            .from("notifications")
            .insert({
              user_id: member.user_id,
              type: "event_reminder",
              title: "일정 알림 / Event Reminder",
              message: `"${event.title}" 일정이 ${timeMessage} 시작됩니다. / "${event.title}" starts in ${timeMessage}.`,
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

          if (notifError) {
            console.error(`Error inserting notification for user ${member.user_id}:`, notifError);
            continue;
          }

          // Send push notification
          try {
            await supabase.functions.invoke("send-push-notification", {
              body: {
                userId: member.user_id,
                title: "📅 일정 알림",
                body: `"${event.title}" 일정이 ${timeMessage} 시작됩니다.`,
                url: "/dashboard",
                notificationType: "event_reminder",
                notificationId: event.id,
              },
            });
          } catch (pushError) {
            console.error(`Error sending push notification to user ${member.user_id}:`, pushError);
            // Don't fail the whole process if push fails
          }

          // Log the reminder to prevent duplicates
          const { error: logError } = await supabase
            .from("event_reminder_log")
            .insert({
              event_id: event.id,
              user_id: member.user_id,
            });

          if (logError) {
            console.error(`Error logging reminder for user ${member.user_id}:`, logError);
          }

          notificationsSent++;
        }

        processedEvents.push(event.id);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${processedEvents.length} events, sent ${notificationsSent} notifications`,
        processedEvents,
        notificationsSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in process-event-reminders:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
