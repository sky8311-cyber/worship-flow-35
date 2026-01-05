-- Create email_templates table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Create admin_email_logs table
CREATE TABLE public.admin_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.email_templates(id),
  template_name TEXT,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  sent_by UUID REFERENCES public.profiles(id) NOT NULL,
  recipient_filter JSONB NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create email_recipients table
CREATE TABLE public.email_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_log_id UUID REFERENCES public.admin_email_logs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resend_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates (admin only)
CREATE POLICY "Admins can view all email templates"
ON public.email_templates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert email templates"
ON public.email_templates FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update email templates"
ON public.email_templates FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete non-system email templates"
ON public.email_templates FOR DELETE
USING (
  is_system = false AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for admin_email_logs (admin only)
CREATE POLICY "Admins can view all email logs"
ON public.admin_email_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert email logs"
ON public.admin_email_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update email logs"
ON public.admin_email_logs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for email_recipients (admin only)
CREATE POLICY "Admins can view all email recipients"
ON public.email_recipients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert email recipients"
ON public.email_recipients FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update email recipients"
ON public.email_recipients FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create updated_at trigger for email_templates
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial system templates
INSERT INTO public.email_templates (name, slug, category, subject, html_content, variables, is_system) VALUES
(
  'Welcome Email',
  'welcome',
  'system',
  'Welcome to KWorship! 🎵',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;"><div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><h1 style="color: #1a1a1a; margin-bottom: 24px;">Welcome to KWorship!</h1><p style="color: #666; line-height: 1.6;">Hi {{user_name}},</p><p style="color: #666; line-height: 1.6;">Thank you for joining KWorship. We''re excited to have you as part of our worship community!</p><p style="color: #666; line-height: 1.6;">Get started by exploring our features and connecting with other worship leaders.</p><a href="{{app_url}}/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Go to Dashboard</a></div></body></html>',
  '[{"name": "user_name", "description": "User full name", "required": true}, {"name": "app_url", "description": "Application URL", "required": true}]'::jsonb,
  true
),
(
  'Community Invitation (Korean)',
  'community-invite-ko',
  'invitation',
  '{{community_name}} 커뮤니티에 초대되었습니다',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;"><div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><h1 style="color: #1a1a1a; margin-bottom: 24px;">커뮤니티 초대</h1><p style="color: #666; line-height: 1.6;">{{inviter_name}}님이 {{community_name}} 커뮤니티에 초대했습니다.</p><p style="color: #666; line-height: 1.6;">아래 버튼을 클릭하여 초대를 수락하세요.</p><a href="{{invite_link}}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">초대 수락하기</a></div></body></html>',
  '[{"name": "community_name", "description": "Community name", "required": true}, {"name": "inviter_name", "description": "Name of person who invited", "required": true}, {"name": "invite_link", "description": "Invitation acceptance link", "required": true}]'::jsonb,
  true
),
(
  'Community Invitation (English)',
  'community-invite-en',
  'invitation',
  'You''ve been invited to {{community_name}}',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;"><div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><h1 style="color: #1a1a1a; margin-bottom: 24px;">Community Invitation</h1><p style="color: #666; line-height: 1.6;">{{inviter_name}} has invited you to join {{community_name}}.</p><p style="color: #666; line-height: 1.6;">Click the button below to accept the invitation.</p><a href="{{invite_link}}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Accept Invitation</a></div></body></html>',
  '[{"name": "community_name", "description": "Community name", "required": true}, {"name": "inviter_name", "description": "Name of person who invited", "required": true}, {"name": "invite_link", "description": "Invitation acceptance link", "required": true}]'::jsonb,
  true
),
(
  'General Announcement',
  'broadcast',
  'announcement',
  '{{subject}}',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;"><div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><p style="color: #666; line-height: 1.6;">Hi {{user_name}},</p><div style="color: #333; line-height: 1.6;">{{content}}</div><hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"><p style="color: #999; font-size: 12px;">This email was sent from KWorship.</p></div></body></html>',
  '[{"name": "user_name", "description": "Recipient name", "required": true}, {"name": "subject", "description": "Email subject", "required": true}, {"name": "content", "description": "Email body content", "required": true}]'::jsonb,
  true
),
(
  'Referral Invitation',
  'referral-invite',
  'invitation',
  '{{inviter_name}}님이 KWorship에 초대했습니다',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;"><div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><h1 style="color: #1a1a1a; margin-bottom: 24px;">KWorship에 초대되었습니다!</h1><p style="color: #666; line-height: 1.6;">{{inviter_name}}님이 KWorship에 초대했습니다.</p><p style="color: #666; line-height: 1.6;">KWorship은 예배 리더와 팀을 위한 예배 플래닝 플랫폼입니다.</p><a href="{{referral_link}}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">지금 가입하기</a></div></body></html>',
  '[{"name": "inviter_name", "description": "Name of person who invited", "required": true}, {"name": "referral_link", "description": "Referral signup link", "required": true}]'::jsonb,
  true
);