-- Create church_accounts table for organization-level subscriptions
CREATE TABLE public.church_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  website text,
  billing_email text,
  owner_id uuid NOT NULL REFERENCES public.profiles(id),
  subscription_status text NOT NULL DEFAULT 'trial',
  max_seats integer NOT NULL DEFAULT 5,
  used_seats integer NOT NULL DEFAULT 1,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamp with time zone DEFAULT (now() + interval '14 days'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create church_account_members junction table
CREATE TABLE public.church_account_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_account_id uuid NOT NULL REFERENCES public.church_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(church_account_id, user_id)
);

-- Add church_account_id to worship_communities (optional - communities can exist without a church account)
ALTER TABLE public.worship_communities 
ADD COLUMN church_account_id uuid REFERENCES public.church_accounts(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.church_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_account_members ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is church account member
CREATE OR REPLACE FUNCTION public.is_church_account_member(_user_id uuid, _church_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.church_account_members
    WHERE user_id = _user_id 
      AND church_account_id = _church_account_id
  )
$$;

-- Helper function to check if user is church account admin/owner
CREATE OR REPLACE FUNCTION public.is_church_account_admin(_user_id uuid, _church_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.church_account_members
    WHERE user_id = _user_id 
      AND church_account_id = _church_account_id
      AND role IN ('owner', 'admin')
  )
$$;

-- RLS Policies for church_accounts
CREATE POLICY "Users can view church accounts they belong to"
ON public.church_accounts FOR SELECT
USING (
  is_church_account_member(auth.uid(), id) OR 
  owner_id = auth.uid() OR 
  is_admin(auth.uid())
);

CREATE POLICY "Worship leaders can create church accounts"
ON public.church_accounts FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'worship_leader') AND 
  owner_id = auth.uid()
);

CREATE POLICY "Admins can update their church accounts"
ON public.church_accounts FOR UPDATE
USING (
  is_church_account_admin(auth.uid(), id) OR 
  owner_id = auth.uid() OR 
  is_admin(auth.uid())
);

CREATE POLICY "Owners can delete their church accounts"
ON public.church_accounts FOR DELETE
USING (
  owner_id = auth.uid() OR 
  is_admin(auth.uid())
);

-- RLS Policies for church_account_members
CREATE POLICY "Members can view church account members"
ON public.church_account_members FOR SELECT
USING (
  is_church_account_member(auth.uid(), church_account_id) OR 
  is_admin(auth.uid())
);

CREATE POLICY "Admins can add members to church accounts"
ON public.church_account_members FOR INSERT
WITH CHECK (
  is_church_account_admin(auth.uid(), church_account_id) OR 
  is_admin(auth.uid())
);

CREATE POLICY "Admins can update member roles"
ON public.church_account_members FOR UPDATE
USING (
  is_church_account_admin(auth.uid(), church_account_id) OR 
  is_admin(auth.uid())
);

CREATE POLICY "Admins can remove members"
ON public.church_account_members FOR DELETE
USING (
  is_church_account_admin(auth.uid(), church_account_id) OR 
  user_id = auth.uid() OR 
  is_admin(auth.uid())
);

-- Update trigger for church_accounts
CREATE TRIGGER update_church_accounts_updated_at
BEFORE UPDATE ON public.church_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-add owner as member when church account is created
CREATE OR REPLACE FUNCTION public.handle_new_church_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.church_account_members (church_account_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_church_account_created
AFTER INSERT ON public.church_accounts
FOR EACH ROW EXECUTE FUNCTION public.handle_new_church_account();