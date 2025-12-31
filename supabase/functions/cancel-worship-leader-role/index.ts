import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error("Authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Cancelling worship leader role for user: ${user.id}`);

    // Use service role client to bypass RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Delete worship_leader role from user_roles
    const { error: deleteError } = await serviceClient
      .from("user_roles")
      .delete()
      .eq("user_id", user.id)
      .eq("role", "worship_leader");

    if (deleteError) {
      console.error("Error deleting worship_leader role:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete role", details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted worship_leader role for user: ${user.id}`);

    // Step 2: Update worship_leader_applications status to 'cancelled' to prevent re-sync
    const { error: updateError } = await serviceClient
      .from("worship_leader_applications")
      .update({ status: "cancelled" })
      .eq("user_id", user.id)
      .eq("status", "approved");

    if (updateError) {
      console.error("Error updating application status:", updateError);
      // Don't fail the whole operation, role is already deleted
      console.warn("Role deleted but application status update failed");
    } else {
      console.log(`Successfully updated application status to cancelled for user: ${user.id}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Worship leader role cancelled successfully" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
