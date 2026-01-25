import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useCreateStudio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("worship_rooms")
        .insert({
          owner_user_id: user.id,
          visibility: "friends",
          is_active: true,
          theme_config: {
            wallpaper: "default",
            backgroundColor: "#f8fafc",
          },
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worship-room"] });
      toast.success("Studio created!");
    },
    onError: () => {
      toast.error("Failed to create studio");
    },
  });
}
