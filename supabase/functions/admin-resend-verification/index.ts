import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};



Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, name } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate verification link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: 'https://kworship.app'
      }
    });

    if (linkError) {
      console.error("Error generating verification link:", linkError);
      return new Response(
        JSON.stringify({ error: linkError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send verification email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "K-Worship <noreply@kworship.app>",
        to: [email],
        subject: "이메일 인증 - K-Worship / Email Verification - K-Worship",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2b4b8a;">K-Worship 이메일 인증</h1>
          <p>안녕하세요${name ? ` ${name}님` : ''},</p>
          <p>K-Worship 계정 생성을 완료하려면 아래 버튼을 클릭하여 이메일을 인증해주세요:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${linkData.properties.action_link}" 
               style="background-color: #2b4b8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              이메일 인증하기
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            이 링크는 24시간 동안 유효합니다. 만약 계정을 생성하지 않으셨다면 이 이메일을 무시하셔도 됩니다.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
          <h2 style="color: #2b4b8a;">Email Verification - K-Worship</h2>
          <p>Hello${name ? ` ${name}` : ''},</p>
          <p>Please verify your email by clicking the button below to complete your K-Worship account setup:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${linkData.properties.action_link}" 
               style="background-color: #2b4b8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link is valid for 24 hours. If you did not create an account, you can safely ignore this email.
          </p>
        </div>
      `,
      }),
    });

    console.log(`Verification email resent to ${email}`);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-resend-verification:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
