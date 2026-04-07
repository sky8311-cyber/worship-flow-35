import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

const CURRENT_VERSION = "1.0";

export const useCopyrightAcknowledgment = () => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const queryClient = useQueryClient();

  const { data: hasAcknowledged, isLoading } = useQuery({
    queryKey: ["copyright-acknowledgment", user?.id, CURRENT_VERSION],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("upload_copyright_acknowledgments")
        .select("id")
        .eq("user_id", user.id)
        .eq("acknowledgment_version", CURRENT_VERSION)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("upload_copyright_acknowledgments")
        .upsert({
          user_id: user.id,
          acknowledgment_version: CURRENT_VERSION,
          language,
          accepted_at: new Date().toISOString(),
        }, { onConflict: "user_id,acknowledgment_version" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copyright-acknowledgment"] });
    },
  });

  return {
    hasAcknowledged: hasAcknowledged ?? false,
    isLoading,
    acknowledge: acknowledgeMutation.mutateAsync,
    isAcknowledging: acknowledgeMutation.isPending,
  };
};
