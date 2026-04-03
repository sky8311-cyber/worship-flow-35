import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REVENUECAT-WEBHOOK] ${step}${d}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook authenticity
    const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
    const authHeader = req.headers.get("Authorization");

    if (webhookSecret && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      if (token !== webhookSecret) {
        logStep("Invalid webhook secret");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const event = body.event;

    if (!event) {
      return new Response(JSON.stringify({ error: "No event in body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType = event.type;
    const appUserId = event.app_user_id; // This is the Supabase user ID
    const productId = event.product_id;
    const expirationDate = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

    logStep("Received event", { eventType, appUserId, productId });

    if (!appUserId) {
      logStep("No app_user_id, skipping");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Determine which table to update based on product
    const isChurchProduct = productId?.includes("community_account");
    const isPremiumProduct = productId?.includes("full_membership");

    if (isPremiumProduct) {
      await handlePremiumEvent(supabase, eventType, appUserId, expirationDate);
    } else if (isChurchProduct) {
      await handleChurchEvent(supabase, eventType, appUserId, expirationDate);
    } else {
      logStep("Unknown product, attempting premium update", { productId });
      await handlePremiumEvent(supabase, eventType, appUserId, expirationDate);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handlePremiumEvent(
  supabase: any,
  eventType: string,
  userId: string,
  expirationDate: string | null
) {
  logStep("Handling premium event", { eventType, userId });

  const statusMap: Record<string, string> = {
    INITIAL_PURCHASE: "active",
    RENEWAL: "active",
    PRODUCT_CHANGE: "active",
    CANCELLATION: "canceled",
    EXPIRATION: "expired",
    BILLING_ISSUE: "past_due",
    SUBSCRIBER_ALIAS: "active",
  };

  const newStatus = statusMap[eventType] || "active";

  // Upsert into premium_subscriptions
  const { error } = await supabase
    .from("premium_subscriptions")
    .upsert(
      {
        user_id: userId,
        subscription_status: newStatus,
        current_period_end: expirationDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    logStep("Error updating premium_subscriptions", { error: error.message });
    throw error;
  }

  logStep("Premium subscription updated", { userId, newStatus });
}

async function handleChurchEvent(
  supabase: any,
  eventType: string,
  userId: string,
  expirationDate: string | null
) {
  logStep("Handling church event", { eventType, userId });

  const statusMap: Record<string, string> = {
    INITIAL_PURCHASE: "active",
    RENEWAL: "active",
    PRODUCT_CHANGE: "active",
    CANCELLATION: "canceled",
    EXPIRATION: "expired",
    BILLING_ISSUE: "past_due",
  };

  const newStatus = statusMap[eventType] || "active";

  // Find church account owned by this user
  const { data: church, error: findError } = await supabase
    .from("church_accounts")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (findError) {
    logStep("Error finding church account", { error: findError.message });
    throw findError;
  }

  if (!church) {
    logStep("No church account found for user", { userId });
    return;
  }

  const { error } = await supabase
    .from("church_accounts")
    .update({
      subscription_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", church.id);

  if (error) {
    logStep("Error updating church_accounts", { error: error.message });
    throw error;
  }

  logStep("Church account updated", { churchId: church.id, newStatus });
}
