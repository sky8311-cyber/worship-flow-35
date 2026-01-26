import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuration
const INACTIVE_DAYS = 7;
const WORSHIP_SET_INACTIVE_DAYS = 14;
const APP_URL = Deno.env.get("APP_URL") || "https://kworship.app";

interface InactiveUser {
  user_id: string;
  email: string;
  full_name: string | null;
  last_active_at: string | null;
}

interface LonelyCommunity {
  user_id: string;
  user_email: string;
  user_name: string | null;
  community_id: string;
  community_name: string;
  community_created_at: string;
}

interface InactiveLeader {
  user_id: string;
  email: string;
  full_name: string | null;
  last_set_date: string | null;
}

// Helper to add delay for rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendEmail(apiKey: string, to: string, subject: string, html: string): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Kworship <noreply@kworship.app>",
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

    const results = {
      inactive_users: { processed: 0, sent: 0, errors: [] as string[] },
      no_team_invite: { processed: 0, sent: 0, errors: [] as string[] },
      no_worship_set: { processed: 0, sent: 0, errors: [] as string[] },
    };

    // 1. 미접속자 리마인더
    console.log("Processing inactive users...");
    const { data: inactiveUsers, error: inactiveError } = await supabase
      .rpc("get_inactive_users", { days: INACTIVE_DAYS });

    if (inactiveError) {
      console.error("Error fetching inactive users:", inactiveError);
      results.inactive_users.errors.push(inactiveError.message);
    } else if (inactiveUsers && inactiveUsers.length > 0) {
      for (const user of inactiveUsers as InactiveUser[]) {
        results.inactive_users.processed++;
        try {
          const daysSinceActive = user.last_active_at 
            ? Math.floor((Date.now() - new Date(user.last_active_at).getTime()) / (1000 * 60 * 60 * 24))
            : INACTIVE_DAYS;

          await sendEmail(
            resendApiKey,
            user.email,
            "그동안 뵙지 못했네요! - Kworship",
            `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>${user.full_name || "사용자"}님, 그동안 어떻게 지내셨나요?</h2>
                <p>${daysSinceActive}일 동안 Kworship에 방문하지 않으셨네요.</p>
                <p>새로운 곡과 예배 자료가 기다리고 있습니다!</p>
                <p style="margin-top: 24px;">
                  <a href="${APP_URL}/dashboard" 
                     style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    지금 바로 확인하기
                  </a>
                </p>
                <p style="margin-top: 32px; color: #666; font-size: 12px;">
                  이 이메일은 Kworship 자동 알림 시스템에서 발송되었습니다.
                </p>
              </div>
            `
          );

          // Log sent email
          await supabase.from("automated_email_log").upsert({
            user_id: user.user_id,
            email_type: "inactive_user",
            metadata: { days_inactive: daysSinceActive },
          }, { onConflict: "user_id,email_type" });

          results.inactive_users.sent++;
          console.log(`Sent inactive user email to: ${user.email}`);
          
          // Rate limit: wait 600ms between emails (Resend allows 2/sec)
          await delay(600);
        } catch (err: any) {
          console.error(`Failed to send email to ${user.email}:`, err);
          results.inactive_users.errors.push(`${user.email}: ${err.message}`);
        }
      }
    }

    // 2. 팀원 초대 리마인더
    console.log("Processing lonely community owners...");
    const { data: lonelyCommunities, error: lonelyError } = await supabase
      .rpc("get_communities_with_single_owner");

    if (lonelyError) {
      console.error("Error fetching lonely communities:", lonelyError);
      results.no_team_invite.errors.push(lonelyError.message);
    } else if (lonelyCommunities && lonelyCommunities.length > 0) {
      for (const community of lonelyCommunities as LonelyCommunity[]) {
        results.no_team_invite.processed++;
        try {
          await sendEmail(
            resendApiKey,
            community.user_email,
            "팀원을 초대해 함께 협업하세요! - Kworship",
            `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>${community.user_name || "사용자"}님, 팀원과 함께 협업하세요!</h2>
                <p>"${community.community_name}" 커뮤니티에서 혼자 예배를 준비하고 계시네요.</p>
                <p>팀원을 초대하면 함께 예배 세트를 만들고, 일정을 공유할 수 있습니다.</p>
                <ul>
                  <li>🎵 함께 곡을 선정하고 편집</li>
                  <li>📅 연습 일정 공유</li>
                  <li>💬 실시간 소통</li>
                </ul>
                <p style="margin-top: 24px;">
                  <a href="${APP_URL}/community/${community.community_id}" 
                     style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    팀원 초대하기
                  </a>
                </p>
                <p style="margin-top: 16px;"><strong>🌱 지금 초대하면 30 K-Seed 보상!</strong></p>
                <p style="margin-top: 32px; color: #666; font-size: 12px;">
                  이 이메일은 Kworship 자동 알림 시스템에서 발송되었습니다.
                </p>
              </div>
            `
          );

          await supabase.from("automated_email_log").upsert({
            user_id: community.user_id,
            email_type: "no_team_invite",
            metadata: { community_id: community.community_id, community_name: community.community_name },
          }, { onConflict: "user_id,email_type" });

          results.no_team_invite.sent++;
          console.log(`Sent team invite reminder to: ${community.user_email}`);
          
          // Rate limit: wait 600ms between emails
          await delay(600);
        } catch (err: any) {
          console.error(`Failed to send email to ${community.user_email}:`, err);
          results.no_team_invite.errors.push(`${community.user_email}: ${err.message}`);
        }
      }
    }

    // 3. 워십세트 생성 리마인더
    console.log("Processing inactive worship leaders...");
    const { data: inactiveLeaders, error: leadersError } = await supabase
      .rpc("get_inactive_worship_leaders", { days: WORSHIP_SET_INACTIVE_DAYS });

    if (leadersError) {
      console.error("Error fetching inactive leaders:", leadersError);
      results.no_worship_set.errors.push(leadersError.message);
    } else if (inactiveLeaders && inactiveLeaders.length > 0) {
      for (const leader of inactiveLeaders as InactiveLeader[]) {
        results.no_worship_set.processed++;
        try {
          const daysSinceLastSet = leader.last_set_date
            ? Math.floor((Date.now() - new Date(leader.last_set_date).getTime()) / (1000 * 60 * 60 * 24))
            : WORSHIP_SET_INACTIVE_DAYS;

          await sendEmail(
            resendApiKey,
            leader.email,
            "새로운 예배를 준비하세요! - Kworship",
            `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>${leader.full_name || "사용자"}님, 다음 예배를 준비하세요!</h2>
                <p>마지막 예배 세트를 만든 지 ${daysSinceLastSet}일이 지났습니다.</p>
                <p>새로운 세트를 만들어 다가올 예배를 준비해보세요.</p>
                <p style="margin-top: 24px;">
                  <a href="${APP_URL}/set-builder" 
                     style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    예배 세트 만들기
                  </a>
                </p>
                <p style="margin-top: 32px; color: #666; font-size: 12px;">
                  이 이메일은 Kworship 자동 알림 시스템에서 발송되었습니다.
                </p>
              </div>
            `
          );

          await supabase.from("automated_email_log").upsert({
            user_id: leader.user_id,
            email_type: "no_worship_set",
            metadata: { days_since_last_set: daysSinceLastSet },
          }, { onConflict: "user_id,email_type" });

          results.no_worship_set.sent++;
          console.log(`Sent worship set reminder to: ${leader.email}`);
          
          // Rate limit: wait 600ms between emails
          await delay(600);
        } catch (err: any) {
          console.error(`Failed to send email to ${leader.email}:`, err);
          results.no_worship_set.errors.push(`${leader.email}: ${err.message}`);
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
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error in process-automated-emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
