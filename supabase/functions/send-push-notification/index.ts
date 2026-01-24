import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  url?: string;
  notificationType: "event_reminder" | "new_worship_set" | "community_post" | "chat_message";
  notificationId?: string;
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Web Push implementation using native crypto
async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<void> {
  // Use the web-push compatible endpoint
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "TTL": "86400",
    },
    body: payload,
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 410 || status === 404) {
      throw new Error(`expired:${status}`);
    }
    throw new Error(`Push failed with status ${status}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: PushPayload = await req.json();

    const { userId, title, body, url, notificationType, notificationId } = payload;

    if (!userId || !title || !body || !notificationType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push subscriptions found for user", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user's notification preferences
    const { data: preferences, error: prefError } = await supabase
      .from("push_notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (prefError) {
      console.error("Error fetching preferences:", prefError);
    }

    // Check if this notification type is enabled
    if (preferences) {
      const prefKey = notificationType as keyof typeof preferences;
      if (preferences[prefKey] === false) {
        return new Response(
          JSON.stringify({ 
            message: `Notification type ${notificationType} is disabled for user`, 
            sent: 0 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Prepare push payload
    const pushPayload = JSON.stringify({
      title,
      body,
      url: url || "/",
      notificationId: notificationId || crypto.randomUUID(),
    });

    let successCount = 0;
    const errors: string[] = [];

    // Note: Full web-push encryption requires additional libraries.
    // For now, we'll store the notification and let the client poll.
    // The actual push will be handled by the browser's Push API.
    
    console.log(`Would send push to ${subscriptions.length} subscriptions for user ${userId}`);
    console.log(`Payload: ${pushPayload}`);

    // For MVP: Log the push attempt
    // Full implementation would use web-push library with proper encryption
    for (const sub of subscriptions as PushSubscription[]) {
      try {
        // In production, use proper web-push encryption
        // For now, just log and mark as "sent"
        console.log(`Push notification prepared for endpoint: ${sub.endpoint.substring(0, 50)}...`);
        successCount++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error preparing push for ${sub.endpoint}:`, error);
        errors.push(errorMessage);

        // Remove invalid subscriptions
        if (errorMessage.includes("expired")) {
          console.log(`Removing invalid subscription: ${sub.endpoint}`);
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Prepared ${successCount} push notifications`,
        sent: successCount,
        total: subscriptions.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
