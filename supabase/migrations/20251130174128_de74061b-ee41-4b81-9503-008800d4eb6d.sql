-- Team Rotation System: Create table to track team rotation schedules
CREATE TABLE IF NOT EXISTS public.team_rotation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_account_id UUID NOT NULL REFERENCES public.church_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ko TEXT,
  description TEXT,
  rotation_pattern TEXT NOT NULL DEFAULT 'weekly', -- weekly, biweekly, monthly
  rotation_start_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Team members assigned to rotation schedules
CREATE TABLE IF NOT EXISTS public.team_rotation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_schedule_id UUID NOT NULL REFERENCES public.team_rotation_schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.church_custom_roles(id) ON DELETE SET NULL,
  rotation_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(rotation_schedule_id, user_id, role_id)
);

-- Track which team is assigned to which service date
CREATE TABLE IF NOT EXISTS public.team_rotation_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_schedule_id UUID NOT NULL REFERENCES public.team_rotation_schedules(id) ON DELETE CASCADE,
  service_set_id UUID REFERENCES public.service_sets(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  rotation_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(rotation_schedule_id, assigned_date)
);

-- Custom domain configuration for church accounts
ALTER TABLE public.church_accounts 
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS domain_status TEXT DEFAULT 'none', -- none, pending, verified, active
ADD COLUMN IF NOT EXISTS domain_verified_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.team_rotation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_rotation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_rotation_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_rotation_schedules
CREATE POLICY "Church admins can manage rotation schedules"
ON public.team_rotation_schedules
FOR ALL
USING (is_church_account_admin(auth.uid(), church_account_id));

CREATE POLICY "Church members can view rotation schedules"
ON public.team_rotation_schedules
FOR SELECT
USING (is_church_account_member(auth.uid(), church_account_id));

-- RLS Policies for team_rotation_members
CREATE POLICY "Church admins can manage rotation members"
ON public.team_rotation_members
FOR ALL
USING (EXISTS (
  SELECT 1 FROM team_rotation_schedules trs
  WHERE trs.id = team_rotation_members.rotation_schedule_id
  AND is_church_account_admin(auth.uid(), trs.church_account_id)
));

CREATE POLICY "Church members can view rotation members"
ON public.team_rotation_members
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM team_rotation_schedules trs
  WHERE trs.id = team_rotation_members.rotation_schedule_id
  AND is_church_account_member(auth.uid(), trs.church_account_id)
));

-- RLS Policies for team_rotation_assignments
CREATE POLICY "Church admins can manage rotation assignments"
ON public.team_rotation_assignments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM team_rotation_schedules trs
  WHERE trs.id = team_rotation_assignments.rotation_schedule_id
  AND is_church_account_admin(auth.uid(), trs.church_account_id)
));

CREATE POLICY "Church members can view rotation assignments"
ON public.team_rotation_assignments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM team_rotation_schedules trs
  WHERE trs.id = team_rotation_assignments.rotation_schedule_id
  AND is_church_account_member(auth.uid(), trs.church_account_id)
));

-- Add triggers for updated_at
CREATE TRIGGER update_team_rotation_schedules_updated_at
  BEFORE UPDATE ON public.team_rotation_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();