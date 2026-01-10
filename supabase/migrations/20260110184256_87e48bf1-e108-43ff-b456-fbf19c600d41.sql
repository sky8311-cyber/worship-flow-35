-- Add missing seed_activity_type enum values
ALTER TYPE seed_activity_type ADD VALUE IF NOT EXISTS 'signup';
ALTER TYPE seed_activity_type ADD VALUE IF NOT EXISTS 'first_song';
ALTER TYPE seed_activity_type ADD VALUE IF NOT EXISTS 'first_set';
ALTER TYPE seed_activity_type ADD VALUE IF NOT EXISTS 'first_community';
ALTER TYPE seed_activity_type ADD VALUE IF NOT EXISTS 'profile_complete';
ALTER TYPE seed_activity_type ADD VALUE IF NOT EXISTS 'first_invite';
ALTER TYPE seed_activity_type ADD VALUE IF NOT EXISTS 'post_create';
ALTER TYPE seed_activity_type ADD VALUE IF NOT EXISTS 'comment_create';
ALTER TYPE seed_activity_type ADD VALUE IF NOT EXISTS 'like_give';
ALTER TYPE seed_activity_type ADD VALUE IF NOT EXISTS 'song_add';
ALTER TYPE seed_activity_type ADD VALUE IF NOT EXISTS 'set_create';
ALTER TYPE seed_activity_type ADD VALUE IF NOT EXISTS 'score_upload';

-- Strengthen RLS policy with explicit WITH CHECK clause
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Update trigger_profile_seeds with exception handling to prevent profile update failures
CREATE OR REPLACE FUNCTION trigger_profile_seeds()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    -- Avatar upload achievement
    IF NEW.avatar_url IS NOT NULL AND (OLD.avatar_url IS NULL OR OLD.avatar_url != NEW.avatar_url) THEN
      PERFORM award_seeds(NEW.id, 'avatar_upload', 30, 'Avatar uploaded');
    END IF;
    
    -- Profile completion achievement
    IF NEW.full_name IS NOT NULL AND NEW.bio IS NOT NULL AND NEW.location IS NOT NULL THEN
      IF OLD.full_name IS NULL OR OLD.bio IS NULL OR OLD.location IS NULL THEN
        PERFORM award_seeds(NEW.id, 'profile_setup', 50, 'Profile completed');
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the update
    RAISE WARNING 'Profile seeds trigger error: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;