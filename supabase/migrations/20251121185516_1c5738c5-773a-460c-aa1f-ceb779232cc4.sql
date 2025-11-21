-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES worship_communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  
  -- Event basic info
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('rehearsal', 'meeting', 'worship_service', 'other')),
  
  -- Date/time
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  
  -- Notification settings
  notification_enabled BOOLEAN DEFAULT true,
  notification_time INTEGER DEFAULT 60,
  
  -- Metadata
  location TEXT,
  attendees TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_calendar_events_community ON calendar_events(community_id);
CREATE INDEX idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "View community events"
ON calendar_events FOR SELECT
USING (
  is_community_member(auth.uid(), community_id)
);

CREATE POLICY "Create events"
ON calendar_events FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) 
  OR has_role(auth.uid(), 'worship_leader'::app_role)
  OR (EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = calendar_events.community_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'community_leader'
  ))
);

CREATE POLICY "Update own events"
ON calendar_events FOR UPDATE
USING (
  created_by = auth.uid() 
  OR is_admin(auth.uid())
  OR (EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = calendar_events.community_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'community_leader'
  ))
);

CREATE POLICY "Delete own events"
ON calendar_events FOR DELETE
USING (
  created_by = auth.uid() 
  OR is_admin(auth.uid())
  OR (EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = calendar_events.community_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'community_leader'
  ))
);

-- Add trigger for updated_at
CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON calendar_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();