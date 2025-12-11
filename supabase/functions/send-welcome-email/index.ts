import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email request for:", email);

    // Validate that the caller's email matches the target email
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client to verify user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Failed to get user:", userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Security check: Only allow sending welcome email to the authenticated user's own email
    if (user.email?.toLowerCase() !== email.toLowerCase()) {
      console.error("Email mismatch - user:", user.email, "target:", email);
      return new Response(
        JSON.stringify({ success: false, error: "You can only send welcome emails to your own email address" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Validated user, sending welcome email to:", email);

    // Send email using Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "K-Worship <noreply@kworship.app>",
        to: [email],
        subject: "K-Worship에 오신 것을 환영합니다! 🎵",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2b4b8a; margin: 0; font-size: 28px;">K-Worship</h1>
              <p style="color: #666; margin-top: 8px;">혼자 짜던 콘티에서, 함께 나누는 콘티로</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #2b4b8a 0%, #d16265 100%); border-radius: 12px; padding: 30px; text-align: center; color: white; margin-bottom: 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 24px;">환영합니다${name ? `, ${name}님` : ''}! 🎉</h2>
              <p style="margin: 0; font-size: 16px; opacity: 0.95;">K-Worship 가입을 진심으로 환영합니다.</p>
            </div>

            <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
              <h3 style="color: #2b4b8a; margin-top: 0; font-size: 18px;">이제 시작하세요</h3>
              <ul style="padding-left: 20px; margin: 15px 0;">
                <li style="margin-bottom: 10px;">📚 <strong>찬양 라이브러리</strong>를 탐색하고 나만의 즐겨찾기 목록을 만드세요</li>
                <li style="margin-bottom: 10px;">🎼 <strong>워십세트</strong>를 만들어 예배 흐름을 설계하세요</li>
                <li style="margin-bottom: 10px;">👥 <strong>예배공동체</strong>에 가입하거나 새로운 공동체를 만드세요</li>
                <li style="margin-bottom: 10px;">🤝 팀원들과 함께 협업하며 예배를 준비하세요</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://kworship.app" style="display: inline-block; background: linear-gradient(135deg, #2b4b8a 0%, #d16265 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">지금 시작하기</a>
            </div>

            <div style="border-top: 2px solid #e9ecef; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
              <p style="margin: 5px 0;">질문이나 도움이 필요하신가요?</p>
              <p style="margin: 5px 0;">언제든지 연락 주세요 💬</p>
              <p style="margin: 15px 0 5px 0; color: #999; font-size: 12px;">© 2025 K-Worship. All rights reserved.</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const emailData = await resendResponse.json();
    console.log("Welcome email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
