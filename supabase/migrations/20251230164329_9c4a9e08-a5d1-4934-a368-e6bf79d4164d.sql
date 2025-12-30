-- Fix current data: Update leader_id for "카나다광림교회 하기오스" to the new owner (최광은)
UPDATE worship_communities 
SET leader_id = '0c97068c-4425-4ae3-b2d0-f1dc4c9553ee'
WHERE id = 'e142a699-3d28-4d01-b47c-f87d6d32fead';

-- Create function to sync community leader when owner role changes
CREATE OR REPLACE FUNCTION sync_community_leader()
RETURNS TRIGGER AS $$
BEGIN
  -- When owner role is assigned, update leader_id in worship_communities
  IF NEW.role = 'owner' THEN
    UPDATE worship_communities 
    SET leader_id = NEW.user_id
    WHERE id = NEW.community_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically sync leader_id on owner role changes
CREATE TRIGGER on_community_owner_change
  AFTER INSERT OR UPDATE OF role ON community_members
  FOR EACH ROW
  WHEN (NEW.role = 'owner')
  EXECUTE FUNCTION sync_community_leader();