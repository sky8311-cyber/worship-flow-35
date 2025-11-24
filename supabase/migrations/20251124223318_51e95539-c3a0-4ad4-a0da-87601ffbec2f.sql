-- Add birth_date column to profiles table
ALTER TABLE public.profiles ADD COLUMN birth_date DATE;

-- Update handle_new_user trigger function to include birth_date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name, phone, birth_date)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    (new.raw_user_meta_data->>'birth_date')::date
  );

  -- Always assign 'user' role by default (no more worship_leader at signup)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');

  RETURN new;
END;
$$;

-- Create birthday notification function
CREATE OR REPLACE FUNCTION public.notify_community_birthdays()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  birthday_record RECORD;
  community_member RECORD;
BEGIN
  -- Find all users with birthdays this week (ignoring year)
  FOR birthday_record IN
    SELECT p.id, p.full_name, p.avatar_url, p.birth_date
    FROM profiles p
    WHERE p.birth_date IS NOT NULL
      AND (
        -- Handle birthdays in the same year
        (EXTRACT(MONTH FROM p.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND 
         EXTRACT(DAY FROM p.birth_date) BETWEEN EXTRACT(DAY FROM CURRENT_DATE) AND EXTRACT(DAY FROM CURRENT_DATE + INTERVAL '7 days'))
        OR
        -- Handle birthdays crossing month boundary
        (EXTRACT(DOY FROM p.birth_date) BETWEEN EXTRACT(DOY FROM CURRENT_DATE) 
         AND EXTRACT(DOY FROM CURRENT_DATE + INTERVAL '7 days'))
      )
  LOOP
    -- Notify all members of communities the birthday person is in
    FOR community_member IN
      SELECT DISTINCT cm2.user_id, cm1.community_id, wc.name as community_name
      FROM community_members cm1
      JOIN community_members cm2 ON cm1.community_id = cm2.community_id
      JOIN worship_communities wc ON cm1.community_id = wc.id
      WHERE cm1.user_id = birthday_record.id
        AND cm2.user_id != birthday_record.id
    LOOP
      -- Insert notification (check if not already notified this week)
      INSERT INTO notifications (user_id, type, title, message, related_id, related_type, metadata)
      SELECT 
        community_member.user_id,
        'birthday',
        'Birthday This Week',
        birthday_record.full_name || ' has a birthday this week!',
        birthday_record.id,
        'profile',
        jsonb_build_object(
          'actor_name', birthday_record.full_name,
          'actor_avatar', birthday_record.avatar_url,
          'community_name', community_member.community_name,
          'birth_date', birthday_record.birth_date
        )
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE user_id = community_member.user_id
          AND type = 'birthday'
          AND related_id = birthday_record.id
          AND created_at > CURRENT_DATE - INTERVAL '7 days'
      );
    END LOOP;
  END LOOP;
END;
$$;