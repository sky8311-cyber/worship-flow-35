-- Add assigned_to and content columns to set_components
ALTER TABLE public.set_components 
ADD COLUMN assigned_to TEXT,
ADD COLUMN content TEXT;

-- Create worship_set_templates table
CREATE TABLE public.worship_set_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  community_id UUID REFERENCES public.worship_communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_name TEXT,
  target_audience TEXT,
  worship_leader TEXT,
  band_name TEXT,
  scripture_reference TEXT,
  theme TEXT,
  worship_duration INTEGER,
  service_time TIME,
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create template_components table
CREATE TABLE public.template_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.worship_set_templates(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  component_type TEXT NOT NULL,
  label TEXT NOT NULL,
  default_assigned_to TEXT,
  default_content TEXT,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create recurring_schedules table
CREATE TABLE public.recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.worship_set_templates(id) ON DELETE CASCADE NOT NULL,
  pattern TEXT NOT NULL,
  interval_value INTEGER DEFAULT 1,
  days_of_week INTEGER[],
  day_of_month INTEGER,
  nth_weekday INTEGER,
  weekday_for_nth INTEGER,
  start_date DATE NOT NULL,
  end_date DATE,
  occurrence_count INTEGER,
  create_days_before INTEGER DEFAULT 5,
  create_at_time TIME DEFAULT '09:00',
  is_active BOOLEAN DEFAULT true,
  last_generated_date DATE,
  next_generation_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.worship_set_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for worship_set_templates
CREATE POLICY "View own or community templates"
ON public.worship_set_templates
FOR SELECT
USING (
  created_by = auth.uid() 
  OR is_community_member(auth.uid(), community_id)
  OR is_admin(auth.uid())
);

CREATE POLICY "Create own templates"
ON public.worship_set_templates
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (has_role(auth.uid(), 'worship_leader') OR is_admin(auth.uid()) OR is_community_leader(auth.uid(), community_id))
);

CREATE POLICY "Update own templates"
ON public.worship_set_templates
FOR UPDATE
USING (created_by = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Delete own templates"
ON public.worship_set_templates
FOR DELETE
USING (created_by = auth.uid() OR is_admin(auth.uid()));

-- RLS Policies for template_components
CREATE POLICY "View template components"
ON public.template_components
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.worship_set_templates t
    WHERE t.id = template_components.template_id
    AND (t.created_by = auth.uid() OR is_community_member(auth.uid(), t.community_id) OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Manage template components"
ON public.template_components
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.worship_set_templates t
    WHERE t.id = template_components.template_id
    AND (t.created_by = auth.uid() OR is_admin(auth.uid()))
  )
);

-- RLS Policies for recurring_schedules
CREATE POLICY "View recurring schedules"
ON public.recurring_schedules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.worship_set_templates t
    WHERE t.id = recurring_schedules.template_id
    AND (t.created_by = auth.uid() OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Manage recurring schedules"
ON public.recurring_schedules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.worship_set_templates t
    WHERE t.id = recurring_schedules.template_id
    AND (t.created_by = auth.uid() OR is_admin(auth.uid()))
  )
);

-- Create trigger for updated_at on worship_set_templates
CREATE TRIGGER update_worship_set_templates_updated_at
BEFORE UPDATE ON public.worship_set_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on recurring_schedules
CREATE TRIGGER update_recurring_schedules_updated_at
BEFORE UPDATE ON public.recurring_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();