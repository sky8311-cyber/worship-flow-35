-- Update award_seeds function to include actor metadata in level_up notifications
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
  v_user_profile RECORD;
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
      
      -- Get user profile for actor info
      SELECT full_name, avatar_url INTO v_user_profile FROM profiles WHERE id = _user_id;
      
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
          'total_seeds', v_new_total,
          'actor_id', _user_id,
          'actor_name', v_user_profile.full_name,
          'actor_avatar', v_user_profile.avatar_url
        )
      );
    END;
  END IF;
  
  RETURN _seeds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;