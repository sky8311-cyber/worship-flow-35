-- Create community_join_requests table
CREATE TABLE community_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES worship_communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Enable RLS
ALTER TABLE community_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own join requests
CREATE POLICY "Users can view their own join requests"
ON community_join_requests FOR SELECT
USING (user_id = auth.uid());

-- Leaders can view community join requests
CREATE POLICY "Leaders can view community join requests"
ON community_join_requests FOR SELECT
USING (
  is_community_leader(auth.uid(), community_id) 
  OR EXISTS (SELECT 1 FROM worship_communities wc WHERE wc.id = community_id AND wc.leader_id = auth.uid())
  OR is_admin(auth.uid())
);

-- Users can create join requests
CREATE POLICY "Users can create join requests"
ON community_join_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Leaders can update join requests
CREATE POLICY "Leaders can update join requests"
ON community_join_requests FOR UPDATE
USING (
  is_community_leader(auth.uid(), community_id) 
  OR EXISTS (SELECT 1 FROM worship_communities wc WHERE wc.id = community_id AND wc.leader_id = auth.uid())
  OR is_admin(auth.uid())
);

-- Users can delete their own pending requests
CREATE POLICY "Users can delete their own pending requests"
ON community_join_requests FOR DELETE
USING (user_id = auth.uid() AND status = 'pending');

-- Notify leaders when join request is created
CREATE OR REPLACE FUNCTION notify_leaders_join_request()
RETURNS TRIGGER AS $$
DECLARE
  v_requester_name TEXT;
  v_requester_avatar TEXT;
  v_community_name TEXT;
  v_leader RECORD;
BEGIN
  SELECT full_name, avatar_url INTO v_requester_name, v_requester_avatar
  FROM profiles WHERE id = NEW.user_id;
  
  SELECT name INTO v_community_name
  FROM worship_communities WHERE id = NEW.community_id;
  
  FOR v_leader IN 
    SELECT leader_id AS user_id FROM worship_communities WHERE id = NEW.community_id
    UNION
    SELECT user_id FROM community_members WHERE community_id = NEW.community_id AND role = 'community_leader'
  LOOP
    INSERT INTO notifications (user_id, type, title, message, related_id, related_type, metadata)
    VALUES (
      v_leader.user_id,
      'join_request',
      'New Join Request',
      v_requester_name || ' requested to join ' || v_community_name,
      NEW.id,
      'join_request',
      jsonb_build_object(
        'actor_name', v_requester_name,
        'actor_avatar', v_requester_avatar,
        'community_name', v_community_name,
        'community_id', NEW.community_id
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_join_request_created
AFTER INSERT ON community_join_requests
FOR EACH ROW EXECUTE FUNCTION notify_leaders_join_request();

-- Notify requester of approval/rejection and auto-add to members on approval
CREATE OR REPLACE FUNCTION notify_join_request_result()
RETURNS TRIGGER AS $$
DECLARE
  v_community_name TEXT;
BEGIN
  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
    SELECT name INTO v_community_name
    FROM worship_communities WHERE id = NEW.community_id;
    
    IF NEW.status = 'approved' THEN
      INSERT INTO community_members (community_id, user_id, role)
      VALUES (NEW.community_id, NEW.user_id, 'member')
      ON CONFLICT DO NOTHING;
    END IF;
    
    INSERT INTO notifications (user_id, type, title, message, related_id, related_type, metadata)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'approved' THEN 'join_approved' ELSE 'join_rejected' END,
      CASE WHEN NEW.status = 'approved' THEN 'Join Request Approved' ELSE 'Join Request Rejected' END,
      CASE WHEN NEW.status = 'approved' 
           THEN 'Your request to join ' || v_community_name || ' was approved!'
           ELSE 'Your request to join ' || v_community_name || ' was declined.'
      END,
      NEW.community_id,
      'community',
      jsonb_build_object('community_name', v_community_name)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_join_request_result
AFTER UPDATE ON community_join_requests
FOR EACH ROW EXECUTE FUNCTION notify_join_request_result();