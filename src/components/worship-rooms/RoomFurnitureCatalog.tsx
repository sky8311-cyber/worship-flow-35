import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sofa, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface FurnitureItem {
  id: string;
  name: string;
  name_ko: string | null;
  category: string;
  image_url: string;
  price_seeds: number;
  is_default: boolean;
}

interface RoomFurnitureCatalogProps {
  roomId: string;
  existingFurnitureIds: string[];
}

// Default positions for each category
const categoryPositions: Record<string, { x: number; y: number; z: number }> = {
  bed: { x: 20, y: 70, z: 5 },
  desk: { x: 75, y: 55, z: 10 },
  plant: { x: 85, y: 45, z: 8 },
  lamp: { x: 15, y: 40, z: 7 },
  frame: { x: 50, y: 25, z: 3 },
  rug: { x: 50, y: 75, z: 1 },
  bookshelf: { x: 30, y: 35, z: 6 },
  decoration: { x: 60, y: 30, z: 4 },
};

export function useFurnitureCatalog() {
  return useQuery({
    queryKey: ["furniture-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_furniture_catalog")
        .select("*")
        .order("sort_order");
      
      if (error) throw error;
      return data as FurnitureItem[];
    },
  });
}

export function useAddFurniture() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ roomId, furnitureId, category }: { 
      roomId: string; 
      furnitureId: string; 
      category: string;
    }) => {
      const position = categoryPositions[category] || { x: 50, y: 50, z: 5 };
      
      const { error } = await supabase
        .from("room_furniture_placements")
        .insert({
          room_id: roomId,
          furniture_id: furnitureId,
          position_x: position.x,
          position_y: position.y,
          z_index: position.z,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-furniture"] });
      toast.success("가구를 배치했습니다");
    },
    onError: () => {
      toast.error("가구 배치에 실패했습니다");
    },
  });
}

export function useRemoveFurniture() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ roomId, furnitureId }: { roomId: string; furnitureId: string }) => {
      const { error } = await supabase
        .from("room_furniture_placements")
        .delete()
        .eq("room_id", roomId)
        .eq("furniture_id", furnitureId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-furniture"] });
      toast.success("가구를 제거했습니다");
    },
    onError: () => {
      toast.error("가구 제거에 실패했습니다");
    },
  });
}

export function RoomFurnitureCatalog({ roomId, existingFurnitureIds }: RoomFurnitureCatalogProps) {
  const { t, language } = useTranslation();
  const { data: catalog } = useFurnitureCatalog();
  const addFurniture = useAddFurniture();
  const removeFurniture = useRemoveFurniture();
  const [open, setOpen] = useState(false);

  const handleToggleFurniture = (item: FurnitureItem) => {
    const isPlaced = existingFurnitureIds.includes(item.id);
    
    if (isPlaced) {
      removeFurniture.mutate({ roomId, furnitureId: item.id });
    } else {
      addFurniture.mutate({ roomId, furnitureId: item.id, category: item.category });
    }
  };

  // Group by category
  const groupedCatalog = catalog?.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FurnitureItem[]>) || {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sofa className="h-4 w-4" />
          {t("rooms.furniture")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sofa className="h-5 w-5" />
            {t("rooms.furnitureCatalog")}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {Object.entries(groupedCatalog).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-muted-foreground capitalize mb-2">
                  {category}
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {items.map((item) => {
                    const isPlaced = existingFurnitureIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleToggleFurniture(item)}
                        className={cn(
                          "flex flex-col items-center p-2 rounded-lg border transition-all",
                          "hover:bg-muted hover:scale-105",
                          isPlaced 
                            ? "bg-primary/10 border-primary ring-2 ring-primary/30" 
                            : "bg-card border-border"
                        )}
                      >
                        <span className="text-2xl mb-1">{item.image_url}</span>
                        <span className="text-[10px] text-center line-clamp-1">
                          {language === "ko" ? item.name_ko || item.name : item.name}
                        </span>
                        {isPlaced ? (
                          <Trash2 className="h-3 w-3 text-destructive mt-1" />
                        ) : (
                          <Plus className="h-3 w-3 text-muted-foreground mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
