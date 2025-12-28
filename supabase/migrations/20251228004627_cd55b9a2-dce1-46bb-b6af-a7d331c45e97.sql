-- Create trigger function to notify admins when a new worship leader application is submitted
CREATE OR REPLACE FUNCTION public.notify_admins_new_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user RECORD;
  applicant_name TEXT;
  applicant_avatar TEXT;
BEGIN
  -- Get applicant info
  SELECT full_name, avatar_url INTO applicant_name, applicant_avatar
  FROM profiles WHERE id = NEW.user_id;

  -- Notify all admins
  FOR admin_user IN 
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (user_id, type, title, message, related_id, related_type, metadata)
    VALUES (
      admin_user.user_id,
      'new_worship_leader_application',
      '새 예배인도자 승급 신청',
      COALESCE(applicant_name, 'Someone') || '님이 예배인도자 승급을 신청했습니다.',
      NEW.id,
      'worship_leader_application',
      jsonb_build_object(
        'applicant_id', NEW.user_id,
        'actor_name', applicant_name,
        'actor_avatar', applicant_avatar,
        'church_name', NEW.church_name,
        'position', NEW.position
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger on worship_leader_applications table
DROP TRIGGER IF EXISTS on_new_worship_leader_application ON worship_leader_applications;
CREATE TRIGGER on_new_worship_leader_application
AFTER INSERT ON worship_leader_applications
FOR EACH ROW
EXECUTE FUNCTION notify_admins_new_application();