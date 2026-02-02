-- Add new columns to room_posts for block-based editor
ALTER TABLE room_posts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE room_posts ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE room_posts ADD COLUMN IF NOT EXISTS display_type TEXT DEFAULT 'card';
ALTER TABLE room_posts ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE room_posts ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false;

-- Add constraint for display_type values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'room_posts_display_type_check'
  ) THEN
    ALTER TABLE room_posts ADD CONSTRAINT room_posts_display_type_check 
    CHECK (display_type IN ('list', 'card', 'gallery'));
  END IF;
END $$;

-- Migrate existing content to blocks format for backward compatibility
UPDATE room_posts 
SET blocks = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'paragraph',
    'content', content
  )
)
WHERE blocks = '[]'::jsonb AND content IS NOT NULL AND content != '';

-- Create index for faster queries on is_draft and display_type
CREATE INDEX IF NOT EXISTS idx_room_posts_is_draft ON room_posts(is_draft);
CREATE INDEX IF NOT EXISTS idx_room_posts_display_type ON room_posts(display_type);