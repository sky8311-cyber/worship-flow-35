import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract token from Bearer header
    const token = authHeader.replace("Bearer ", "");

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the current user using the token directly
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.log("Failed to get user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Syncing worship leader role for user: ${user.id}`);

    // Check if user has an approved application
    const { data: application, error: appError } = await supabase
      .from("worship_leader_applications")
      .select("id, status, church_name")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appError) {
      console.log("Error fetching application:", appError);
      return new Response(
        JSON.stringify({ error: "Failed to check application status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no approved application, nothing to sync
    if (!application) {
      console.log("No approved application found for user");
      return new Response(
        JSON.stringify({ synced: false, reason: "no_approved_application" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already has the worship_leader role
    const { data: existingRole, error: roleError } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "worship_leader")
      .maybeSingle();

    if (roleError) {
      console.log("Error checking existing role:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to check existing role" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If role already exists, nothing to do
    if (existingRole) {
      console.log("User already has worship_leader role");
      return new Response(
        JSON.stringify({ synced: false, reason: "already_has_role" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Grant the worship_leader role
    // Need to use service role for this operation
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: insertError } = await adminSupabase
      .from("user_roles")
      .insert({
        user_id: user.id,
        role: "worship_leader",
      });

    if (insertError) {
      console.log("Error inserting role:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to grant role" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully granted worship_leader role to user: ${user.id}`);

    return new Response(
      JSON.stringify({ 
        synced: true, 
        message: "Worship leader role granted successfully",
        churchName: application.church_name
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