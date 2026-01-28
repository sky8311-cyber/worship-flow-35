import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecipientFilter {
  type: "segment" | "specific_community" | "all" | "role" | "community" | "manual";
  rpcFunction?: string;
  rpcParam?: string;
  communityId?: string;
  roleValue?: string;
  manualEmails?: string[];
}

interface SendAdminEmailRequest {
  templateId?: string;
  subject: string;
  htmlContent: string;
  recipientFilter: RecipientFilter;
  excludedEmails?: string[];
  testMode?: boolean;
}

interface Recipient {
  user_id?: string;
  id?: string;
  email: string;
  full_name: string | null;
}

interface SenderSettings {
  sender_name: string;
  sender_title: string | null;
  signature_html: string | null;
  auto_append_signature: boolean;
}

const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES = 1000;

function replaceVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendEmail(
  to: string, 
  subject: string, 
  html: string, 
  senderName: string = "KWorship"
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
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
      const errorData = await response.json();
      return { success: false, error: JSON.stringify(errorData) };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-admin-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      console.error("User is not admin:", user.id);
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { templateId, subject, htmlContent, recipientFilter, excludedEmails, testMode }: SendAdminEmailRequest = await req.json();
    console.log("Request params:", { templateId, subject, recipientFilter, excludedEmails: excludedEmails?.length || 0, testMode });

    // Fetch sender settings
    const { data: senderSettingsData } = await supabaseClient
      .from("email_sender_settings")
      .select("*")
      .single();
    
    const senderSettings: SenderSettings = senderSettingsData || {
      sender_name: "KWorship",
      sender_title: null,
      signature_html: null,
      auto_append_signature: false,
    };
    console.log("Sender settings:", senderSettings.sender_name);

    // Get recipients based on filter
    let recipients: Recipient[] = [];
    let communityName = "";

    // Fetch community name if sending to a community
    if ((recipientFilter.type === "community" || recipientFilter.type === "specific_community") && recipientFilter.communityId) {
      const { data: community } = await supabaseClient
        .from("worship_communities")
        .select("name")
        .eq("id", recipientFilter.communityId)
        .single();
      communityName = community?.name || "";
      console.log("Community name:", communityName);
    }

    if (testMode) {
      // In test mode, only send to the admin's email
      const { data: adminProfile } = await supabaseClient
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", user.id)
        .single();
      
      if (adminProfile) {
        recipients = [{
          user_id: adminProfile.id,
          id: adminProfile.id,
          email: adminProfile.email,
          full_name: adminProfile.full_name,
        }];
      }
    } else {
      // Handle manual email input
      if (recipientFilter.type === "manual" && recipientFilter.manualEmails && recipientFilter.manualEmails.length > 0) {
        console.log(`Processing ${recipientFilter.manualEmails.length} manual email addresses`);
        
        // Look up profiles for manual emails (to get names if they exist)
        const { data: existingProfiles } = await supabaseClient
          .from("profiles")
          .select("id, email, full_name")
          .in("email", recipientFilter.manualEmails);
        
        const existingEmailMap = new Map(
          (existingProfiles || []).map(p => [p.email.toLowerCase(), p])
        );
        
        // Create recipients from manual emails
        recipients = recipientFilter.manualEmails.map(email => {
          const normalizedEmail = email.toLowerCase();
          const profile = existingEmailMap.get(normalizedEmail);
          return {
            user_id: profile?.id || null,
            id: profile?.id || null,
            email: email,
            full_name: profile?.full_name || null,
          };
        });
        
        console.log(`Found ${existingProfiles?.length || 0} existing profiles out of ${recipients.length} manual emails`);
      }
      // Handle new segment-based filtering using RPC functions
      else if (recipientFilter.type === "segment" && recipientFilter.rpcFunction && recipientFilter.rpcParam) {
        const rpcFn = recipientFilter.rpcFunction;
        const rpcParam = recipientFilter.rpcParam;
        
        console.log(`Calling RPC function: ${rpcFn} with param: ${rpcParam}`);
        
        let data: any[] = [];
        if (rpcFn === "get_users_by_platform_tier") {
          const result = await supabaseClient.rpc("get_users_by_platform_tier", { tier_type: rpcParam });
          data = result.data || [];
        } else if (rpcFn === "get_users_by_community_status") {
          const result = await supabaseClient.rpc("get_users_by_community_status", { status_type: rpcParam });
          data = result.data || [];
        } else if (rpcFn === "get_users_by_activity_status") {
          const result = await supabaseClient.rpc("get_users_by_activity_status", { activity_type: rpcParam });
          data = result.data || [];
        }
        
        recipients = data.map((r: any) => ({
          user_id: r.user_id,
          id: r.user_id,
          email: r.email,
          full_name: r.full_name,
        }));
      } else if (recipientFilter.type === "specific_community" && recipientFilter.communityId) {
        const { data } = await supabaseClient.rpc("get_users_by_community_status", { 
          status_type: "specific_community", 
          community_id_param: recipientFilter.communityId 
        });
        recipients = (data || []).map((r: any) => ({
          user_id: r.user_id,
          id: r.user_id,
          email: r.email,
          full_name: r.full_name,
        }));
      }
      // Legacy filter support
      else if (recipientFilter.type === "all") {
        const { data } = await supabaseClient
          .from("profiles")
          .select("id, email, full_name")
          .not("email", "is", null);
        recipients = (data || []).map(r => ({ ...r, user_id: r.id }));
      } else if (recipientFilter.type === "role" && recipientFilter.roleValue) {
        const { data } = await supabaseClient
          .from("profiles")
          .select("id, email, full_name, user_roles!inner(role)")
          .eq("user_roles.role", recipientFilter.roleValue)
          .not("email", "is", null);
        recipients = (data || []).map(r => ({ ...r, user_id: r.id }));
      } else if (recipientFilter.type === "community" && recipientFilter.communityId) {
        const { data } = await supabaseClient
          .from("profiles")
          .select("id, email, full_name, community_members!inner(community_id)")
          .eq("community_members.community_id", recipientFilter.communityId)
          .not("email", "is", null);
        recipients = (data || []).map(r => ({ ...r, user_id: r.id }));
      }
    }

    // Filter out excluded emails
    if (excludedEmails && excludedEmails.length > 0 && !testMode) {
      const excludedSet = new Set(excludedEmails.map(e => e.toLowerCase()));
      const originalCount = recipients.length;
      recipients = recipients.filter(r => !excludedSet.has(r.email.toLowerCase()));
      console.log(`Excluded ${originalCount - recipients.length} recipients, ${recipients.length} remaining`);
    }

    // Filter out users who opted out of marketing/admin emails (based on marketing_emails preference)
    if (!testMode) {
      const userIds = recipients.filter(r => r.user_id || r.id).map(r => r.user_id || r.id);
      if (userIds.length > 0) {
        const { data: optedOutUsers } = await supabaseClient
          .from("email_preferences")
          .select("user_id")
          .in("user_id", userIds)
          .eq("marketing_emails", false);
        
        if (optedOutUsers && optedOutUsers.length > 0) {
          const optedOutIds = new Set(optedOutUsers.map(u => u.user_id));
          const beforeOptOut = recipients.length;
          recipients = recipients.filter(r => {
            const id = r.user_id || r.id;
            return !id || !optedOutIds.has(id);
          });
          console.log(`Filtered out ${beforeOptOut - recipients.length} opted-out users`);
        }
      }
    }

    console.log(`Found ${recipients.length} recipients`);

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get template info if templateId provided
    let templateName = "Custom Email";
    if (templateId) {
      const { data: template } = await supabaseClient
        .from("email_templates")
        .select("name")
        .eq("id", templateId)
        .single();
      if (template) {
        templateName = template.name;
      }
    }

    // Create email log
    const { data: emailLog, error: logError } = await supabaseClient
      .from("admin_email_logs")
      .insert({
        template_id: templateId || null,
        template_name: templateName,
        subject,
        html_content: htmlContent,
        sent_by: user.id,
        recipient_filter: recipientFilter,
        recipient_count: recipients.length,
        status: "sending",
      })
      .select()
      .single();

    if (logError) {
      console.error("Error creating email log:", logError);
      return new Response(JSON.stringify({ error: "Failed to create email log" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Created email log:", emailLog.id);

    // Insert all recipients with pending status
    const recipientRecords = recipients.map((r) => ({
      email_log_id: emailLog.id,
      user_id: r.user_id || r.id,
      email: r.email,
      status: "pending",
    }));

    await supabaseClient.from("email_recipients").insert(recipientRecords);

    // Send emails in batches
    let successCount = 0;
    let failureCount = 0;
    const appUrl = "https://kworship.app";

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(recipients.length / BATCH_SIZE)}`);

      const sendPromises = batch.map(async (recipient) => {
        try {
          // Get unsubscribe token for this user
          let unsubscribeToken = "";
          let unsubscribeUrl = appUrl;
          let preferencesUrl = appUrl;
          
          if (recipient.user_id || recipient.id) {
            const { data: prefData } = await supabaseClient
              .from("email_preferences")
              .select("unsubscribe_token")
              .eq("user_id", recipient.user_id || recipient.id)
              .maybeSingle();
            
            if (prefData?.unsubscribe_token) {
              unsubscribeToken = prefData.unsubscribe_token;
              unsubscribeUrl = `${appUrl}/email-preferences?token=${unsubscribeToken}`;
              preferencesUrl = unsubscribeUrl;
            }
          }

          // Replace variables in content
          let personalizedContent = replaceVariables(htmlContent, {
            user_name: recipient.full_name || "User",
            app_url: appUrl,
            community_name: communityName,
            unsubscribe_url: unsubscribeUrl,
            preferences_url: preferencesUrl,
          });

          // Append signature if enabled
          if (senderSettings.auto_append_signature && senderSettings.signature_html) {
            personalizedContent += senderSettings.signature_html;
          }

          const personalizedSubject = replaceVariables(subject, {
            user_name: recipient.full_name || "User",
            community_name: communityName,
          });

          const result = await sendEmail(
            recipient.email, 
            personalizedSubject, 
            personalizedContent, 
            senderSettings.sender_name
          );

          // Update recipient status
          await supabaseClient
            .from("email_recipients")
            .update({
              status: result.success ? "sent" : "failed",
              resend_id: result.id || null,
              sent_at: result.success ? new Date().toISOString() : null,
              error_message: result.error || null,
            })
            .eq("email_log_id", emailLog.id)
            .eq("email", recipient.email);

          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }
          return result;
        } catch (error: any) {
          console.error(`Failed to send to ${recipient.email}:`, error);

          await supabaseClient
            .from("email_recipients")
            .update({
              status: "failed",
              error_message: error.message || "Unknown error",
            })
            .eq("email_log_id", emailLog.id)
            .eq("email", recipient.email);

          failureCount++;
          return { success: false, email: recipient.email, error: error.message };
        }
      });

      await Promise.all(sendPromises);

      // Delay between batches (except for the last batch)
      if (i + BATCH_SIZE < recipients.length) {
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }

    // Update email log with final status
    const finalStatus = failureCount === 0 ? "completed" : failureCount === recipients.length ? "failed" : "completed";
    await supabaseClient
      .from("admin_email_logs")
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        error_message: failureCount > 0 ? `${failureCount} of ${recipients.length} emails failed` : null,
      })
      .eq("id", emailLog.id);

    console.log(`Email sending completed. Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        emailLogId: emailLog.id,
        totalRecipients: recipients.length,
        successCount,
        failureCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-admin-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);