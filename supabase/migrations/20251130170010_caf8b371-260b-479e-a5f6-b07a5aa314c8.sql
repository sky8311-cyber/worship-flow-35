-- Create table for custom role labels in church accounts
CREATE TABLE public.church_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_account_id uuid NOT NULL REFERENCES public.church_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ko text,
  description text,
  color text DEFAULT '#6b7280',
  icon text DEFAULT 'user',
  position integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(church_account_id, name)
);

-- Enable RLS
ALTER TABLE public.church_custom_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Church members can view custom roles"
ON public.church_custom_roles FOR SELECT
USING (is_church_account_member(auth.uid(), church_account_id));

CREATE POLICY "Church admins can manage custom roles"
ON public.church_custom_roles FOR ALL
USING (is_church_account_admin(auth.uid(), church_account_id));

-- Create trigger for updated_at
CREATE TRIGGER update_church_custom_roles_updated_at
BEFORE UPDATE ON public.church_custom_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default roles for existing church accounts
INSERT INTO public.church_custom_roles (church_account_id, name, name_ko, description, icon, color, position)
SELECT 
  id as church_account_id,
  unnest(ARRAY['Pastor', 'Worship Leader', 'Sound Engineer', 'Vocalist', 'Instrumentalist', 'Multimedia']) as name,
  unnest(ARRAY['담임목사', '예배인도자', '음향담당', '보컬', '연주자', '영상담당']) as name_ko,
  unnest(ARRAY['Senior pastor or associate pastor', 'Leads worship services', 'Manages audio equipment', 'Vocal team member', 'Plays instruments', 'Handles video/slides']) as description,
  unnest(ARRAY['church', 'music', 'volume-2', 'mic', 'guitar', 'monitor']) as icon,
  unnest(ARRAY['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']) as color,
  unnest(ARRAY[1, 2, 3, 4, 5, 6]) as position
FROM public.church_accounts;