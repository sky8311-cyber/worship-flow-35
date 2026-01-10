-- Fix duplicate level-up notifications by checking for existing notification before inserting
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
  v_level_info RECORD;
  v_user_profile RECORD;
  v_existing_notification_count INTEGER;
BEGIN
  -- Check if this is a one-time activity type
  v_is_one_time := _activity_type IN ('signup', 'first_song', 'first_set', 'first_community', 'profile_complete', 'first_invite');
  
  -- For one-time activities, check if already earned
  IF v_is_one_time THEN
    IF EXISTS (
      SELECT 1 FROM seed_transactions 
      WHERE user_id = _user_id AND activity_type = _activity_type
    ) THEN
      RETURN 0; -- Already earned this one-time reward
    END IF;
  END IF;
  
  -- Check daily cap for repeatable activities
  IF NOT v_is_one_time THEN
    SELECT COALESCE(SUM(count), 0) INTO v_current_daily_count
    FROM seed_daily_caps
    WHERE user_id = _user_id 
      AND activity_type = _activity_type 
      AND activity_date = CURRENT_DATE;
    
    -- Get daily cap for this activity type (default 10)
    v_daily_cap := CASE _activity_type
      WHEN 'post_create' THEN 5
      WHEN 'comment_create' THEN 10
      WHEN 'like_give' THEN 20
      WHEN 'song_add' THEN 10
      WHEN 'set_create' THEN 5
      WHEN 'score_upload' THEN 10
      ELSE 10
    END;
    
    IF v_current_daily_count >= v_daily_cap THEN
      RETURN 0; -- Daily cap reached
    END IF;
    
    -- Update daily cap counter
    INSERT INTO seed_daily_caps (user_id, activity_type, activity_date, count)
    VALUES (_user_id, _activity_type, CURRENT_DATE, 1)
    ON CONFLICT (user_id, activity_type, activity_date)
    DO UPDATE SET count = seed_daily_caps.count + 1;
  END IF;
  
  -- Get current level before adding seeds
  SELECT COALESCE(
    (SELECT level FROM seed_levels WHERE min_seeds <= COALESCE(
      (SELECT SUM(seeds_earned) FROM seed_transactions WHERE user_id = _user_id), 0
    ) ORDER BY level DESC LIMIT 1),
    1
  ) INTO v_old_level;
  
  -- Insert seed transaction
  INSERT INTO seed_transactions (user_id, activity_type, seeds_earned, description, related_id)
  VALUES (_user_id, _activity_type, _seeds, _description, _related_id);
  
  -- Calculate new total and level
  SELECT COALESCE(SUM(seeds_earned), 0) INTO v_new_total
  FROM seed_transactions WHERE user_id = _user_id;
  
  SELECT COALESCE(
    (SELECT level FROM seed_levels WHERE min_seeds <= v_new_total ORDER BY level DESC LIMIT 1),
    1
  ) INTO v_new_level;
  
  -- Send level up notification if level increased
  IF v_new_level > v_old_level THEN
    -- Check if notification for this level already exists (prevent duplicates from race conditions)
    SELECT COUNT(*) INTO v_existing_notification_count
    FROM notifications 
    WHERE user_id = _user_id 
      AND type = 'level_up' 
      AND (metadata->>'new_level')::int = v_new_level
      AND created_at > now() - interval '1 hour';
    
    -- Only insert notification if no duplicate exists
    IF v_existing_notification_count = 0 THEN
      SELECT * INTO v_level_info FROM seed_levels WHERE level = v_new_level;
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
    END IF;
  END IF;
  
  RETURN _seeds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;