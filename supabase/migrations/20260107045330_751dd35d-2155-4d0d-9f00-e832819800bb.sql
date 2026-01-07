-- Create tier_features table for managing feature access by tier
CREATE TABLE public.tier_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  feature_name_ko TEXT,
  description TEXT,
  description_ko TEXT,
  category TEXT NOT NULL,
  tier_member BOOLEAN DEFAULT false,
  tier_worship_leader BOOLEAN DEFAULT false,
  tier_premium BOOLEAN DEFAULT true,
  tier_church BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tier_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read, only admins can modify
CREATE POLICY "Anyone can view tier features"
ON public.tier_features
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage tier features"
ON public.tier_features
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_tier_features_updated_at
BEFORE UPDATE ON public.tier_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial features

-- Analytics Features (Premium + Church)
INSERT INTO public.tier_features (feature_key, feature_name, feature_name_ko, description, description_ko, category, tier_member, tier_worship_leader, tier_premium, tier_church, display_order)
VALUES 
('song_usage_analytics', 'Song Usage Analytics', '곡 사용 분석', 'Track which songs are used most frequently', '가장 자주 사용되는 곡 추적', 'analytics', false, false, true, true, 1),
('set_performance_metrics', 'Set Performance Metrics', '예배 셋 성과 지표', 'View detailed metrics for worship sets', '예배 셋의 상세 지표 확인', 'analytics', false, false, true, true, 2),
('team_engagement_reports', 'Team Engagement Reports', '팀 참여 보고서', 'See how your team engages with sets', '팀의 셋 참여도 확인', 'analytics', false, false, true, true, 3);

-- AI Features (Premium + Church)
INSERT INTO public.tier_features (feature_key, feature_name, feature_name_ko, description, description_ko, category, tier_member, tier_worship_leader, tier_premium, tier_church, display_order)
VALUES 
('ai_song_suggestions', 'AI Song Suggestions', 'AI 곡 추천', 'Get intelligent song recommendations', 'AI 기반 곡 추천 받기', 'ai', false, false, true, true, 10),
('ai_set_assistant', 'AI Set Building Assistant', 'AI 셋 빌딩 어시스턴트', 'Let AI help build your worship sets', 'AI가 예배 셋 구성 도움', 'ai', false, false, true, true, 11),
('ai_lyrics_enrichment', 'AI Lyrics Enrichment', 'AI 가사 보강', 'Automatically enhance song metadata', '곡 메타데이터 자동 보강', 'ai', false, false, true, true, 12);

-- Scheduling Features (Premium + Church)
INSERT INTO public.tier_features (feature_key, feature_name, feature_name_ko, description, description_ko, category, tier_member, tier_worship_leader, tier_premium, tier_church, display_order)
VALUES 
('recurring_templates', 'Recurring Templates', '반복 템플릿', 'Create recurring worship set templates', '반복 예배 셋 템플릿 생성', 'scheduling', false, false, true, true, 20),
('multi_week_planning', 'Multi-Week Planning', '다중 주간 계획', 'Plan worship sets weeks in advance', '몇 주 앞서 예배 셋 계획', 'scheduling', false, false, true, true, 21),
('auto_team_assignment', 'Auto Team Assignment', '자동 팀 배정', 'Automatically assign team members to positions', '팀원을 포지션에 자동 배정', 'scheduling', false, false, true, true, 22);

-- Management Features (Church Only)
INSERT INTO public.tier_features (feature_key, feature_name, feature_name_ko, description, description_ko, category, tier_member, tier_worship_leader, tier_premium, tier_church, display_order)
VALUES 
('multi_community_management', 'Multi-Community Management', '다중 커뮤니티 관리', 'Manage multiple worship communities', '여러 예배 커뮤니티 관리', 'management', false, false, false, true, 30),
('seat_management', 'Seat Management', '좌석 관리', 'Manage team member seats and access', '팀원 좌석 및 접근 관리', 'management', false, false, false, true, 31),
('unlimited_communities', 'Unlimited Communities', '무제한 커뮤니티', 'Create unlimited worship communities', '무제한 예배 커뮤니티 생성', 'management', false, false, false, true, 32);

-- Branding Features (Church Only)
INSERT INTO public.tier_features (feature_key, feature_name, feature_name_ko, description, description_ko, category, tier_member, tier_worship_leader, tier_premium, tier_church, display_order)
VALUES 
('custom_domain', 'Custom Domain', '커스텀 도메인', 'Use your own domain for your church', '교회 전용 도메인 사용', 'branding', false, false, false, true, 40),
('custom_branding', 'Custom Branding', '커스텀 브랜딩', 'Customize colors, logos, and themes', '색상, 로고, 테마 커스터마이징', 'branding', false, false, false, true, 41),
('white_label', 'White Label', '화이트 라벨', 'Remove platform branding', '플랫폼 브랜딩 제거', 'branding', false, false, false, true, 42);

-- Permissions Features (Church Only)
INSERT INTO public.tier_features (feature_key, feature_name, feature_name_ko, description, description_ko, category, tier_member, tier_worship_leader, tier_premium, tier_church, display_order)
VALUES 
('advanced_custom_roles', 'Advanced Custom Roles', '고급 커스텀 역할', 'Create custom roles with fine-grained permissions', '세분화된 권한의 커스텀 역할 생성', 'permissions', false, false, false, true, 50),
('role_based_access', 'Role-Based Access Control', '역할 기반 접근 제어', 'Control access based on custom roles', '커스텀 역할 기반 접근 제어', 'permissions', false, false, false, true, 51);

-- Support Features (Premium + Church)
INSERT INTO public.tier_features (feature_key, feature_name, feature_name_ko, description, description_ko, category, tier_member, tier_worship_leader, tier_premium, tier_church, display_order)
VALUES 
('priority_support', 'Priority Support', '우선 지원', 'Get priority customer support', '우선 고객 지원 받기', 'support', false, false, true, true, 60),
('dedicated_account_manager', 'Dedicated Account Manager', '전담 계정 매니저', 'Get a dedicated account manager', '전담 계정 매니저 배정', 'support', false, false, false, true, 61);