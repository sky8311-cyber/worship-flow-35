-- Add layout_type and max_widgets to worship_rooms
ALTER TABLE worship_rooms 
  ADD COLUMN IF NOT EXISTS layout_type text DEFAULT 'grid',
  ADD COLUMN IF NOT EXISTS max_widgets integer DEFAULT 20;

-- Add constraint for layout_type
ALTER TABLE worship_rooms 
  ADD CONSTRAINT worship_rooms_layout_type_check 
  CHECK (layout_type IN ('grid', 'gallery', 'list'));

-- Update studio_widgets content to support new widget types
COMMENT ON COLUMN studio_widgets.widget_type IS 'Widget types: text, heading, quote, callout, image, video, post, todo, numbered-list, bullet-list, divider, external-link, song, recent-drafts, gallery, bible-verse, profile-card';