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

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Validate JWT and get user
    // NOTE: In edge runtime there is no persisted session storage, so getUser() must receive the JWT.
    if (!authHeader.startsWith("Bearer ")) {
      console.log("Invalid authorization header format");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.slice("Bearer ".length).trim();

    // Validate JWT using signing keys and extract claims (doesn't require a persisted session)
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.log("Failed to validate token:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    console.log(`Syncing worship leader role for user: ${userId}`);

    // Check if user has an approved application
    const { data: application, error: appError } = await supabase
      .from("worship_leader_applications")
      .select("id, status, church_name")
      .eq("user_id", userId)
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
      .eq("user_id", userId)
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
        user_id: userId,
        role: "worship_leader",
      });

    if (insertError) {
      console.log("Error inserting role:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to grant role" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully granted worship_leader role to user: ${userId}`);

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