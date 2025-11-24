import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  communityId: string;
  communityName: string;
  inviterName: string;
  language: string;
}

interface ResendRequest {
  invitationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    
    let email: string;
    let communityName: string;
    let inviterName: string;
    let language: string;
    let invitationId: string;

    // Check if this is a resend request
    if ('invitationId' in body) {
      const { invitationId: id } = body as ResendRequest;
      invitationId = id;

      // Fetch invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from("community_invitations")
        .select("email, community_id, invited_by")
        .eq("id", invitationId)
        .single();

      if (inviteError || !invitation) {
        throw new Error("Invitation not found");
      }

      email = invitation.email;

      // Fetch community
      const { data: community, error: commError } = await supabase
        .from("worship_communities")
        .select("name")
        .eq("id", invitation.community_id)
        .single();

      if (commError) throw commError;
      communityName = community.name;

      // Fetch inviter
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", invitation.invited_by)
        .single();

      if (profileError) throw profileError;
      inviterName = profile.full_name || "A worship leader";
      language = "ko"; // Default to Korean for resends
    } else {
      // New invitation
      const { email: reqEmail, communityId, communityName: reqName, inviterName: reqInviter, language: reqLang } = body as InvitationRequest;
      email = reqEmail;
      communityName = reqName;
      inviterName = reqInviter;
      language = reqLang;

      // Create invitation record
      const { data: newInvitation, error: createError } = await supabase
        .from("community_invitations")
        .insert({
          email,
          community_id: communityId,
          invited_by: body.inviterId,
          role: "member",
          status: "pending",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;
      invitationId = newInvitation.id;
    }

    // Build invitation URL - use the origin from SUPABASE_URL
    const originUrl = supabaseUrl.replace("https://", "https://").replace(".supabase.co", "");
    const inviteUrl = `${originUrl}/accept-invitation/${invitationId}`;

    // Prepare email content based on language
    const isKorean = language === "ko";
    const subject = isKorean 
      ? `${communityName}에 초대되었습니다`
      : `You've been invited to join ${communityName}`;

    const htmlContent = isKorean ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2b4b8a, #d16265); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #2b4b8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">K-Worship 초대</h1>
            </div>
            <div class="content">
              <p>안녕하세요,</p>
              <p><strong>${inviterName}</strong>님이 <strong>${communityName}</strong> 예배공동체에 초대하셨습니다.</p>
              <p>K-Worship은 예배 흐름을 설계하고 팀과 함께 예배를 준비하는 도구입니다.</p>
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">초대 수락하기</a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">이 초대는 7일 후 만료됩니다.</p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">버튼이 작동하지 않으면 다음 링크를 복사하여 브라우저에 붙여넣으세요:<br>${inviteUrl}</p>
            </div>
            <div class="footer">
              <p>K-Worship - 예배의 흐름을 짜는 찬양 콘티</p>
              <p style="font-size: 12px;">이 이메일은 ${communityName}의 초대로 발송되었습니다.</p>
            </div>
          </div>
        </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2b4b8a, #d16265); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #2b4b8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">K-Worship Invitation</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p><strong>${inviterName}</strong> has invited you to join <strong>${communityName}</strong> worship community.</p>
              <p>K-Worship is a tool for designing worship flows and preparing services with your team.</p>
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This invitation expires in 7 days.</p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:<br>${inviteUrl}</p>
            </div>
            <div class="footer">
              <p>K-Worship - Worship Setlist Management</p>
              <p style="font-size: 12px;">This email was sent by invitation from ${communityName}.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "K-Worship <onboarding@resend.dev>",
        to: [email],
        subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Email send error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log(`Invitation email sent to ${email} for community ${communityName}`);

    return new Response(
      JSON.stringify({ success: true, invitationId }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-community-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
