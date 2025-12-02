-- Create seed activity type enum
CREATE TYPE seed_activity_type AS ENUM (
  'profile_setup',
  'avatar_upload', 
  'first_song_added',
  'first_set_created',
  'first_set_published',
  'first_team_invite',
  'first_community_post',
  'song_added',
  'song_edited',
  'worship_set_created',
  'worship_set_published',
  'community_post',
  'score_uploaded',
  'lyrics_added',
  'admin_bonus'
);

-- Create seed levels table
CREATE TABLE seed_levels (
  id SERIAL PRIMARY KEY,
  level INTEGER UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  emoji TEXT NOT NULL,
  min_seeds INTEGER NOT NULL,
  max_seeds INTEGER,
  badge_color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert level data
INSERT INTO seed_levels (level, name_en, name_ko, emoji, min_seeds, max_seeds, badge_color) VALUES
(1, 'Sprout', '새싹', '🌱', 0, 99, '#a3e635'),
(2, 'Seedling', '묘목', '🌿', 100, 299, '#22c55e'),
(3, 'Leaf', '잎새', '🍃', 300, 599, '#16a34a'),
(4, 'Branch', '가지', '🌳', 600, 1199, '#15803d'),
(5, 'Tree', '나무', '🌲', 1200, 2499, '#166534'),
(6, 'Fruit', '열매', '🍎', 2500, 3999, '#f97316'),
(7, 'Forest', '숲', '🌳🌲🌳', 4000, NULL, '#eab308');

-- Create user seeds table
CREATE TABLE user_seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_seeds INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1 REFERENCES seed_levels(level),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create seed transactions log table
CREATE TABLE seed_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type seed_activity_type NOT NULL,
  seeds_earned INTEGER NOT NULL,
  description TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create seed achievements table
CREATE TABLE seed_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type seed_activity_type NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Create seed daily caps table
CREATE TABLE seed_daily_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type seed_activity_type NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, activity_type, activity_date)
);

-- Enable RLS on all tables
ALTER TABLE user_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_daily_caps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_seeds
CREATE POLICY "Users can view all seed data" ON user_seeds
FOR SELECT USING (true);

CREATE POLICY "System can manage seeds" ON user_seeds
FOR ALL USING (auth.uid() IS NULL);

-- RLS Policies for seed_transactions
CREATE POLICY "Users can view all transactions" ON seed_transactions
FOR SELECT USING (true);

-- RLS Policies for seed_achievements
CREATE POLICY "Public can view achievements" ON seed_achievements
FOR SELECT USING (true);

-- RLS Policies for seed_levels
CREATE POLICY "Anyone can view levels" ON seed_levels
FOR SELECT USING (true);

-- RLS Policies for seed_daily_caps
CREATE POLICY "Users can view own caps" ON seed_daily_caps
FOR SELECT USING (user_id = auth.uid());

-- Create award_seeds function
CREATE OR REPLACE FUNCTION award_seeds(
  _user_id UUID,
  _activity_type seed_activity_type,
  _seeds INTEGER,
  _description TEXT DEFAULT NULL,
  _related_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_is_one_time BOOLEAN;
  v_daily_cap INTEGER;
  v_current_daily_count INTEGER;
  v_new_total INTEGER;
  v_new_level INTEGER;
  v_old_level INTEGER;
BEGIN
  -- Check if one-time achievement
  v_is_one_time := _activity_type IN (
    'profile_setup', 'avatar_upload', 'first_song_added', 
    'first_set_created', 'first_set_published', 
    'first_team_invite', 'first_community_post'
  );
  
  IF v_is_one_time THEN
    -- Check if already earned
    IF EXISTS (SELECT 1 FROM seed_achievements WHERE user_id = _user_id AND achievement_type = _activity_type) THEN
      RETURN 0;
    END IF;
    
    -- Record achievement
    INSERT INTO seed_achievements (user_id, achievement_type) VALUES (_user_id, _activity_type);
  ELSE
    -- Check daily cap
    v_daily_cap := CASE _activity_type
      WHEN 'song_added' THEN 5
      WHEN 'song_edited' THEN 10
      WHEN 'worship_set_created' THEN 3
      WHEN 'worship_set_published' THEN 3
      WHEN 'community_post' THEN 3
      WHEN 'score_uploaded' THEN 10
      WHEN 'lyrics_added' THEN 10
      ELSE 999
    END;
    
    SELECT COALESCE(count, 0) INTO v_current_daily_count
    FROM seed_daily_caps
    WHERE user_id = _user_id AND activity_type = _activity_type AND activity_date = CURRENT_DATE;
    
    IF v_current_daily_count >= v_daily_cap THEN
      RETURN 0;
    END IF;
    
    -- Update daily count
    INSERT INTO seed_daily_caps (user_id, activity_type, activity_date, count)
    VALUES (_user_id, _activity_type, CURRENT_DATE, 1)
    ON CONFLICT (user_id, activity_type, activity_date)
    DO UPDATE SET count = seed_daily_caps.count + 1;
  END IF;
  
  -- Record transaction
  INSERT INTO seed_transactions (user_id, activity_type, seeds_earned, description, related_id)
  VALUES (_user_id, _activity_type, _seeds, _description, _related_id);
  
  -- Get old level
  SELECT COALESCE(current_level, 1) INTO v_old_level FROM user_seeds WHERE user_id = _user_id;
  
  -- Update total seeds
  INSERT INTO user_seeds (user_id, total_seeds, current_level)
  VALUES (_user_id, _seeds, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_seeds = user_seeds.total_seeds + _seeds,
    updated_at = now();
  
  -- Calculate new level
  SELECT total_seeds INTO v_new_total FROM user_seeds WHERE user_id = _user_id;
  SELECT level INTO v_new_level FROM seed_levels 
  WHERE v_new_total >= min_seeds AND (max_seeds IS NULL OR v_new_total <= max_seeds);
  
  -- Update level
  UPDATE user_seeds SET current_level = v_new_level WHERE user_id = _user_id;
  
  -- Send level up notification if level increased
  IF v_new_level > v_old_level THEN
    DECLARE
      v_level_info RECORD;
    BEGIN
      SELECT * INTO v_level_info FROM seed_levels WHERE level = v_new_level;
      
      INSERT INTO notifications (user_id, type, title, message, related_id, related_type, metadata)
      VALUES (
        _user_id,
        'level_up',
        'Level Up!',
        'Congratulations! You reached Level ' || v_new_level || ' (' || v_level_info.name_ko || ')!',
        NULL,
        'seeds',
        jsonb_build_object(
          'new_level', v_new_level,
          'level_name_ko', v_level_info.name_ko,
          'level_name_en', v_level_info.name_en,
          'emoji', v_level_info.emoji,
          'total_seeds', v_new_total
        )
      );
    END;
  END IF;
  
  RETURN _seeds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for song creation
CREATE OR REPLACE FUNCTION trigger_song_seeds()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    PERFORM award_seeds(NEW.created_by, 'first_song_added', 30, 'First song added: ' || NEW.title, NEW.id);
    PERFORM award_seeds(NEW.created_by, 'song_added', 10, 'Song added: ' || NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_song_created_award_seeds
AFTER INSERT ON songs
FOR EACH ROW EXECUTE FUNCTION trigger_song_seeds();

-- Trigger for song edit
CREATE OR REPLACE FUNCTION trigger_song_edit_seeds()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND (OLD.title != NEW.title OR OLD.lyrics != NEW.lyrics OR OLD.artist != NEW.artist) THEN
    PERFORM award_seeds(auth.uid(), 'song_edited', 3, 'Song edited: ' || NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_song_updated_award_seeds
AFTER UPDATE ON songs
FOR EACH ROW EXECUTE FUNCTION trigger_song_edit_seeds();

-- Trigger for worship set creation
CREATE OR REPLACE FUNCTION trigger_set_created_seeds()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    PERFORM award_seeds(NEW.created_by, 'first_set_created', 30, 'First worship set created', NEW.id);
    PERFORM award_seeds(NEW.created_by, 'worship_set_created', 15, 'Worship set created: ' || NEW.service_name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_set_created_award_seeds
AFTER INSERT ON service_sets
FOR EACH ROW EXECUTE FUNCTION trigger_set_created_seeds();

-- Trigger for worship set publishing
CREATE OR REPLACE FUNCTION trigger_set_published_seeds()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') AND NEW.created_by IS NOT NULL THEN
    PERFORM award_seeds(NEW.created_by, 'first_set_published', 40, 'First worship set published', NEW.id);
    PERFORM award_seeds(NEW.created_by, 'worship_set_published', 10, 'Worship set published: ' || NEW.service_name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_set_published_award_seeds
AFTER UPDATE ON service_sets
FOR EACH ROW EXECUTE FUNCTION trigger_set_published_seeds();

-- Trigger for community post
CREATE OR REPLACE FUNCTION trigger_post_seeds()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.author_id IS NOT NULL THEN
    PERFORM award_seeds(NEW.author_id, 'first_community_post', 20, 'First community post', NEW.id);
    PERFORM award_seeds(NEW.author_id, 'community_post', 5, 'Community post', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_post_created_award_seeds
AFTER INSERT ON community_posts
FOR EACH ROW EXECUTE FUNCTION trigger_post_seeds();

-- Trigger for profile completion
CREATE OR REPLACE FUNCTION trigger_profile_seeds()
RETURNS TRIGGER AS $$
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_profile_updated_award_seeds
AFTER UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION trigger_profile_seeds();

-- Trigger for team invite acceptance
CREATE OR REPLACE FUNCTION trigger_invite_seeds()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    PERFORM award_seeds(NEW.invited_by, 'first_team_invite', 40, 'First team invite accepted');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_invite_accepted_award_seeds
AFTER UPDATE ON community_invitations
FOR EACH ROW EXECUTE FUNCTION trigger_invite_seeds();

-- Trigger for score upload (song_scores table)
CREATE OR REPLACE FUNCTION trigger_score_seeds()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    PERFORM award_seeds(auth.uid(), 'score_uploaded', 8, 'Score uploaded for song', NEW.song_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_score_uploaded_award_seeds
AFTER INSERT ON song_scores
FOR EACH ROW EXECUTE FUNCTION trigger_score_seeds();

-- Trigger for lyrics added to set_songs
CREATE OR REPLACE FUNCTION trigger_lyrics_seeds()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lyrics IS NOT NULL AND (OLD.lyrics IS NULL OR OLD.lyrics = '') AND auth.uid() IS NOT NULL THEN
    PERFORM award_seeds(auth.uid(), 'lyrics_added', 5, 'Lyrics added to worship set', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_lyrics_added_award_seeds
AFTER UPDATE ON set_songs
FOR EACH ROW EXECUTE FUNCTION trigger_lyrics_seeds();