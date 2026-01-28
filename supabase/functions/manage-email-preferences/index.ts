import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPreferences {
  automated_reminders: boolean;
  community_updates: boolean;
  product_updates: boolean;
  marketing_emails: boolean;
}

interface RequestBody {
  action: "get" | "update";
  token: string;
  preferences?: EmailPreferences;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, token, preferences }: RequestBody = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find user by unsubscribe token
    const { data: prefData, error: prefError } = await supabase
      .from("email_preferences")
      .select("*")
      .eq("unsubscribe_token", token)
      .single();

    if (prefError || !prefData) {
      console.error("Token lookup error:", prefError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get") {
      // Return current preferences
      return new Response(
        JSON.stringify({
          success: true,
          preferences: {
            automated_reminders: prefData.automated_reminders,
            community_updates: prefData.community_updates,
            product_updates: prefData.product_updates,
            marketing_emails: prefData.marketing_emails,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "update" && preferences) {
      // Update preferences
      const { error: updateError } = await supabase
        .from("email_preferences")
        .update({
          automated_reminders: preferences.automated_reminders,
          community_updates: preferences.community_updates,
          product_updates: preferences.product_updates,
          marketing_emails: preferences.marketing_emails,
          updated_at: new Date().toISOString(),
        })
        .eq("unsubscribe_token", token);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update preferences" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Email preferences updated for token: ${token.substring(0, 8)}...`);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in manage-email-preferences:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
