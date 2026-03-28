
-- Add columns
ALTER TABLE public.room_posts
  ADD COLUMN IF NOT EXISTS workflow_stage text NOT NULL DEFAULT 'draft';
ALTER TABLE public.room_posts
  ADD COLUMN IF NOT EXISTS block_type text NOT NULL DEFAULT 'note';

-- Validation trigger for workflow_stage
CREATE OR REPLACE FUNCTION public.validate_workflow_stage() RETURNS trigger AS $$
BEGIN
  IF NEW.workflow_stage NOT IN ('draft','in_progress','refined','published') THEN
    RAISE EXCEPTION 'Invalid workflow_stage: %', NEW.workflow_stage;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_workflow_stage ON public.room_posts;
CREATE TRIGGER trg_validate_workflow_stage
  BEFORE INSERT OR UPDATE ON public.room_posts
  FOR EACH ROW EXECUTE FUNCTION public.validate_workflow_stage();

-- Validation trigger for block_type
CREATE OR REPLACE FUNCTION public.validate_block_type() RETURNS trigger AS $$
BEGIN
  IF NEW.block_type NOT IN ('song','worship_set','scripture','prayer_note','audio','note') THEN
    RAISE EXCEPTION 'Invalid block_type: %', NEW.block_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_block_type ON public.room_posts;
CREATE TRIGGER trg_validate_block_type
  BEFORE INSERT OR UPDATE ON public.room_posts
  FOR EACH ROW EXECUTE FUNCTION public.validate_block_type();
