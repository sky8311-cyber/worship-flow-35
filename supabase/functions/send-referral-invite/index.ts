import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendReferralInviteRequest {
  email: string;
  inviterName: string;
  referralCode: string;
  language?: 'en' | 'ko';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header to verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, inviterName, referralCode, language = 'ko' }: SendReferralInviteRequest = await req.json();

    console.log(`Sending referral invite: from=${inviterName} to=${email}`);

    if (!email || !referralCode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check daily limit (10 per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count } = await supabase
      .from('referral_invites')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_id', user.id)
      .gte('created_at', today.toISOString());

    if (count && count >= 10) {
      return new Response(
        JSON.stringify({ error: language === 'ko' ? '일일 초대 한도(10건)를 초과했습니다.' : 'Daily invite limit (10) exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already invited this email
    const { data: existingInvite } = await supabase
      .from('referral_invites')
      .select('id, status')
      .eq('inviter_id', user.id)
      .eq('email', email.toLowerCase())
      .single();

    if (existingInvite) {
      if (existingInvite.status === 'joined') {
        return new Response(
          JSON.stringify({ error: language === 'ko' ? '이미 가입한 사용자입니다.' : 'User already joined' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create invite URL
    const appUrl = 'https://kworship.app';
    const inviteUrl = `${appUrl}/r/${referralCode}`;

    // Prepare email content
    const subject = language === 'ko' 
      ? `${inviterName}님이 K-Worship에 초대했습니다!`
      : `${inviterName} invited you to K-Worship!`;

    const htmlContent = language === 'ko' ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B5CF6; margin-bottom: 10px;">K-Worship</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); border-radius: 16px; padding: 30px; text-align: center; color: white; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">🎵 ${inviterName}님이 초대했습니다!</h2>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">K-Worship에서 함께 예배를 준비해요</p>
        </div>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          K-Worship은 예배 리더와 팀을 위한 최고의 협업 플랫폼입니다. 
          곡 라이브러리, 예배 세트 빌더, 팀 협업 등 다양한 기능을 무료로 이용하세요!
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">지금 가입하기</a>
        </div>
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          또는 이 링크를 복사하세요: <a href="${inviteUrl}" style="color: #8B5CF6;">${inviteUrl}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          이 이메일은 ${inviterName}님의 초대로 발송되었습니다.
        </p>
      </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B5CF6; margin-bottom: 10px;">K-Worship</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); border-radius: 16px; padding: 30px; text-align: center; color: white; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">🎵 ${inviterName} invited you!</h2>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">Join us on K-Worship to prepare worship together</p>
        </div>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          K-Worship은 예배 리더와 팀을 위한 최고의 협업 플랫폼입니다. 
          곡 라이브러리, 예배 세트 빌더, 팀 협업 등 다양한 기능을 이용하세요!
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Join Now</a>
        </div>
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          Or copy this link: <a href="${inviteUrl}" style="color: #8B5CF6;">${inviteUrl}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          This email was sent on behalf of ${inviterName}.
        </p>
      </body>
      </html>
    `;

    // Send email via Resend
    if (resendApiKey) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'K-Worship <noreply@kworship.app>',
          to: [email],
          subject: subject,
          html: htmlContent,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('Email send failed:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to send email' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('RESEND_API_KEY not configured, skipping email send');
    }

    // Create or update invite record
    if (existingInvite) {
      await supabase
        .from('referral_invites')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', existingInvite.id);
    } else {
      await supabase
        .from('referral_invites')
        .insert({
          inviter_id: user.id,
          email: email.toLowerCase(),
          status: 'sent',
          sent_at: new Date().toISOString()
        });
    }

    console.log('Referral invite sent successfully');
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending referral invite:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
