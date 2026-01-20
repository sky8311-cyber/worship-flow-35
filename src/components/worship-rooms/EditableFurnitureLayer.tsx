import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DraggableFurniture } from "./DraggableFurniture";
import { GridOverlay } from "./GridOverlay";
import { useUpdateFurniturePosition, useRotateFurniture, calculateZIndex } from "./hooks/useFurnitureEditor";

interface FurniturePlacement {
  id: string;
  furniture_id: string;
  position_x: number;
  position_y: number;
  z_index: number;
  rotation?: number;
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

interface EditableFurnitureLayerProps {
  roomId: string;
  isEditMode: boolean;
  canvasScale: number;
}

export function useEditableFurniture(roomId?: string) {
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
          rotation,
          furniture:room_furniture_catalog(id, name, image_url, category, width_px, height_px, default_slot, layer)
        `)
        .eq("room_id", roomId);

      if (error) throw error;
      return data as unknown as FurniturePlacement[];
    },
    enabled: !!roomId,
  });
}

export function EditableFurnitureLayer({
  roomId,
  isEditMode,
  canvasScale,
}: EditableFurnitureLayerProps) {
  const { data: placements } = useEditableFurniture(roomId);
  const updatePosition = useUpdateFurniturePosition();
  const rotateFurniture = useRotateFurniture();

  const handlePositionChange = (placementId: string, x: number, y: number) => {
    updatePosition.mutate({ placementId, x, y });
  };

  const handleRotate = (placementId: string, currentRotation: number) => {
    rotateFurniture.mutate({ placementId, currentRotation });
  };

  if (!placements?.length && !isEditMode) return null;

  // Sort by z-index (based on Y position) for proper layering
  const sortedPlacements = [...(placements || [])].sort((a, b) => {
    return calculateZIndex(a.position_y) - calculateZIndex(b.position_y);
  });

  return (
    <>
      {/* Grid overlay for edit mode */}
      <GridOverlay visible={isEditMode} />

      {/* Furniture items */}
      <div className="absolute inset-0">
        {sortedPlacements.map((placement) => (
          <DraggableFurniture
            key={placement.id}
            placement={placement}
            isEditMode={isEditMode}
            canvasScale={canvasScale}
            onPositionChange={handlePositionChange}
            onRotate={handleRotate}
          />
        ))}
      </div>
    </>
  );
}
