
CREATE TABLE IF NOT EXISTS public.canvas_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id uuid NOT NULL REFERENCES public.room_posts(id) ON DELETE CASCADE,
  block_type text NOT NULL DEFAULT 'note',
  position integer NOT NULL DEFAULT 0,
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_canvas_blocks_canvas_id ON public.canvas_blocks(canvas_id, position);

ALTER TABLE public.canvas_blocks ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can read blocks of posts they can see
CREATE POLICY "Anyone can read canvas blocks" ON public.canvas_blocks
  FOR SELECT USING (true);

-- RLS: authors can manage their own canvas blocks
CREATE POLICY "Authors can manage canvas blocks" ON public.canvas_blocks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_posts rp 
      WHERE rp.id = canvas_blocks.canvas_id 
      AND rp.author_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_posts rp 
      WHERE rp.id = canvas_blocks.canvas_id 
      AND rp.author_user_id = auth.uid()
    )
  );

-- Validation trigger for block_type
CREATE OR REPLACE FUNCTION public.validate_canvas_block_type() RETURNS trigger AS $$
BEGIN
  IF NEW.block_type NOT IN ('song','worship_set','scripture','prayer_note','audio','note') THEN
    RAISE EXCEPTION 'Invalid block_type: %', NEW.block_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_canvas_block_type
  BEFORE INSERT OR UPDATE ON public.canvas_blocks
  FOR EACH ROW EXECUTE FUNCTION public.validate_canvas_block_type();
