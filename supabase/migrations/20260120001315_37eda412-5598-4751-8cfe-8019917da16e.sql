-- Add sizing and slot information to furniture catalog
ALTER TABLE public.room_furniture_catalog
ADD COLUMN IF NOT EXISTS width_px INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS height_px INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS default_slot TEXT DEFAULT 'mid-center',
ADD COLUMN IF NOT EXISTS layer TEXT DEFAULT 'floor';

-- Update existing furniture with proper proportional sizes
UPDATE public.room_furniture_catalog SET 
  width_px = 120, height_px = 80, default_slot = 'back-left', layer = 'floor'
WHERE name = 'Cozy Bed';

UPDATE public.room_furniture_catalog SET 
  width_px = 90, height_px = 60, default_slot = 'back-center', layer = 'floor'
WHERE name = 'Study Desk';

UPDATE public.room_furniture_catalog SET 
  width_px = 40, height_px = 50, default_slot = 'mid-right', layer = 'floor'
WHERE name = 'Comfortable Chair';

UPDATE public.room_furniture_catalog SET 
  width_px = 30, height_px = 45, default_slot = 'mid-left', layer = 'floor'
WHERE name = 'Plant Pot';

UPDATE public.room_furniture_catalog SET 
  width_px = 70, height_px = 100, default_slot = 'back-right', layer = 'floor'
WHERE name = 'Bookshelf';

UPDATE public.room_furniture_catalog SET 
  width_px = 25, height_px = 60, default_slot = 'front-right', layer = 'floor'
WHERE name = 'Floor Lamp';

UPDATE public.room_furniture_catalog SET 
  width_px = 100, height_px = 40, default_slot = 'front-center', layer = 'floor'
WHERE name = 'Cozy Rug';

UPDATE public.room_furniture_catalog SET 
  width_px = 50, height_px = 40, default_slot = 'wall-center', layer = 'wall'
WHERE name = 'Picture Frame';

UPDATE public.room_furniture_catalog SET 
  width_px = 20, height_px = 15, default_slot = 'mid-center', layer = 'floor'
WHERE name = 'Holy Book';

UPDATE public.room_furniture_catalog SET 
  width_px = 30, height_px = 30, default_slot = 'wall-right', layer = 'wall'
WHERE name = 'Wall Clock';