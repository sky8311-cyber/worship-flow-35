import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  };
}

interface RoomFurnitureLayerProps {
  roomId: string;
  isEditMode?: boolean;
  onFurnitureClick?: (placement: FurniturePlacement) => void;
}

export function useRoomFurniture(roomId?: string) {
  return useQuery({
    queryKey: ["room-furniture", roomId],
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
          furniture:room_furniture_catalog(id, name, image_url, category)
        `)
        .eq("room_id", roomId);
      
      if (error) throw error;
      return data as unknown as FurniturePlacement[];
    },
    enabled: !!roomId,
  });
}

export function RoomFurnitureLayer({ roomId, isEditMode, onFurnitureClick }: RoomFurnitureLayerProps) {
  const { data: placements } = useRoomFurniture(roomId);

  if (!placements?.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {placements.map((placement) => (
        <div
          key={placement.id}
          className={cn(
            "absolute transition-transform",
            isEditMode && "pointer-events-auto cursor-move hover:scale-110 hover:z-50"
          )}
          style={{
            left: `${placement.position_x}%`,
            top: `${placement.position_y}%`,
            transform: "translate(-50%, -50%)",
            zIndex: placement.z_index,
          }}
          onClick={() => isEditMode && onFurnitureClick?.(placement)}
        >
          {/* Emoji-based furniture (can be replaced with images later) */}
          <span 
            className={cn(
              "text-4xl drop-shadow-lg select-none",
              isEditMode && "ring-2 ring-primary/50 rounded-lg p-1 bg-background/50"
            )}
            role="img"
            aria-label={placement.furniture.name}
          >
            {placement.furniture.image_url}
          </span>
          
          {/* Floor shadow */}
          <div 
            className="absolute top-full left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-black/15 blur-sm"
          />
        </div>
      ))}
    </div>
  );
}
