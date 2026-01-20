-- 1. Pending 데이터 정리: 이미 worship_leader 역할이 있는 사용자의 pending 신청을 approved로 업데이트
UPDATE worship_leader_applications wla
SET 
  status = 'approved', 
  reviewed_at = NOW()
FROM user_roles ur
WHERE ur.user_id = wla.user_id 
  AND ur.role = 'worship_leader'
  AND wla.status = 'pending';

-- 2. profiles 테이블에 온보딩 필드 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_role_asked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_role_asked_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS invited_by_community_id UUID REFERENCES worship_communities(id) ON DELETE SET NULL;