-- =====================================================
-- Phase 1: K-Seed Rewards System Revamp - Database Foundation
-- =====================================================

-- 1.1 Update existing rewards_rules with new amounts and limits
-- -----------------------------------------------------

-- invited_user_signed_up: 30 → 40, daily limit 60 → 0 (unlimited)
UPDATE rewards_rules SET 
  amount = 40, 
  daily_cap_amount = 0,
  description = 'Invite user → signup completed',
  description_ko = '커뮤니티 멤버 초대 → 가입 완료',
  updated_at = now()
WHERE code = 'invited_user_signed_up';

-- set_created: 5 → 10, daily limit 50
UPDATE rewards_rules SET 
  amount = 10, 
  daily_cap_amount = 50,
  description = 'Create a new worship set',
  description_ko = '새 예배 세트 생성',
  updated_at = now()
WHERE code = 'set_created';

-- set_published: 20 → 30, daily limit 100 → 150
UPDATE rewards_rules SET 
  amount = 30, 
  daily_cap_amount = 150,
  description = 'Publish a worship set',
  description_ko = '예배 세트 발행',
  updated_at = now()
WHERE code = 'set_published';

-- song_added_to_library: 3 → 50, daily limit 60 → 500
UPDATE rewards_rules SET 
  amount = 50, 
  daily_cap_amount = 500,
  description = 'Add a new song to library',
  description_ko = '곡 라이브러리 신규 등록',
  updated_at = now()
WHERE code = 'song_added_to_library';

-- weekly_streak_bonus: 50 → 70
UPDATE rewards_rules SET 
  amount = 70, 
  daily_cap_amount = 70,
  description = '7-day consecutive activity streak',
  description_ko = '7일 연속 활동 보너스',
  updated_at = now()
WHERE code = 'weekly_streak_bonus';

-- 1.2 Disable old/removed rules
-- -----------------------------------------------------
UPDATE rewards_rules SET enabled = false, updated_at = now()
WHERE code IN (
  'community_contribution_bonus',
  'invited_user_converted_paid',
  'set_deleted',
  'set_unpublished',
  'set_viewed',
  'song_updated_metadata',
  'template_used'
);

-- 1.3 Add new reward rules
-- -----------------------------------------------------

-- First community newsfeed post (once per community)
INSERT INTO rewards_rules (code, amount, cooldown_seconds, daily_cap_amount, description, description_ko, enabled)
VALUES ('first_community_post', 100, 0, 0, 'First community newsfeed post', '커뮤니티 뉴스피드 첫 게시글', true)
ON CONFLICT (code) DO UPDATE SET
  amount = 100,
  cooldown_seconds = 0,
  daily_cap_amount = 0,
  description = 'First community newsfeed post',
  description_ko = '커뮤니티 뉴스피드 첫 게시글',
  enabled = true,
  updated_at = now();

-- Community posts 10 milestone (once per community)
INSERT INTO rewards_rules (code, amount, cooldown_seconds, daily_cap_amount, description, description_ko, enabled)
VALUES ('community_posts_10_milestone', 200, 0, 0, 'Reach 10 total posts in community', '커뮤니티 게시글 10개 달성', true)
ON CONFLICT (code) DO UPDATE SET
  amount = 200,
  cooldown_seconds = 0,
  daily_cap_amount = 0,
  description = 'Reach 10 total posts in community',
  description_ko = '커뮤니티 게시글 10개 달성',
  enabled = true,
  updated_at = now();

-- Community chat activation bonus (monthly)
INSERT INTO rewards_rules (code, amount, cooldown_seconds, daily_cap_amount, description, description_ko, enabled)
VALUES ('community_chat_active_bonus', 300, 2592000, 0, 'Community chat activation (500+ messages/month)', '커뮤니티 채팅 활성화 보너스 (월 500+)', true)
ON CONFLICT (code) DO UPDATE SET
  amount = 300,
  cooldown_seconds = 2592000,
  daily_cap_amount = 0,
  description = 'Community chat activation (500+ messages/month)',
  description_ko = '커뮤니티 채팅 활성화 보너스 (월 500+)',
  enabled = true,
  updated_at = now();

-- Song metadata complete bonus (once per song)
INSERT INTO rewards_rules (code, amount, cooldown_seconds, daily_cap_amount, description, description_ko, enabled)
VALUES ('song_metadata_complete', 50, 0, 0, 'Complete all song metadata fields', '곡 메타데이터 완전 입력 보너스', true)
ON CONFLICT (code) DO UPDATE SET
  amount = 50,
  cooldown_seconds = 0,
  daily_cap_amount = 0,
  description = 'Complete all song metadata fields',
  description_ko = '곡 메타데이터 완전 입력 보너스',
  enabled = true,
  updated_at = now();

-- 1.4 Create rewards_milestones table for one-time reward tracking
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS rewards_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_code text NOT NULL,
  ref_id uuid, -- community_id or song_id
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, milestone_code, ref_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rewards_milestones_user_code ON rewards_milestones(user_id, milestone_code);
CREATE INDEX IF NOT EXISTS idx_rewards_milestones_ref ON rewards_milestones(ref_id);

-- Enable RLS
ALTER TABLE rewards_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own milestones"
  ON rewards_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all milestones"
  ON rewards_milestones FOR ALL
  USING (true)
  WITH CHECK (true);