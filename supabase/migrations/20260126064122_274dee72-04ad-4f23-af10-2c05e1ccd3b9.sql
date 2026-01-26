-- Create automated_email_settings table
CREATE TABLE public.automated_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  trigger_days INTEGER NOT NULL,
  schedule_hour INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE public.automated_email_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admins can manage automated email settings"
ON public.automated_email_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Extend automated_email_log table
ALTER TABLE public.automated_email_log ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
ALTER TABLE public.automated_email_log ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.automated_email_log ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE public.automated_email_log ADD COLUMN IF NOT EXISTS recipient_name TEXT;

-- Insert default settings with Korean email templates
INSERT INTO public.automated_email_settings (email_type, subject_template, body_template, trigger_days, schedule_hour) VALUES
(
  'inactive_user',
  '그동안 뵙지 못했네요! - Kworship',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">안녕하세요, {{user_name}}님!</h2>
    <p>Kworship에서 {{days}}일 동안 뵙지 못했네요.</p>
    <p>새로운 찬양곡과 기능들이 추가되었습니다. 다시 방문해서 확인해보세요!</p>
    <div style="margin: 24px 0;">
      <a href="{{app_url}}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Kworship 방문하기</a>
    </div>
    <p style="color: #666; font-size: 14px;">감사합니다,<br>Kworship 팀</p>
  </div>',
  7,
  0
),
(
  'no_team_invite',
  '팀원을 초대해 함께 협업하세요! - Kworship',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">안녕하세요, {{user_name}}님!</h2>
    <p>{{community_name}} 커뮤니티를 만드신 지 {{days}}일이 지났습니다.</p>
    <p>아직 팀원이 없으시네요! 팀원을 초대하여 함께 예배를 준비해보세요.</p>
    <ul style="color: #666;">
      <li>팀원들과 실시간으로 세트리스트 공유</li>
      <li>각 파트별 악보 배포</li>
      <li>일정 조율 및 알림</li>
    </ul>
    <div style="margin: 24px 0;">
      <a href="{{cta_url}}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">팀원 초대하기</a>
    </div>
    <p style="color: #666; font-size: 14px;">감사합니다,<br>Kworship 팀</p>
  </div>',
  7,
  0
),
(
  'no_worship_set',
  '새로운 예배를 준비하세요! - Kworship',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">안녕하세요, {{user_name}}님!</h2>
    <p>마지막 워십세트를 만드신 지 {{days}}일이 지났습니다.</p>
    <p>이번 주 예배 준비는 어떠세요? Kworship에서 새로운 세트리스트를 만들어보세요!</p>
    <div style="margin: 24px 0;">
      <a href="{{cta_url}}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">워십세트 만들기</a>
    </div>
    <p style="color: #666; font-size: 14px;">감사합니다,<br>Kworship 팀</p>
  </div>',
  14,
  0
);

-- Create function to get inactive users for preview
CREATE OR REPLACE FUNCTION public.get_automated_email_recipients(
  p_email_type TEXT,
  p_trigger_days INTEGER
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  last_active_at TIMESTAMPTZ,
  days_inactive INTEGER,
  community_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_email_type = 'inactive_user' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      p.last_active_at,
      EXTRACT(DAY FROM (now() - COALESCE(p.last_active_at, p.created_at)))::INTEGER as days_inactive,
      NULL::TEXT as community_name
    FROM profiles p
    WHERE p.last_active_at IS NOT NULL
      AND p.last_active_at < now() - (p_trigger_days || ' days')::INTERVAL
      AND NOT EXISTS (
        SELECT 1 FROM automated_email_log ael
        WHERE ael.user_id = p.id
          AND ael.email_type = 'inactive_user'
          AND ael.sent_at > p.last_active_at
      )
    ORDER BY p.last_active_at ASC;
    
  ELSIF p_email_type = 'no_team_invite' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      wc.created_at as last_active_at,
      EXTRACT(DAY FROM (now() - wc.created_at))::INTEGER as days_inactive,
      wc.name as community_name
    FROM worship_communities wc
    JOIN profiles p ON p.id = wc.leader_id
    WHERE wc.created_at < now() - (p_trigger_days || ' days')::INTERVAL
      AND (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = wc.id) = 1
      AND NOT EXISTS (
        SELECT 1 FROM automated_email_log ael
        WHERE ael.user_id = p.id
          AND ael.email_type = 'no_team_invite'
          AND ael.metadata->>'community_id' = wc.id::TEXT
      )
    ORDER BY wc.created_at ASC;
    
  ELSIF p_email_type = 'no_worship_set' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.full_name,
      MAX(ss.created_at) as last_active_at,
      EXTRACT(DAY FROM (now() - COALESCE(MAX(ss.created_at), p.created_at)))::INTEGER as days_inactive,
      NULL::TEXT as community_name
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'worship_leader'
    LEFT JOIN service_sets ss ON ss.created_by = p.id
    GROUP BY p.id, p.email, p.full_name, p.created_at
    HAVING COALESCE(MAX(ss.created_at), p.created_at) < now() - (p_trigger_days || ' days')::INTERVAL
      AND NOT EXISTS (
        SELECT 1 FROM automated_email_log ael
        WHERE ael.user_id = p.id
          AND ael.email_type = 'no_worship_set'
          AND ael.sent_at > COALESCE(MAX(ss.created_at), p.created_at)
      )
    ORDER BY days_inactive DESC;
  END IF;
END;
$$;