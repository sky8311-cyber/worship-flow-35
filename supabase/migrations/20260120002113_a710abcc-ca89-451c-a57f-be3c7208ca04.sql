-- Add rotation column to furniture placements
ALTER TABLE room_furniture_placements
ADD COLUMN IF NOT EXISTS rotation INTEGER DEFAULT 0;

-- Migrate position values from 0-100 percentages to actual canvas coordinates (0-800, 0-500)
-- Only migrate if values are in the old 0-100 range
UPDATE room_furniture_placements
SET 
  position_x = CASE 
    WHEN position_x <= 100 THEN LEAST(GREATEST((position_x * 8)::integer, 60), 740)
    ELSE position_x
  END,
  position_y = CASE 
    WHEN position_y <= 100 THEN LEAST(GREATEST((position_y * 5)::integer, 220), 480)
    ELSE position_y
  END
WHERE position_x <= 100 OR position_y <= 100;