-- 1. 자동 이메일 발송 추적 테이블 생성
CREATE TABLE public.automated_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE (user_id, email_type)
);

-- RLS 정책
ALTER TABLE public.automated_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all automated email logs" 
ON public.automated_email_log 
FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 2. 사용자 마지막 활동 추적 컬럼 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- 3. 팀원 없는 커뮤니티 조회 함수
CREATE OR REPLACE FUNCTION public.get_communities_with_single_owner()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  community_id UUID,
  community_name TEXT,
  community_created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cm.user_id,
    p.email AS user_email,
    p.full_name AS user_name,
    cm.community_id,
    wc.name AS community_name,
    wc.created_at AS community_created_at
  FROM community_members cm
  JOIN worship_communities wc ON wc.id = cm.community_id
  JOIN profiles p ON p.id = cm.user_id
  WHERE cm.role = 'owner'
    AND wc.created_at < NOW() - INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM community_members cm2 
      WHERE cm2.community_id = cm.community_id 
        AND cm2.user_id != cm.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM automated_email_log ael
      WHERE ael.user_id = cm.user_id
        AND ael.email_type = 'no_team_invite'
    );
$$;

-- 4. 워십세트 미생성 워십리더 조회 함수
CREATE OR REPLACE FUNCTION public.get_inactive_worship_leaders(days INTEGER DEFAULT 14)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  last_set_date TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id AS user_id,
    p.email,
    p.full_name,
    MAX(ss.created_at) AS last_set_date
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'worship_leader'
  JOIN service_sets ss ON ss.created_by = p.id
  WHERE NOT EXISTS (
    SELECT 1 FROM automated_email_log ael
    WHERE ael.user_id = p.id
      AND ael.email_type = 'no_worship_set'
  )
  GROUP BY p.id, p.email, p.full_name
  HAVING MAX(ss.created_at) < NOW() - INTERVAL '1 day' * days;
$$;

-- 5. 미접속 사용자 조회 함수
CREATE OR REPLACE FUNCTION public.get_inactive_users(days INTEGER DEFAULT 7)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  last_active_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id AS user_id,
    p.email,
    p.full_name,
    p.last_active_at
  FROM profiles p
  WHERE p.last_active_at IS NOT NULL
    AND p.last_active_at < NOW() - INTERVAL '1 day' * days
    AND NOT EXISTS (
      SELECT 1 FROM automated_email_log ael
      WHERE ael.user_id = p.id
        AND ael.email_type = 'inactive_user'
    );
$$;