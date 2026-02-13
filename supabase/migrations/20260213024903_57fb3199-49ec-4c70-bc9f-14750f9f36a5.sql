-- 곡 삭제 시 관련 알림 자동 정리
CREATE OR REPLACE FUNCTION public.cleanup_song_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE related_id = OLD.id
    AND related_type = 'song';
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_song_deleted_cleanup_notifications
  BEFORE DELETE ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_song_notifications();