
-- Create deduct_seeds function for removing points when content is deleted
CREATE OR REPLACE FUNCTION public.deduct_seeds(
  _user_id uuid, 
  _activity_type seed_activity_type, 
  _seeds integer, 
  _description text DEFAULT NULL, 
  _related_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_total INTEGER;
  v_new_total INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get current total
  SELECT COALESCE(total_seeds, 0) INTO v_current_total 
  FROM user_seeds WHERE user_id = _user_id;
  
  -- If user has no seeds record, nothing to deduct
  IF v_current_total IS NULL OR v_current_total = 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculate new total (minimum 0)
  v_new_total := GREATEST(0, v_current_total - _seeds);
  
  -- Record negative transaction
  INSERT INTO seed_transactions (user_id, activity_type, seeds_earned, description, related_id)
  VALUES (_user_id, _activity_type, -_seeds, _description, _related_id);
  
  -- Update total seeds
  UPDATE user_seeds 
  SET total_seeds = v_new_total, updated_at = now()
  WHERE user_id = _user_id;
  
  -- Recalculate level (allow level down, no notification)
  SELECT level INTO v_new_level 
  FROM seed_levels 
  WHERE v_new_total >= min_seeds AND (max_seeds IS NULL OR v_new_total <= max_seeds);
  
  -- Update level if changed
  IF v_new_level IS NOT NULL THEN
    UPDATE user_seeds SET current_level = v_new_level WHERE user_id = _user_id;
  END IF;
  
  RETURN _seeds;
END;
$$;

-- Trigger function for worship set deletion
CREATE OR REPLACE FUNCTION public.trigger_set_deleted_seeds()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.created_by IS NOT NULL THEN
    PERFORM deduct_seeds(
      OLD.created_by, 
      'worship_set_created', 
      15, 
      'Worship set deleted: ' || COALESCE(OLD.service_name, 'Untitled'), 
      OLD.id
    );
  END IF;
  RETURN OLD;
END;
$$;

-- Create trigger for worship set deletion
DROP TRIGGER IF EXISTS on_set_deleted_deduct_seeds ON service_sets;
CREATE TRIGGER on_set_deleted_deduct_seeds
BEFORE DELETE ON service_sets
FOR EACH ROW EXECUTE FUNCTION trigger_set_deleted_seeds();

-- Trigger function for song deletion
CREATE OR REPLACE FUNCTION public.trigger_song_deleted_seeds()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.created_by IS NOT NULL THEN
    PERFORM deduct_seeds(
      OLD.created_by, 
      'song_added', 
      10, 
      'Song deleted: ' || COALESCE(OLD.title, 'Untitled'), 
      OLD.id
    );
  END IF;
  RETURN OLD;
END;
$$;

-- Create trigger for song deletion
DROP TRIGGER IF EXISTS on_song_deleted_deduct_seeds ON songs;
CREATE TRIGGER on_song_deleted_deduct_seeds
BEFORE DELETE ON songs
FOR EACH ROW EXECUTE FUNCTION trigger_song_deleted_seeds();

-- Trigger function for community post deletion
CREATE OR REPLACE FUNCTION public.trigger_post_deleted_seeds()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.author_id IS NOT NULL THEN
    PERFORM deduct_seeds(
      OLD.author_id, 
      'community_post', 
      5, 
      'Community post deleted', 
      OLD.id
    );
  END IF;
  RETURN OLD;
END;
$$;

-- Create trigger for community post deletion
DROP TRIGGER IF EXISTS on_post_deleted_deduct_seeds ON community_posts;
CREATE TRIGGER on_post_deleted_deduct_seeds
BEFORE DELETE ON community_posts
FOR EACH ROW EXECUTE FUNCTION trigger_post_deleted_seeds();

-- Trigger function for score deletion
CREATE OR REPLACE FUNCTION public.trigger_score_deleted_seeds()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uploader_id UUID;
BEGIN
  -- Find the original uploader from seed_transactions
  SELECT user_id INTO v_uploader_id
  FROM seed_transactions
  WHERE related_id = OLD.song_id 
    AND activity_type = 'score_uploaded'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_uploader_id IS NOT NULL THEN
    PERFORM deduct_seeds(
      v_uploader_id, 
      'score_uploaded', 
      8, 
      'Score deleted', 
      OLD.song_id
    );
  END IF;
  RETURN OLD;
END;
$$;

-- Create trigger for score deletion
DROP TRIGGER IF EXISTS on_score_deleted_deduct_seeds ON song_scores;
CREATE TRIGGER on_score_deleted_deduct_seeds
BEFORE DELETE ON song_scores
FOR EACH ROW EXECUTE FUNCTION trigger_score_deleted_seeds();

-- Update trigger_set_published_seeds to handle unpublishing
CREATE OR REPLACE FUNCTION public.trigger_set_published_seeds()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Publish: draft → published
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') AND NEW.created_by IS NOT NULL THEN
    PERFORM award_seeds(NEW.created_by, 'first_set_published', 40, 'First worship set published', NEW.id);
    PERFORM award_seeds(NEW.created_by, 'worship_set_published', 10, 'Worship set published: ' || NEW.service_name, NEW.id);
  END IF;
  
  -- Unpublish: published → draft
  IF OLD.status = 'published' AND NEW.status = 'draft' AND NEW.created_by IS NOT NULL THEN
    PERFORM deduct_seeds(NEW.created_by, 'worship_set_published', 10, 'Worship set unpublished: ' || NEW.service_name, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;
