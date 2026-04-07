import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

const CURRENT_VERSION = "1.0";

export const useCopyrightAcknowledgment = () => {
  const { user } = useAuth();
  const { language } = useTranslation();

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("upload_copyright_acknowledgments")
        .insert({
          user_id: user.id,
          acknowledgment_version: CURRENT_VERSION,
          language,
          accepted_at: new Date().toISOString(),
        });
      if (error) throw error;
    },
  });

  return {
    acknowledge: acknowledgeMutation.mutateAsync,
    isAcknowledging: acknowledgeMutation.isPending,
  };
};
