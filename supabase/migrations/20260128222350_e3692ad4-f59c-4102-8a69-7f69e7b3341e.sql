-- Create sandbox_testers table for feature override access
CREATE TABLE public.sandbox_testers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  note TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.sandbox_testers ENABLE ROW LEVEL SECURITY;

-- Admin can manage all sandbox testers
CREATE POLICY "Admin can manage sandbox testers" ON public.sandbox_testers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Users can check their own tester status
CREATE POLICY "Users can check own tester status" ON public.sandbox_testers
  FOR SELECT USING (user_id = auth.uid());

-- Insert testworship@test.com as sandbox tester (find user by email in profiles)
INSERT INTO public.sandbox_testers (user_id, features, note, enabled)
SELECT 
  p.id,
  ARRAY['premium_menu_visible', 'premium_enabled', 'church_subscription_enabled', 'church_menu_visible'],
  'Toss 결제 감사용 계정',
  true
FROM public.profiles p
WHERE p.email = 'testworship@test.com'
ON CONFLICT (user_id) DO NOTHING;