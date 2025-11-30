-- Create table for available positions in worship sets
CREATE TABLE public.worship_set_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_set_id uuid REFERENCES public.service_sets(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES public.church_custom_roles(id) ON DELETE CASCADE NOT NULL,
  slots integer DEFAULT 1 NOT NULL CHECK (slots > 0),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table for position sign-ups/assignments
CREATE TABLE public.worship_set_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid REFERENCES public.worship_set_positions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  assigned_by uuid, -- null if self-signup, user_id if leader assigned
  status text DEFAULT 'confirmed' NOT NULL CHECK (status IN ('pending', 'confirmed', 'declined')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(position_id, user_id)
);

-- Enable RLS
ALTER TABLE public.worship_set_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_set_signups ENABLE ROW LEVEL SECURITY;

-- RLS policies for worship_set_positions
CREATE POLICY "View positions for accessible sets"
ON public.worship_set_positions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.service_sets ss
    LEFT JOIN public.community_members cm ON cm.community_id = ss.community_id
    WHERE ss.id = worship_set_positions.service_set_id
    AND (
      ss.created_by = auth.uid()
      OR (ss.status = 'published' AND cm.user_id = auth.uid())
      OR is_admin(auth.uid())
    )
  )
);

CREATE POLICY "Manage positions for own sets"
ON public.worship_set_positions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.service_sets ss
    WHERE ss.id = worship_set_positions.service_set_id
    AND (ss.created_by = auth.uid() OR is_admin(auth.uid()))
  )
);

-- RLS policies for worship_set_signups
CREATE POLICY "View signups for accessible positions"
ON public.worship_set_signups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.worship_set_positions wsp
    JOIN public.service_sets ss ON ss.id = wsp.service_set_id
    LEFT JOIN public.community_members cm ON cm.community_id = ss.community_id
    WHERE wsp.id = worship_set_signups.position_id
    AND (
      ss.created_by = auth.uid()
      OR (ss.status = 'published' AND cm.user_id = auth.uid())
      OR is_admin(auth.uid())
    )
  )
);

CREATE POLICY "Users can self-signup"
ON public.worship_set_signups FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.worship_set_positions wsp
    JOIN public.service_sets ss ON ss.id = wsp.service_set_id
    JOIN public.community_members cm ON cm.community_id = ss.community_id
    WHERE wsp.id = worship_set_signups.position_id
    AND ss.status = 'published'
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Leaders can manage signups"
ON public.worship_set_signups FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.worship_set_positions wsp
    JOIN public.service_sets ss ON ss.id = wsp.service_set_id
    WHERE wsp.id = worship_set_signups.position_id
    AND (ss.created_by = auth.uid() OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Users can remove own signup"
ON public.worship_set_signups FOR DELETE
USING (user_id = auth.uid());