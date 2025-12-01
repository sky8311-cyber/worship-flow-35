import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY") as string;
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailData {
  user: {
    email: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

function getEmailSubject(type: string, lang: string = "ko"): string {
  const subjects: Record<string, Record<string, string>> = {
    signup: {
      ko: "K-Worship 이메일 확인",
      en: "Confirm your K-Worship email",
    },
    recovery: {
      ko: "K-Worship 비밀번호 재설정",
      en: "Reset your K-Worship password",
    },
    email_change: {
      ko: "K-Worship 이메일 변경 확인",
      en: "Confirm your email change",
    },
    magiclink: {
      ko: "K-Worship 로그인 링크",
      en: "Your K-Worship login link",
    },
  };
  return subjects[type]?.[lang] || subjects[type]?.["ko"] || "K-Worship";
}

function getEmailTemplate(
  type: string,
  confirmUrl: string,
  lang: string = "ko"
): string {
  const templates: Record<string, Record<string, { title: string; greeting: string; body: string; button: string; footer: string }>> = {
    signup: {
      ko: {
        title: "K-Worship에 오신 것을 환영합니다!",
        greeting: "안녕하세요,",
        body: "K-Worship 가입을 완료하려면 아래 버튼을 클릭해주세요.",
        button: "이메일 확인하기",
        footer: "이 이메일을 요청하지 않으셨다면 무시하셔도 됩니다.",
      },
      en: {
        title: "Welcome to K-Worship!",
        greeting: "Hello,",
        body: "Please click the button below to confirm your K-Worship registration.",
        button: "Confirm Email",
        footer: "If you didn't request this email, you can safely ignore it.",
      },
    },
    recovery: {
      ko: {
        title: "비밀번호 재설정",
        greeting: "안녕하세요,",
        body: "비밀번호를 재설정하려면 아래 버튼을 클릭해주세요.",
        button: "비밀번호 재설정하기",
        footer: "이 이메일을 요청하지 않으셨다면 무시하셔도 됩니다.",
      },
      en: {
        title: "Reset Your Password",
        greeting: "Hello,",
        body: "Please click the button below to reset your password.",
        button: "Reset Password",
        footer: "If you didn't request this email, you can safely ignore it.",
      },
    },
    email_change: {
      ko: {
        title: "이메일 변경 확인",
        greeting: "안녕하세요,",
        body: "이메일 변경을 완료하려면 아래 버튼을 클릭해주세요.",
        button: "이메일 변경 확인하기",
        footer: "이 이메일을 요청하지 않으셨다면 무시하셔도 됩니다.",
      },
      en: {
        title: "Confirm Email Change",
        greeting: "Hello,",
        body: "Please click the button below to confirm your email change.",
        button: "Confirm Email Change",
        footer: "If you didn't request this email, you can safely ignore it.",
      },
    },
    magiclink: {
      ko: {
        title: "로그인 링크",
        greeting: "안녕하세요,",
        body: "K-Worship에 로그인하려면 아래 버튼을 클릭해주세요.",
        button: "로그인하기",
        footer: "이 이메일을 요청하지 않으셨다면 무시하셔도 됩니다.",
      },
      en: {
        title: "Your Login Link",
        greeting: "Hello,",
        body: "Please click the button below to log in to K-Worship.",
        button: "Log In",
        footer: "If you didn't request this email, you can safely ignore it.",
      },
    },
  };

  const template = templates[type]?.[lang] || templates[type]?.["ko"];
  if (!template) {
    return `<p>Error: Unknown email type</p>`;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #2b4b8a 0%, #d16265 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
          }
          .content p {
            margin: 0 0 20px 0;
            font-size: 16px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            margin: 20px 0;
            background: linear-gradient(135deg, #2b4b8a 0%, #d16265 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .footer {
            padding: 30px;
            text-align: center;
            color: #999999;
            font-size: 14px;
            border-top: 1px solid #eeeeee;
          }
          .logo {
            margin-bottom: 10px;
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">K-Worship</div>
            <h1>${template.title}</h1>
          </div>
          <div class="content">
            <p>${template.greeting}</p>
            <p>${template.body}</p>
            <div style="text-align: center;">
              <a href="${confirmUrl}" class="button">${template.button}</a>
            </div>
          </div>
          <div class="footer">
            <p>${template.footer}</p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} K-Worship. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔔 Received auth email hook request");

    // Verify webhook signature
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    const wh = new Webhook(hookSecret);
    const {
      user,
      email_data: { token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as AuthEmailData;

    console.log(`📧 Email type: ${email_action_type}, User: ${user.email}`);

    // Construct confirmation URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    // Determine language (default to Korean)
    const lang = "ko"; // Could be enhanced to detect user preference

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "K-Worship <noreply@kworship.app>",
        to: [user.email],
        subject: getEmailSubject(email_action_type, lang),
        html: getEmailTemplate(email_action_type, confirmUrl, lang),
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("❌ Resend error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log("✅ Email sent successfully via Resend");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message,
        },
      }),
      {
        status: error.code || 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
