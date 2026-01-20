import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Grid bounds for furniture placement
export const GRID = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 500,
  
  // Floor placement bounds
  MIN_X: 60,
  MAX_X: 740,
  MIN_Y: 220,
  MAX_Y: 480,
  
  // Wall placement bounds
  WALL_MIN_X: 100,
  WALL_MAX_X: 700,
  WALL_MIN_Y: 40,
  WALL_MAX_Y: 200,
  
  // Grid cell size for snapping
  CELL_SIZE: 40,
};

/**
 * Snap coordinates to the grid
 */
export function snapToGrid(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.round(x / GRID.CELL_SIZE) * GRID.CELL_SIZE,
    y: Math.round(y / GRID.CELL_SIZE) * GRID.CELL_SIZE,
  };
}

/**
 * Clamp coordinates to floor bounds
 */
export function clampToFloor(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(GRID.MIN_X, Math.min(GRID.MAX_X, x)),
    y: Math.max(GRID.MIN_Y, Math.min(GRID.MAX_Y, y)),
  };
}

/**
 * Calculate z-index based on Y position (furniture closer to bottom appears in front)
 */
export function calculateZIndex(positionY: number): number {
  const normalizedY = (positionY - GRID.MIN_Y) / (GRID.MAX_Y - GRID.MIN_Y);
  return Math.floor(10 + normalizedY * 40);
}

/**
 * Hook for updating furniture position
 */
export function useUpdateFurniturePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      placementId,
      x,
      y,
    }: {
      placementId: string;
      x: number;
      y: number;
    }) => {
      // Clamp to floor bounds
      const clamped = clampToFloor(x, y);
      
      const { error } = await supabase
        .from("room_furniture_placements")
        .update({ 
          position_x: Math.round(clamped.x), 
          position_y: Math.round(clamped.y) 
        })
        .eq("id", placementId);

      if (error) throw error;
      return clamped;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-furniture-isometric"] });
    },
    onError: (error) => {
      console.error("Failed to update furniture position:", error);
      toast.error("Failed to move furniture");
    },
  });
}

/**
 * Hook for rotating furniture (90 degree increments)
 */
export function useRotateFurniture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      placementId,
      currentRotation,
    }: {
      placementId: string;
      currentRotation: number;
    }) => {
      const newRotation = (currentRotation + 90) % 360;

      const { error } = await supabase
        .from("room_furniture_placements")
        .update({ rotation: newRotation })
        .eq("id", placementId);

      if (error) throw error;
      return newRotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-furniture-isometric"] });
    },
    onError: (error) => {
      console.error("Failed to rotate furniture:", error);
      toast.error("Failed to rotate furniture");
    },
  });
}
