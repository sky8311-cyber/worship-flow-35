-- Create membership_products table for admin-configurable pricing
CREATE TABLE public.membership_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key TEXT UNIQUE NOT NULL,  -- 'full_membership' | 'community_account'
  
  -- Display Info
  display_name_en TEXT NOT NULL,
  display_name_ko TEXT NOT NULL,
  description_en TEXT,
  description_ko TEXT,
  
  -- Pricing (stored in cents/won)
  price_usd INTEGER NOT NULL,        -- e.g., 4999 = $49.99
  price_krw INTEGER NOT NULL,        -- e.g., 59000 = ₩59,000
  
  -- Billing Cycle
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  billing_cycle_label_en TEXT,       -- "per year" | "per month"
  billing_cycle_label_ko TEXT,       -- "연간" | "월간"
  
  -- Trial Period
  trial_days INTEGER DEFAULT 7,
  
  -- Stripe Integration
  stripe_price_id_usd TEXT,
  stripe_price_id_krw TEXT,
  stripe_product_id TEXT,
  
  -- Toss Integration (Future)
  toss_plan_id TEXT,
  
  -- Feature Gating
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.membership_products ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admin can manage all products
CREATE POLICY "Admin can manage products" ON public.membership_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policy: Anyone can read active products (for pricing display)
CREATE POLICY "Anyone can read active products" ON public.membership_products
  FOR SELECT USING (is_active = true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_membership_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamps
CREATE TRIGGER update_membership_products_updated_at
  BEFORE UPDATE ON public.membership_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_membership_products_updated_at();

-- Insert initial data
INSERT INTO public.membership_products (
  product_key, 
  display_name_en, 
  display_name_ko, 
  description_en,
  description_ko,
  price_usd, 
  price_krw, 
  billing_cycle, 
  billing_cycle_label_en,
  billing_cycle_label_ko,
  trial_days,
  stripe_price_id_usd
) VALUES 
  (
    'full_membership', 
    'Full Membership', 
    '정식 멤버십', 
    'Unlock all premium features with annual membership',
    '연간 멤버십으로 모든 프리미엄 기능을 이용하세요',
    4999, 
    59000, 
    'yearly', 
    'per year',
    '연간',
    7,
    NULL  -- Will be set after Stripe product creation
  ),
  (
    'community_account', 
    'Community Account', 
    '공동체 계정', 
    'Team features for your worship community',
    '예배 공동체를 위한 팀 기능',
    3999, 
    39900, 
    'monthly', 
    'per month',
    '월간',
    30,
    'price_1SZEgWD3OASKwHF09K8qTBaf'  -- Existing Stripe price
  );