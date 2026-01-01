-- =====================================================
-- SEEDS REWARDS SYSTEM - LEDGER-FIRST ARCHITECTURE
-- =====================================================

-- A) rewards_wallets - User wallet with balance tracking
CREATE TABLE public.rewards_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned BIGINT NOT NULL DEFAULT 0,
  lifetime_spent BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- B) rewards_ledger - Immutable append-only ledger
CREATE TABLE public.rewards_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  amount BIGINT NOT NULL CHECK (amount > 0),
  reason_code TEXT NOT NULL,
  ref_type TEXT NOT NULL,
  ref_id TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  idempotency_key TEXT UNIQUE NOT NULL
);

-- Indexes for rewards_ledger
CREATE INDEX idx_rewards_ledger_user_id ON public.rewards_ledger(user_id);
CREATE INDEX idx_rewards_ledger_created_at ON public.rewards_ledger(created_at DESC);
CREATE INDEX idx_rewards_ledger_reason_code ON public.rewards_ledger(reason_code);
CREATE INDEX idx_rewards_ledger_user_reason ON public.rewards_ledger(user_id, reason_code, ref_id);

-- C) rewards_rules - Configurable earning rules
CREATE TABLE public.rewards_rules (
  code TEXT PRIMARY KEY,
  amount BIGINT NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  cooldown_seconds INTEGER NOT NULL DEFAULT 0,
  daily_cap_amount BIGINT NOT NULL DEFAULT 0,
  description TEXT,
  description_ko TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- D) rewards_daily_user_totals - Daily aggregation helper
CREATE TABLE public.rewards_daily_user_totals (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_earned BIGINT NOT NULL DEFAULT 0,
  total_spent BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- E) rewards_redemptions - Spending records
CREATE TABLE public.rewards_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  cost BIGINT NOT NULL CHECK (cost > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rewards_redemptions_user_id ON public.rewards_redemptions(user_id);

-- F) rewards_settings - Global system settings (singleton)
CREATE TABLE public.rewards_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  rewards_enabled BOOLEAN NOT NULL DEFAULT true,
  max_daily_earn_per_user BIGINT NOT NULL DEFAULT 500,
  max_single_tx_amount BIGINT NOT NULL DEFAULT 200,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert singleton row
INSERT INTO public.rewards_settings (id) VALUES (1);

-- G) rewards_abuse_flags - Abuse detection records
CREATE TABLE public.rewards_abuse_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL,
  description TEXT,
  meta JSONB DEFAULT '{}',
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rewards_abuse_flags_user_id ON public.rewards_abuse_flags(user_id);
CREATE INDEX idx_rewards_abuse_flags_resolved ON public.rewards_abuse_flags(resolved) WHERE NOT resolved;

-- H) rewards_store_items - Available items in the store
CREATE TABLE public.rewards_store_items (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ko TEXT,
  description TEXT,
  description_ko TEXT,
  cost BIGINT NOT NULL CHECK (cost > 0),
  enabled BOOLEAN NOT NULL DEFAULT true,
  stock INTEGER, -- NULL means unlimited
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.rewards_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_daily_user_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_abuse_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_store_items ENABLE ROW LEVEL SECURITY;

-- rewards_wallets: Users can only view their own wallet
CREATE POLICY "Users can view own wallet" ON public.rewards_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.rewards_wallets
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update wallets" ON public.rewards_wallets
  FOR UPDATE USING (is_admin(auth.uid()));

-- rewards_ledger: Users can only view their own ledger entries
CREATE POLICY "Users can view own ledger" ON public.rewards_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ledger entries" ON public.rewards_ledger
  FOR SELECT USING (is_admin(auth.uid()));

-- rewards_rules: Anyone can read rules
CREATE POLICY "Anyone can read rules" ON public.rewards_rules
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage rules" ON public.rewards_rules
  FOR ALL USING (is_admin(auth.uid()));

-- rewards_daily_user_totals: Users can view their own totals
CREATE POLICY "Users can view own daily totals" ON public.rewards_daily_user_totals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all daily totals" ON public.rewards_daily_user_totals
  FOR SELECT USING (is_admin(auth.uid()));

-- rewards_redemptions: Users can view their own redemptions
CREATE POLICY "Users can view own redemptions" ON public.rewards_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all redemptions" ON public.rewards_redemptions
  FOR SELECT USING (is_admin(auth.uid()));

-- rewards_settings: Anyone can read settings
CREATE POLICY "Anyone can read settings" ON public.rewards_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update settings" ON public.rewards_settings
  FOR UPDATE USING (is_admin(auth.uid()));

-- rewards_abuse_flags: Only admins can view
CREATE POLICY "Admins can view abuse flags" ON public.rewards_abuse_flags
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage abuse flags" ON public.rewards_abuse_flags
  FOR ALL USING (is_admin(auth.uid()));

-- rewards_store_items: Anyone can read enabled items
CREATE POLICY "Anyone can read store items" ON public.rewards_store_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage store items" ON public.rewards_store_items
  FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- SEED DATA - DEFAULT RULES
-- =====================================================

INSERT INTO public.rewards_rules (code, amount, enabled, cooldown_seconds, daily_cap_amount, description, description_ko) VALUES
  ('set_created', 5, true, 0, 50, 'Create a new worship set', '새 예배 세트 생성'),
  ('set_published', 20, true, 0, 100, 'Publish a worship set', '예배 세트 발행'),
  ('set_viewed', 1, true, 86400, 20, 'Your set viewed by unique viewer (per 24h)', '세트 조회 (24시간당 1회)'),
  ('song_added_to_library', 3, true, 0, 60, 'Add a song to the library', '곡 라이브러리에 추가'),
  ('song_updated_metadata', 1, true, 86400, 10, 'Update song metadata (per song per 24h)', '곡 메타데이터 업데이트'),
  ('template_used', 2, true, 86400, 10, 'Use a template to create a set (per day)', '템플릿 사용'),
  ('invited_user_signed_up', 30, true, 0, 60, 'Invited user signs up', '초대한 사용자 가입'),
  ('invited_user_converted_paid', 200, true, 0, 200, 'Invited user converts to paid (admin verified)', '초대한 사용자 유료 전환'),
  ('weekly_streak_bonus', 50, true, 604800, 50, '7-day activity streak bonus', '7일 연속 활동 보너스'),
  ('community_contribution_bonus', 25, true, 0, 200, 'Community contribution bonus (admin granted)', '커뮤니티 기여 보너스'),
  ('admin_manual_credit', 0, true, 0, 0, 'Manual credit by admin', '관리자 수동 지급'),
  ('admin_manual_debit', 0, true, 0, 0, 'Manual debit by admin', '관리자 수동 차감');

-- =====================================================
-- SEED DATA - STORE ITEMS
-- =====================================================

INSERT INTO public.rewards_store_items (code, name, name_ko, description, description_ko, cost, enabled) VALUES
  ('perk_template_pack_a', 'Template Pack A', '템플릿 팩 A', 'Unlock 5 premium worship set templates', '5개의 프리미엄 예배 템플릿 잠금 해제', 300, true),
  ('perk_premium_trial_7d', '7-Day Premium Trial', '7일 프리미엄 체험', 'Try premium features for 7 days', '7일간 프리미엄 기능 체험', 500, true),
  ('perk_badge_seed_planter', 'Seed Planter Badge', '씨앗 심는자 배지', 'Show off your dedication with this special badge', '특별한 배지로 헌신을 표현하세요', 200, true),
  ('perk_setlist_ai_suggestion_10x', 'AI Suggestions (10x)', 'AI 추천 10회', 'Get 10 AI-powered setlist suggestions', 'AI 기반 세트리스트 추천 10회', 150, true),
  ('perk_export_pack_pdf_ppt', 'Export Pack (PDF/PPT)', '내보내기 팩 (PDF/PPT)', 'Export your sets to PDF and PowerPoint', '세트를 PDF 및 PPT로 내보내기', 400, true);

-- =====================================================
-- HELPER FUNCTION - Auto-create wallet on first access
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_or_create_rewards_wallet(p_user_id UUID)
RETURNS public.rewards_wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.rewards_wallets;
BEGIN
  -- Try to get existing wallet
  SELECT * INTO v_wallet FROM public.rewards_wallets WHERE user_id = p_user_id;
  
  -- If not exists, create one
  IF v_wallet IS NULL THEN
    INSERT INTO public.rewards_wallets (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_wallet;
  END IF;
  
  RETURN v_wallet;
END;
$$;

-- =====================================================
-- TRIGGER - Auto-update updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rewards_wallets_updated_at
  BEFORE UPDATE ON public.rewards_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_rewards_updated_at();

CREATE TRIGGER update_rewards_rules_updated_at
  BEFORE UPDATE ON public.rewards_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_rewards_updated_at();

CREATE TRIGGER update_rewards_settings_updated_at
  BEFORE UPDATE ON public.rewards_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_rewards_updated_at();

CREATE TRIGGER update_rewards_store_items_updated_at
  BEFORE UPDATE ON public.rewards_store_items
  FOR EACH ROW EXECUTE FUNCTION public.update_rewards_updated_at();