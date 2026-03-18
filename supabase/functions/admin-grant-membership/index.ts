import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await adminSupabase.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminRole } = await adminSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, duration_days = 365, action = "grant" } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke") {
      // Revoke: set status to cancelled
      const { error } = await adminSupabase
        .from("premium_subscriptions")
        .update({
          subscription_status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, action: "revoked" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Grant: upsert premium subscription
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + duration_days);

    const { error } = await adminSupabase
      .from("premium_subscriptions")
      .upsert(
        {
          user_id,
          subscription_status: "active",
          current_period_end: periodEnd.toISOString(),
          stripe_customer_id: "manual_admin_grant",
          stripe_subscription_id: `manual_${Date.now()}`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, action: "granted", period_end: periodEnd.toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
