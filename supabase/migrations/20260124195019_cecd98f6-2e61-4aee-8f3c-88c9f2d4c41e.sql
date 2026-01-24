-- Add RSVP column to calendar_events
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS rsvp_enabled BOOLEAN DEFAULT false;

-- Create event_rsvp_responses table
CREATE TABLE IF NOT EXISTS public.event_rsvp_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('attending', 'not_attending')),
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_rsvp_responses ENABLE ROW LEVEL SECURITY;

-- Users can manage their own RSVP
CREATE POLICY "Users can manage their own RSVP"
ON public.event_rsvp_responses
FOR ALL
USING (auth.uid() = user_id);

-- Community members can view RSVPs for events in their communities
CREATE POLICY "Community members can view RSVPs"
ON public.event_rsvp_responses
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM calendar_events ce
  JOIN community_members cm ON cm.community_id = ce.community_id
  WHERE ce.id = event_rsvp_responses.event_id
  AND cm.user_id = auth.uid()
));

-- Add team_rotation_enabled flag
INSERT INTO public.platform_feature_flags (key, enabled)
VALUES ('team_rotation_enabled', false)
ON CONFLICT (key) DO NOTHING;