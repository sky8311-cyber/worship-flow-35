import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useUpdateRoomStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      roomId, 
      status_emoji, 
      status_text 
    }: { 
      roomId: string; 
      status_emoji: string; 
      status_text: string;
    }) => {
      const { error } = await supabase
        .from("worship_rooms")
        .update({ status_emoji, status_text })
        .eq("id", roomId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worship-room"] });
      toast.success("상태가 업데이트되었습니다");
    },
    onError: () => {
      toast.error("상태 업데이트에 실패했습니다");
    },
  });
}
