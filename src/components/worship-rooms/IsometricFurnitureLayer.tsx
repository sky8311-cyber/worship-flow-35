import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getFurnitureSprite } from "./FurnitureSprites";
import { getSlotById, SLOT_MAP } from "./FloorSlots";

interface FurniturePlacement {
  id: string;
  furniture_id: string;
  position_x: number;
  position_y: number;
  z_index: number;
  furniture: {
    id: string;
    name: string;
    image_url: string;
    category: string;
    width_px: number | null;
    height_px: number | null;
    default_slot: string | null;
    layer: string | null;
  };
}

interface IsometricFurnitureLayerProps {
  roomId: string;
}

export function useIsometricFurniture(roomId?: string) {
  return useQuery({
    queryKey: ["room-furniture-isometric", roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from("room_furniture_placements")
        .select(`
          id,
          furniture_id,
          position_x,
          position_y,
          z_index,
          furniture:room_furniture_catalog(id, name, image_url, category, width_px, height_px, default_slot, layer)
        `)
        .eq("room_id", roomId);

      if (error) throw error;
      return data as unknown as FurniturePlacement[];
    },
    enabled: !!roomId,
  });
}

/**
 * Renders furniture items at their slot positions with proper sizing and layering.
 * Uses SVG sprites instead of emojis for proportional rendering.
 */
export function IsometricFurnitureLayer({ roomId }: IsometricFurnitureLayerProps) {
  const { data: placements } = useIsometricFurniture(roomId);

  if (!placements?.length) return null;

  // Sort by z-index for proper layering
  const sortedPlacements = [...placements].sort((a, b) => {
    const slotA = getSlotById(a.furniture.default_slot || 'mid-center');
    const slotB = getSlotById(b.furniture.default_slot || 'mid-center');
    return slotA.z - slotB.z;
  });

  return (
    <div className="absolute inset-0 pointer-events-none">
      {sortedPlacements.map((placement) => {
        const slotId = placement.furniture.default_slot || 'mid-center';
        const slot = SLOT_MAP[slotId] || SLOT_MAP['mid-center'];
        
        const baseWidth = placement.furniture.width_px || 50;
        const baseHeight = placement.furniture.height_px || 50;
        const scaledWidth = baseWidth * slot.scale;
        const scaledHeight = baseHeight * slot.scale;

        // Get the SVG sprite component
        const SpriteComponent = getFurnitureSprite(placement.furniture.image_url) || 
                               getFurnitureSprite(placement.furniture.name);

        return (
          <div
            key={placement.id}
            className="absolute transition-all duration-300"
            style={{
              left: slot.x,
              top: slot.y,
              transform: `translate(-50%, -100%)`, // Anchor to bottom center
              zIndex: slot.z,
              width: scaledWidth,
              height: scaledHeight,
            }}
          >
            {SpriteComponent ? (
              <SpriteComponent 
                width={scaledWidth} 
                height={scaledHeight}
                className="drop-shadow-md"
              />
            ) : (
              // Fallback to emoji if no sprite found
              <span 
                className="flex items-center justify-center text-2xl"
                style={{ 
                  fontSize: Math.min(scaledWidth, scaledHeight) * 0.8,
                }}
              >
                {placement.furniture.image_url}
              </span>
            )}

            {/* Floor shadow for grounding */}
            {slot.layer === 'floor' && (
              <div
                className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/10 blur-sm"
                style={{
                  bottom: -4,
                  width: scaledWidth * 0.7,
                  height: scaledHeight * 0.1,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
