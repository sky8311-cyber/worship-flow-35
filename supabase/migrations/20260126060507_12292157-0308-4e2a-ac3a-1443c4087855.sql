-- =============================================
-- Email sender settings table for personalized emails
-- =============================================
CREATE TABLE IF NOT EXISTS public.email_sender_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL DEFAULT 'Kworship',
  sender_title TEXT,
  signature_html TEXT,
  auto_append_signature BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- RLS policies for email_sender_settings
ALTER TABLE public.email_sender_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email settings" ON public.email_sender_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage email settings" ON public.email_sender_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Insert default settings
INSERT INTO public.email_sender_settings (sender_name, sender_title, signature_html, auto_append_signature)
VALUES (
  'Kworship',
  'Kworship Team',
  '<p style="margin-top: 24px; color: #666;">감사합니다,<br><strong>Kworship Team</strong></p><p style="font-size: 12px; color: #888;">📧 hello@kworship.app<br>🌐 https://kworship.app</p>',
  true
);

-- =============================================
-- RPC function: Get users by platform tier
-- =============================================
CREATE OR REPLACE FUNCTION public.get_users_by_platform_tier(tier_type TEXT)
RETURNS TABLE (user_id UUID, email TEXT, full_name TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  CASE tier_type
    -- Team Member: user role only, no worship_leader role
    WHEN 'team_member' THEN
      RETURN QUERY 
      SELECT p.id, p.email, p.full_name FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'user'
      WHERE NOT EXISTS (
        SELECT 1 FROM user_roles ur2 
        WHERE ur2.user_id = p.id AND ur2.role = 'worship_leader'
      ) AND p.email IS NOT NULL;
    
    -- Worship Leader (Basic Member): worship_leader role
    WHEN 'worship_leader' THEN
      RETURN QUERY 
      SELECT p.id, p.email, p.full_name FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'worship_leader'
      WHERE p.email IS NOT NULL;
    
    -- Full Member: worship_leader + premium subscription active
    WHEN 'full_member' THEN
      RETURN QUERY 
      SELECT p.id, p.email, p.full_name FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'worship_leader'
      JOIN premium_subscriptions ps ON ps.user_id = p.id 
        AND ps.subscription_status = 'active'
      WHERE p.email IS NOT NULL;
    
    -- Church Account members
    WHEN 'church_account' THEN
      RETURN QUERY 
      SELECT DISTINCT p.id, p.email, p.full_name FROM profiles p
      JOIN church_account_members cam ON cam.user_id = p.id
      WHERE p.email IS NOT NULL;
    
    -- All users
    WHEN 'all' THEN
      RETURN QUERY 
      SELECT p.id, p.email, p.full_name FROM profiles p
      WHERE p.email IS NOT NULL;
  END CASE;
END;
$$;

-- =============================================
-- RPC function: Get users by community status
-- =============================================
CREATE OR REPLACE FUNCTION public.get_users_by_community_status(status_type TEXT, community_id_param UUID DEFAULT NULL)
RETURNS TABLE (user_id UUID, email TEXT, full_name TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  CASE status_type
    -- Users in any community
    WHEN 'in_community' THEN
      RETURN QUERY 
      SELECT DISTINCT p.id, p.email, p.full_name FROM profiles p
      JOIN community_members cm ON cm.user_id = p.id
      WHERE p.email IS NOT NULL;
    
    -- Users NOT in any community
    WHEN 'not_in_community' THEN
      RETURN QUERY 
      SELECT p.id, p.email, p.full_name FROM profiles p
      WHERE NOT EXISTS (
        SELECT 1 FROM community_members cm WHERE cm.user_id = p.id
      ) AND p.email IS NOT NULL;
    
    -- Community owners (any community)
    WHEN 'community_owner' THEN
      RETURN QUERY 
      SELECT DISTINCT p.id, p.email, p.full_name FROM profiles p
      JOIN community_members cm ON cm.user_id = p.id AND cm.role = 'owner'
      WHERE p.email IS NOT NULL;
    
    -- Community leaders (any community)
    WHEN 'community_leader' THEN
      RETURN QUERY 
      SELECT DISTINCT p.id, p.email, p.full_name FROM profiles p
      JOIN community_members cm ON cm.user_id = p.id AND cm.role = 'community_leader'
      WHERE p.email IS NOT NULL;
    
    -- Community regular members (any community)
    WHEN 'community_member' THEN
      RETURN QUERY 
      SELECT DISTINCT p.id, p.email, p.full_name FROM profiles p
      JOIN community_members cm ON cm.user_id = p.id AND cm.role = 'member'
      WHERE p.email IS NOT NULL;
    
    -- Specific community members
    WHEN 'specific_community' THEN
      RETURN QUERY 
      SELECT DISTINCT p.id, p.email, p.full_name FROM profiles p
      JOIN community_members cm ON cm.user_id = p.id AND cm.community_id = community_id_param
      WHERE p.email IS NOT NULL;
  END CASE;
END;
$$;

-- =============================================
-- RPC function: Get users by activity status
-- =============================================
CREATE OR REPLACE FUNCTION public.get_users_by_activity_status(activity_type TEXT)
RETURNS TABLE (user_id UUID, email TEXT, full_name TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  CASE activity_type
    -- Active in last 7 days
    WHEN 'active_7_days' THEN
      RETURN QUERY 
      SELECT p.id, p.email, p.full_name FROM profiles p
      WHERE p.last_active_at > NOW() - INTERVAL '7 days' AND p.email IS NOT NULL;
    
    -- Semi-active (7-30 days)
    WHEN 'semi_active' THEN
      RETURN QUERY 
      SELECT p.id, p.email, p.full_name FROM profiles p
      WHERE p.last_active_at BETWEEN NOW() - INTERVAL '30 days' AND NOW() - INTERVAL '7 days' 
        AND p.email IS NOT NULL;
    
    -- Inactive (30+ days)
    WHEN 'inactive_30_plus' THEN
      RETURN QUERY 
      SELECT p.id, p.email, p.full_name FROM profiles p
      WHERE (p.last_active_at < NOW() - INTERVAL '30 days' OR p.last_active_at IS NULL) 
        AND p.email IS NOT NULL;
    
    -- New users (joined in last 7 days)
    WHEN 'new_users_7_days' THEN
      RETURN QUERY 
      SELECT p.id, p.email, p.full_name FROM profiles p
      WHERE p.created_at > NOW() - INTERVAL '7 days' AND p.email IS NOT NULL;
    
    -- Has created worship sets
    WHEN 'has_created_sets' THEN
      RETURN QUERY 
      SELECT DISTINCT p.id, p.email, p.full_name FROM profiles p
      JOIN service_sets ss ON ss.created_by = p.id
      WHERE p.email IS NOT NULL;
    
    -- Has NOT created worship sets
    WHEN 'no_sets_created' THEN
      RETURN QUERY 
      SELECT p.id, p.email, p.full_name FROM profiles p
      WHERE NOT EXISTS (SELECT 1 FROM service_sets WHERE created_by = p.id) 
        AND p.email IS NOT NULL;
    
    -- Has posts
    WHEN 'has_posts' THEN
      RETURN QUERY 
      SELECT DISTINCT p.id, p.email, p.full_name FROM profiles p
      JOIN community_posts cp ON cp.author_id = p.id
      WHERE p.email IS NOT NULL;
    
    -- Pending worship leader applications
    WHEN 'pending_wl_applications' THEN
      RETURN QUERY 
      SELECT DISTINCT p.id, p.email, p.full_name FROM profiles p
      JOIN worship_leader_applications wla ON wla.user_id = p.id
      WHERE wla.status = 'pending' AND p.email IS NOT NULL;
  END CASE;
END;
$$;