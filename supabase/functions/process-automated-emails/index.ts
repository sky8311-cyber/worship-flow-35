import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = Deno.env.get("APP_URL") || "https://kworship.app";

interface AutomatedEmailSetting {
  id: string;
  email_type: string;
  enabled: boolean;
  subject_template: string;
  body_template: string;
  trigger_days: number;
  cooldown_days: number;
  schedule_hour: number;
}

interface Recipient {
  id: string;
  email: string;
  full_name: string | null;
  last_active_at: string | null;
  days_inactive: number;
  community_name: string | null;
}

// Helper to add delay for rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Replace template variables
function replaceVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
}

async function sendEmail(apiKey: string, to: string, subject: string, html: string, senderName: string = "Kworship"): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${senderName} <noreply@kworship.app>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch sender settings
    const { data: senderSettingsData } = await supabase
      .from("email_sender_settings")
      .select("*")
      .maybeSingle();
    
    const senderName = senderSettingsData?.sender_name || "Kworship";
    const signature = senderSettingsData?.auto_append_signature ? senderSettingsData.signature_html : "";

    // Fetch enabled automated email settings
    const { data: settings, error: settingsError } = await supabase
      .from("automated_email_settings")
      .select("*")
      .eq("enabled", true);

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw settingsError;
    }

    console.log(`Found ${settings?.length || 0} enabled automated email settings`);

    const results: Record<string, { processed: number; sent: number; errors: string[] }> = {};

    for (const setting of (settings as AutomatedEmailSetting[]) || []) {
      results[setting.email_type] = { processed: 0, sent: 0, errors: [] };

      console.log(`Processing ${setting.email_type} with ${setting.trigger_days} trigger days...`);

      // Get recipients using the RPC function with cooldown
      const { data: recipients, error: recipientsError } = await supabase.rpc(
        "get_automated_email_recipients",
        {
          p_email_type: setting.email_type,
          p_trigger_days: setting.trigger_days,
          p_cooldown_days: setting.cooldown_days || 7,
        }
      );

      if (recipientsError) {
        console.error(`Error fetching recipients for ${setting.email_type}:`, recipientsError);
        results[setting.email_type].errors.push(recipientsError.message);
        continue;
      }

      console.log(`Found ${recipients?.length || 0} recipients for ${setting.email_type}`);

      // Filter out users who opted out of automated reminders
      const { data: optedOutUsers } = await supabase
        .from("email_preferences")
        .select("user_id")
        .eq("automated_reminders", false);
      
      const optedOutIds = new Set((optedOutUsers || []).map((u: any) => u.user_id));
      const filteredRecipients = (recipients || []).filter((r: Recipient) => !optedOutIds.has(r.id));
      
      console.log(`After opt-out filtering: ${filteredRecipients.length} recipients (${(recipients?.length || 0) - filteredRecipients.length} opted out)`);

      for (const recipient of filteredRecipients) {
        results[setting.email_type].processed++;

        try {
          // Get unsubscribe token for this user
          const { data: prefData } = await supabase
            .from("email_preferences")
            .select("unsubscribe_token")
            .eq("user_id", recipient.id)
            .single();
          
          const unsubscribeToken = prefData?.unsubscribe_token || "";
          const unsubscribeUrl = unsubscribeToken ? `${APP_URL}/email-preferences?token=${unsubscribeToken}` : APP_URL;
          const preferencesUrl = unsubscribeUrl;

          // Prepare CTA URL based on email type
          let ctaUrl = APP_URL;
          if (setting.email_type === "inactive_user") {
            ctaUrl = `${APP_URL}/dashboard`;
          } else if (setting.email_type === "no_team_invite") {
            ctaUrl = `${APP_URL}/community`;
          } else if (setting.email_type === "no_worship_set") {
            ctaUrl = `${APP_URL}/set-builder`;
          }

          // Replace variables in templates
          const variables: Record<string, string> = {
            user_name: recipient.full_name || "사용자",
            days: recipient.days_inactive.toString(),
            community_name: recipient.community_name || "",
            app_url: APP_URL,
            cta_url: ctaUrl,
            unsubscribe_url: unsubscribeUrl,
            preferences_url: preferencesUrl,
          };

          const personalizedSubject = replaceVariables(setting.subject_template, variables);
          let personalizedBody = replaceVariables(setting.body_template, variables);

          // Append signature if configured
          if (signature) {
            personalizedBody += signature;
          }

          // Send email
          await sendEmail(resendApiKey, recipient.email, personalizedSubject, personalizedBody, senderName);

          // Log sent email
          await supabase.from("automated_email_log").insert({
            user_id: recipient.id,
            email_type: setting.email_type,
            status: "sent",
            recipient_email: recipient.email,
            recipient_name: recipient.full_name,
            metadata: {
              days_inactive: recipient.days_inactive,
              community_name: recipient.community_name,
            },
          });

          results[setting.email_type].sent++;
          console.log(`Sent ${setting.email_type} email to: ${recipient.email}`);

          // Rate limit: wait 600ms between emails (Resend allows 2/sec)
          await delay(600);
        } catch (err: any) {
          console.error(`Failed to send ${setting.email_type} email to ${recipient.email}:`, err);
          results[setting.email_type].errors.push(`${recipient.email}: ${err.message}`);

          // Log failed email
          await supabase.from("automated_email_log").insert({
            user_id: recipient.id,
            email_type: setting.email_type,
            status: "failed",
            error_message: err.message,
            recipient_email: recipient.email,
            recipient_name: recipient.full_name,
            metadata: {
              days_inactive: recipient.days_inactive,
              community_name: recipient.community_name,
            },
          });
        }
      }
    }

    console.log("Automated emails processing complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in process-automated-emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
