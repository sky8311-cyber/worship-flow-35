-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'worship_leader', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create worship communities table
CREATE TABLE public.worship_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.worship_communities ENABLE ROW LEVEL SECURITY;

-- Community members junction table
CREATE TABLE public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.worship_communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Community invitations table
CREATE TABLE public.community_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.worship_communities(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

ALTER TABLE public.community_invitations ENABLE ROW LEVEL SECURITY;

-- Update service_sets for multi-tenancy
ALTER TABLE public.service_sets
ADD COLUMN community_id UUID REFERENCES public.worship_communities(id) ON DELETE CASCADE,
ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX idx_service_sets_community ON public.service_sets(community_id);
CREATE INDEX idx_service_sets_created_by ON public.service_sets(created_by);

-- Create comments table
CREATE TABLE public.set_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_set_id UUID REFERENCES public.service_sets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.set_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_set_comments_set ON public.set_comments(service_set_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS Policies for worship_communities
CREATE POLICY "Anyone can view active communities"
ON public.worship_communities FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Worship leaders can create communities"
ON public.worship_communities FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'worship_leader') OR public.is_admin(auth.uid()));

CREATE POLICY "Leaders can update own communities"
ON public.worship_communities FOR UPDATE
TO authenticated
USING (auth.uid() = leader_id);

CREATE POLICY "Leaders can delete own communities"
ON public.worship_communities FOR DELETE
TO authenticated
USING (auth.uid() = leader_id OR public.is_admin(auth.uid()));

-- RLS Policies for community_members
CREATE POLICY "View community members"
ON public.community_members FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = community_members.community_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Leaders can add members"
ON public.community_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.worship_communities wc
    WHERE wc.id = community_id
    AND wc.leader_id = auth.uid()
  )
);

CREATE POLICY "Leaders can remove members"
ON public.community_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.worship_communities wc
    WHERE wc.id = community_id
    AND wc.leader_id = auth.uid()
  )
);

-- RLS Policies for community_invitations
CREATE POLICY "Leaders can view invitations"
ON public.community_invitations FOR SELECT
TO authenticated
USING (
  invited_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.worship_communities wc
    WHERE wc.id = community_id
    AND wc.leader_id = auth.uid()
  )
);

CREATE POLICY "Leaders can create invitations"
ON public.community_invitations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.worship_communities wc
    WHERE wc.id = community_id
    AND wc.leader_id = auth.uid()
  )
);

-- RLS Policies for service_sets (replace existing)
DROP POLICY IF EXISTS "Enable all access for service_sets" ON public.service_sets;

CREATE POLICY "View community service sets"
ON public.service_sets FOR SELECT
TO authenticated
USING (
  is_public = true OR
  public.is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = service_sets.community_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Create service sets"
ON public.service_sets FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.worship_communities wc
    WHERE wc.id = community_id
    AND wc.leader_id = auth.uid()
  )
);

CREATE POLICY "Update own service sets"
ON public.service_sets FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Delete own service sets"
ON public.service_sets FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR public.is_admin(auth.uid()));

-- RLS Policies for set_comments
CREATE POLICY "View set comments"
ON public.set_comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.service_sets ss
    LEFT JOIN public.community_members cm ON cm.community_id = ss.community_id
    WHERE ss.id = service_set_id
    AND (ss.is_public = true OR cm.user_id = auth.uid())
  )
);

CREATE POLICY "Add comments"
ON public.set_comments FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.service_sets ss
    LEFT JOIN public.community_members cm ON cm.community_id = ss.community_id
    WHERE ss.id = service_set_id
    AND (ss.is_public = true OR cm.user_id = auth.uid())
  )
);

CREATE POLICY "Update own comments"
ON public.set_comments FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Delete own comments"
ON public.set_comments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Add trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on worship_communities
CREATE TRIGGER update_communities_updated_at
BEFORE UPDATE ON public.worship_communities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on set_comments
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.set_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();