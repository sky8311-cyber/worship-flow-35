-- Add status bubble fields to worship_rooms
ALTER TABLE public.worship_rooms
ADD COLUMN IF NOT EXISTS status_emoji TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS status_text TEXT DEFAULT NULL;

-- Create furniture catalog table
CREATE TABLE IF NOT EXISTS public.room_furniture_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ko TEXT,
  category TEXT NOT NULL, -- 'bed', 'chair', 'desk', 'decoration', 'plant', 'rug', 'lamp', 'frame'
  image_url TEXT NOT NULL,
  price_seeds INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create furniture placements table
CREATE TABLE IF NOT EXISTS public.room_furniture_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.worship_rooms(id) ON DELETE CASCADE,
  furniture_id UUID NOT NULL REFERENCES public.room_furniture_catalog(id) ON DELETE CASCADE,
  position_x INTEGER NOT NULL DEFAULT 50, -- 0-100 percentage
  position_y INTEGER NOT NULL DEFAULT 50,
  z_index INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, furniture_id)
);

-- Enable RLS on furniture tables
ALTER TABLE public.room_furniture_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_furniture_placements ENABLE ROW LEVEL SECURITY;

-- Furniture catalog is public read
CREATE POLICY "Furniture catalog is public" ON public.room_furniture_catalog
  FOR SELECT USING (true);

-- Users can manage furniture in their own room
CREATE POLICY "Users can view furniture placements in viewable rooms" ON public.room_furniture_placements
  FOR SELECT USING (
    public.can_view_room(room_id, auth.uid())
  );

CREATE POLICY "Room owners can manage their furniture" ON public.room_furniture_placements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.worship_rooms 
      WHERE id = room_id AND owner_user_id = auth.uid()
    )
  );

-- Insert default furniture items (pixel art style using emojis for now)
INSERT INTO public.room_furniture_catalog (name, name_ko, category, image_url, is_default, sort_order) VALUES
  ('Cozy Bed', '아늑한 침대', 'bed', '🛏️', true, 1),
  ('Wooden Desk', '나무 책상', 'desk', '🪑', true, 2),
  ('Plant Pot', '화분', 'plant', '🪴', true, 3),
  ('Floor Lamp', '스탠드', 'lamp', '🪔', true, 4),
  ('Picture Frame', '액자', 'frame', '🖼️', true, 5),
  ('Cozy Rug', '러그', 'rug', '🧶', true, 6),
  ('Bookshelf', '책장', 'bookshelf', '📚', true, 7),
  ('Candle', '캔들', 'decoration', '🕯️', true, 8),
  ('Cross', '십자가', 'decoration', '✝️', true, 9),
  ('Bible', '성경책', 'decoration', '📖', true, 10);