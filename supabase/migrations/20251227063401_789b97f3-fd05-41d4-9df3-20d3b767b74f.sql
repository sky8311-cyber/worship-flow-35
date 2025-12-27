
-- =====================================================
-- PHASE 1: Audit Tables + Realtime Activation
-- =====================================================

-- 1. Create service_sets_audit table
CREATE TABLE IF NOT EXISTS public.service_sets_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_set_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_fields JSONB,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create set_songs_audit table
CREATE TABLE IF NOT EXISTS public.set_songs_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_song_id UUID NOT NULL,
  service_set_id UUID NOT NULL,
  song_id UUID,
  user_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_fields JSONB,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create set_components_audit table
CREATE TABLE IF NOT EXISTS public.set_components_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_component_id UUID NOT NULL,
  service_set_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_fields JSONB,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_service_sets_audit_set_id ON public.service_sets_audit(service_set_id);
CREATE INDEX IF NOT EXISTS idx_service_sets_audit_created_at ON public.service_sets_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_set_songs_audit_set_id ON public.set_songs_audit(service_set_id);
CREATE INDEX IF NOT EXISTS idx_set_songs_audit_created_at ON public.set_songs_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_set_components_audit_set_id ON public.set_components_audit(service_set_id);
CREATE INDEX IF NOT EXISTS idx_set_components_audit_created_at ON public.set_components_audit(created_at DESC);

-- 5. Trigger function for service_sets audit
CREATE OR REPLACE FUNCTION public.audit_service_set_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  changed_fields_json JSONB;
  old_json JSONB;
  new_json JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.service_sets_audit (service_set_id, user_id, action, new_values)
    VALUES (NEW.id, auth.uid(), 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    old_json := to_jsonb(OLD);
    new_json := to_jsonb(NEW);
    
    SELECT jsonb_object_agg(key, new_json->key)
    INTO changed_fields_json
    FROM jsonb_each(new_json)
    WHERE key NOT IN ('updated_at', 'created_at')
      AND (old_json->key IS DISTINCT FROM new_json->key);
    
    IF changed_fields_json IS NOT NULL AND changed_fields_json != '{}'::jsonb THEN
      INSERT INTO public.service_sets_audit (service_set_id, user_id, action, old_values, new_values, changed_fields)
      VALUES (NEW.id, auth.uid(), 'UPDATE', old_json, new_json, changed_fields_json);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.service_sets_audit (service_set_id, user_id, action, old_values)
    VALUES (OLD.id, auth.uid(), 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 6. Trigger function for set_songs audit
CREATE OR REPLACE FUNCTION public.audit_set_song_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  changed_fields_json JSONB;
  old_json JSONB;
  new_json JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.set_songs_audit (set_song_id, service_set_id, song_id, user_id, action, new_values)
    VALUES (NEW.id, NEW.service_set_id, NEW.song_id, auth.uid(), 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    old_json := to_jsonb(OLD);
    new_json := to_jsonb(NEW);
    
    SELECT jsonb_object_agg(key, new_json->key)
    INTO changed_fields_json
    FROM jsonb_each(new_json)
    WHERE key NOT IN ('created_at')
      AND (old_json->key IS DISTINCT FROM new_json->key);
    
    IF changed_fields_json IS NOT NULL AND changed_fields_json != '{}'::jsonb THEN
      INSERT INTO public.set_songs_audit (set_song_id, service_set_id, song_id, user_id, action, old_values, new_values, changed_fields)
      VALUES (NEW.id, NEW.service_set_id, NEW.song_id, auth.uid(), 'UPDATE', old_json, new_json, changed_fields_json);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.set_songs_audit (set_song_id, service_set_id, song_id, user_id, action, old_values)
    VALUES (OLD.id, OLD.service_set_id, OLD.song_id, auth.uid(), 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 7. Trigger function for set_components audit
CREATE OR REPLACE FUNCTION public.audit_set_component_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  changed_fields_json JSONB;
  old_json JSONB;
  new_json JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.set_components_audit (set_component_id, service_set_id, user_id, action, new_values)
    VALUES (NEW.id, NEW.service_set_id, auth.uid(), 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    old_json := to_jsonb(OLD);
    new_json := to_jsonb(NEW);
    
    SELECT jsonb_object_agg(key, new_json->key)
    INTO changed_fields_json
    FROM jsonb_each(new_json)
    WHERE key NOT IN ('created_at')
      AND (old_json->key IS DISTINCT FROM new_json->key);
    
    IF changed_fields_json IS NOT NULL AND changed_fields_json != '{}'::jsonb THEN
      INSERT INTO public.set_components_audit (set_component_id, service_set_id, user_id, action, old_values, new_values, changed_fields)
      VALUES (NEW.id, NEW.service_set_id, auth.uid(), 'UPDATE', old_json, new_json, changed_fields_json);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.set_components_audit (set_component_id, service_set_id, user_id, action, old_values)
    VALUES (OLD.id, OLD.service_set_id, auth.uid(), 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 8. Create triggers
DROP TRIGGER IF EXISTS audit_service_sets_trigger ON public.service_sets;
CREATE TRIGGER audit_service_sets_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.service_sets
  FOR EACH ROW EXECUTE FUNCTION public.audit_service_set_changes();

DROP TRIGGER IF EXISTS audit_set_songs_trigger ON public.set_songs;
CREATE TRIGGER audit_set_songs_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.set_songs
  FOR EACH ROW EXECUTE FUNCTION public.audit_set_song_changes();

DROP TRIGGER IF EXISTS audit_set_components_trigger ON public.set_components;
CREATE TRIGGER audit_set_components_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.set_components
  FOR EACH ROW EXECUTE FUNCTION public.audit_set_component_changes();

-- 9. Enable RLS on audit tables (read-only for authenticated users)
ALTER TABLE public.service_sets_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_songs_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_components_audit ENABLE ROW LEVEL SECURITY;

-- 10. RLS policies - community members can view audit logs
CREATE POLICY "Community members can view service_sets_audit"
  ON public.service_sets_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_sets ss
      JOIN public.community_members cm ON cm.community_id = ss.community_id
      WHERE ss.id = service_set_id AND cm.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Community members can view set_songs_audit"
  ON public.set_songs_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_sets ss
      JOIN public.community_members cm ON cm.community_id = ss.community_id
      WHERE ss.id = service_set_id AND cm.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Community members can view set_components_audit"
  ON public.set_components_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_sets ss
      JOIN public.community_members cm ON cm.community_id = ss.community_id
      WHERE ss.id = service_set_id AND cm.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- 11. Enable Realtime for the three tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.set_songs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.set_components;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_sets;

-- 12. Set REPLICA IDENTITY FULL for complete row data on UPDATE/DELETE
ALTER TABLE public.set_songs REPLICA IDENTITY FULL;
ALTER TABLE public.set_components REPLICA IDENTITY FULL;
ALTER TABLE public.service_sets REPLICA IDENTITY FULL;
