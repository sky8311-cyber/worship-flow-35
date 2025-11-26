import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface FavoriteButtonProps {
  songId: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function FavoriteButton({ songId, variant = "ghost", size = "icon", className }: FavoriteButtonProps) {
  const queryClient = useQueryClient();
  
  const { data: isFavorite } = useQuery({
    queryKey: ["is-favorite", songId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;
      
      const { data, error } = await supabase
        .from("user_favorite_songs")
        .select("id")
        .eq("user_id", user.user.id)
        .eq("song_id", songId)
        .maybeSingle();
      
      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    },
  });
  
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      
      if (isFavorite) {
        const { error } = await supabase
          .from("user_favorite_songs")
          .delete()
          .eq("user_id", user.user.id)
          .eq("song_id", songId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_favorite_songs")
          .insert([{
            user_id: user.user.id,
            song_id: songId,
          }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-favorite", songId] });
      queryClient.invalidateQueries({ queryKey: ["favorite-songs"] });
      toast.success(isFavorite ? "즐겨찾기에서 제거되었습니다" : "즐겨찾기에 추가되었습니다");
    },
  });
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavoriteMutation.mutate();
      }}
      className={className}
    >
      <Heart 
        className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
      />
    </Button>
  );
}
