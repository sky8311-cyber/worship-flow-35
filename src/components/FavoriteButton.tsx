import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface FavoriteButtonProps {
  songId: string;
  isFavorite?: boolean;
  favoriteCount?: number;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function FavoriteButton({ 
  songId, 
  isFavorite: initialFavorite = false, 
  favoriteCount = 0,
  variant = "ghost", 
  size = "icon", 
  className 
}: FavoriteButtonProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  // Local optimistic state for instant visual feedback
  const [optimisticFavorite, setOptimisticFavorite] = useState(initialFavorite);
  const [optimisticCount, setOptimisticCount] = useState(favoriteCount);
  
  // Sync with props when they change (e.g., after refetch)
  useEffect(() => {
    setOptimisticFavorite(initialFavorite);
  }, [initialFavorite]);
  
  useEffect(() => {
    setOptimisticCount(favoriteCount);
  }, [favoriteCount]);
  
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
      setOptimisticCount(prev => shouldAdd ? prev - 1 : prev + 1);
      toast.error(t("favoriteButton.error"));
    },
    onSettled: () => {
      // Refetch to sync state
      queryClient.invalidateQueries({ queryKey: ["user-favorites-set"] });
      queryClient.invalidateQueries({ queryKey: ["song-favorite-counts"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-songs"] });
    },
    onSuccess: (wasAdded) => {
      toast.success(wasAdded ? t("favoriteButton.addedToFavorites") : t("favoriteButton.removedFromFavorites"));
    },
  });
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Instant visual feedback
    const newState = !optimisticFavorite;
    setOptimisticFavorite(newState);
    setOptimisticCount(prev => newState ? prev + 1 : Math.max(0, prev - 1));
    
    // Then perform the actual mutation
    toggleFavoriteMutation.mutate(newState);
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn("relative", className)}
    >
      <Heart 
        className={`w-4 h-4 transition-colors ${optimisticFavorite ? "fill-red-500 text-red-500" : ""}`}
      />
      {optimisticCount > 0 && (
        <span className="absolute -top-1 -right-1.5 bg-primary text-primary-foreground text-[10px] rounded-full h-4 min-w-4 flex items-center justify-center font-bold px-1">
          {optimisticCount > 99 ? "99+" : optimisticCount}
        </span>
      )}
    </Button>
  );
}
