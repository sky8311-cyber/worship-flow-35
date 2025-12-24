-- Create songs_audit table for tracking all changes
CREATE TABLE public.songs_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_fields JSONB,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient lookups by song_id
CREATE INDEX idx_songs_audit_song_id ON public.songs_audit(song_id);
CREATE INDEX idx_songs_audit_created_at ON public.songs_audit(created_at DESC);

-- Enable RLS
ALTER TABLE public.songs_audit ENABLE ROW LEVEL SECURITY;

-- Allow worship leaders and admins to view audit logs
CREATE POLICY "Worship leaders can view audit logs"
ON public.songs_audit
FOR SELECT
USING (
  has_role(auth.uid(), 'worship_leader'::app_role) OR 
  is_admin(auth.uid())
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_song_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields_json JSONB;
  old_json JSONB;
  new_json JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.songs_audit (song_id, user_id, action, new_values)
    VALUES (NEW.id, auth.uid(), 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    old_json := to_jsonb(OLD);
    new_json := to_jsonb(NEW);
    
    -- Calculate changed fields
    SELECT jsonb_object_agg(key, new_json->key)
    INTO changed_fields_json
    FROM jsonb_each(new_json)
    WHERE key != 'updated_at' 
      AND (old_json->key IS DISTINCT FROM new_json->key);
    
    -- Only log if there are actual changes
    IF changed_fields_json IS NOT NULL AND changed_fields_json != '{}'::jsonb THEN
      INSERT INTO public.songs_audit (song_id, user_id, action, old_values, new_values, changed_fields)
      VALUES (NEW.id, auth.uid(), 'UPDATE', old_json, new_json, changed_fields_json);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.songs_audit (song_id, user_id, action, old_values)
    VALUES (OLD.id, auth.uid(), 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on songs table
CREATE TRIGGER song_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.songs
FOR EACH ROW EXECUTE FUNCTION public.audit_song_changes();