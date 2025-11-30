-- Create set_components table for worship service components
CREATE TABLE public.set_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_set_id UUID NOT NULL REFERENCES public.service_sets(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  component_type TEXT NOT NULL,
  label TEXT NOT NULL,
  notes TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.set_components ENABLE ROW LEVEL SECURITY;

-- Create RLS policies matching set_songs policies
CREATE POLICY "View set components"
ON public.set_components
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM service_sets ss
    LEFT JOIN community_members cm ON cm.community_id = ss.community_id
    WHERE ss.id = set_components.service_set_id
    AND (
      ss.created_by = auth.uid()
      OR (ss.status = 'published' AND cm.user_id = auth.uid())
      OR is_set_collaborator(auth.uid(), ss.id)
      OR is_admin(auth.uid())
    )
  )
);

CREATE POLICY "Insert set components"
ON public.set_components
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM service_sets ss
    WHERE ss.id = set_components.service_set_id
    AND (
      ss.created_by = auth.uid()
      OR is_set_collaborator(auth.uid(), ss.id)
      OR is_admin(auth.uid())
    )
  )
);

CREATE POLICY "Update set components"
ON public.set_components
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM service_sets ss
    WHERE ss.id = set_components.service_set_id
    AND (
      ss.created_by = auth.uid()
      OR is_set_collaborator(auth.uid(), ss.id)
      OR is_admin(auth.uid())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM service_sets ss
    WHERE ss.id = set_components.service_set_id
    AND (
      ss.created_by = auth.uid()
      OR is_set_collaborator(auth.uid(), ss.id)
      OR is_admin(auth.uid())
    )
  )
);

CREATE POLICY "Delete set components"
ON public.set_components
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM service_sets ss
    WHERE ss.id = set_components.service_set_id
    AND (
      ss.created_by = auth.uid()
      OR is_set_collaborator(auth.uid(), ss.id)
      OR is_admin(auth.uid())
    )
  )
);