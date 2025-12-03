import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface FavoriteButtonProps {
  songId: string;
  isFavorite?: boolean;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function FavoriteButton({ 
  songId, 
  isFavorite: initialFavorite = false, 
  variant = "ghost", 
  size = "icon", 
  className 
}: FavoriteButtonProps) {
  const queryClient = useQueryClient();
  
  // Local optimistic state for instant visual feedback
  const [optimisticFavorite, setOptimisticFavorite] = useState(initialFavorite);
  
  // Sync with prop when it changes (e.g., after refetch)
  useEffect(() => {
    setOptimisticFavorite(initialFavorite);
  }, [initialFavorite]);
  
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (shouldAdd: boolean) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      
      if (!shouldAdd) {
        // Remove from favorites
        const { error } = await supabase
          .from("user_favorite_songs")
          .delete()
          .eq("user_id", user.user.id)
          .eq("song_id", songId);
        
        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("user_favorite_songs")
          .insert([{
            user_id: user.user.id,
            song_id: songId,
          }]);
        
        if (error) throw error;
      }
      return shouldAdd;
    },
    onError: (err, shouldAdd) => {
      // Rollback optimistic state on error
      setOptimisticFavorite(!shouldAdd);
      toast.error("오류가 발생했습니다");
    },
    onSettled: () => {
      // Refetch to sync state
      queryClient.invalidateQueries({ queryKey: ["user-favorites-set"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-songs"] });
    },
    onSuccess: (wasAdded) => {
      toast.success(wasAdded ? "즐겨찾기에 추가되었습니다" : "즐겨찾기에서 제거되었습니다");
    },
  });
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Instant visual feedback
    const newState = !optimisticFavorite;
    setOptimisticFavorite(newState);
    
    // Then perform the actual mutation
    toggleFavoriteMutation.mutate(newState);
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      <Heart 
        className={`w-4 h-4 transition-colors ${optimisticFavorite ? "fill-red-500 text-red-500" : ""}`}
      />
    </Button>
  );
}
