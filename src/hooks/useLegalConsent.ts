import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

interface PendingDocument {
  type: "terms" | "privacy";
  version: string;
  title: string;
  content: string;
  effective_date: string;
}

export const useLegalConsent = () => {
  const { user, loading: authLoading } = useAuth();
  const { language } = useTranslation();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["legal-consent-check", user?.id, language],
    queryFn: async () => {
      if (!user) return { needsConsent: false, pendingDocuments: [] };

      // Get active terms and privacy documents
      const { data: activeDocuments, error: docsError } = await supabase
        .from("legal_documents")
        .select("*")
        .eq("language", language)
        .eq("is_active", true)
        .in("type", ["terms", "privacy"]);

      if (docsError) throw docsError;

      // Get user's latest acceptances
      const { data: acceptances, error: accError } = await supabase
        .from("legal_acceptances")
        .select("*")
        .eq("user_id", user.id)
        .eq("language", language)
        .in("document_type", ["terms", "privacy"]);

      if (accError) throw accError;

      // Find documents that need consent
      const pendingDocuments: PendingDocument[] = [];
      
      for (const doc of activeDocuments || []) {
        const latestAcceptance = acceptances?.find(
          (a) => a.document_type === doc.type && a.version === doc.version
        );
        
        if (!latestAcceptance) {
          pendingDocuments.push({
            type: doc.type as "terms" | "privacy",
            version: doc.version,
            title: doc.title,
            content: doc.content,
            effective_date: doc.effective_date,
          });
        }
      }

      return {
        needsConsent: pendingDocuments.length > 0,
        pendingDocuments,
      };
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    needsConsent: data?.needsConsent ?? false,
    pendingDocuments: data?.pendingDocuments ?? [],
    isLoading: authLoading || isLoading,
    refetch,
  };
};