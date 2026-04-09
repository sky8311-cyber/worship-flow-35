import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

interface PendingDocument {
  type: "terms" | "privacy" | "communications" | "copyright";
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
      if (!user) return { needsConsent: false, pendingDocuments: [], needsCommunicationConsentOnly: false };

      // 세션 유효성 검증 - 실제 토큰이 있는지 확인
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.warn("[useLegalConsent] No active session, skipping consent check");
        return { needsConsent: false, pendingDocuments: [], needsCommunicationConsentOnly: false };
      }

      // Get active terms, privacy, and communications documents
      const { data: activeDocuments, error: docsError } = await supabase
        .from("legal_documents")
        .select("*")
        .eq("language", language)
        .eq("is_active", true)
        .in("type", ["terms", "privacy", "communications", "copyright"]);

      if (docsError) throw docsError;

      // Get user's latest acceptances
      const { data: acceptances, error: accError } = await supabase
        .from("legal_acceptances")
        .select("*")
        .eq("user_id", user.id)
        .eq("language", language)
        .in("document_type", ["terms", "privacy", "communications", "copyright"]);

      if (accError) throw accError;

      // Find documents that need consent
      const pendingDocuments: PendingDocument[] = [];
      let hasPendingTerms = false;
      let hasPendingPrivacy = false;
      let hasPendingCommunications = false;
      let hasPendingCopyright = false;
      
      for (const doc of activeDocuments || []) {
        const latestAcceptance = acceptances?.find(
          (a) => a.document_type === doc.type && a.version === doc.version
        );
        
        if (!latestAcceptance) {
          pendingDocuments.push({
            type: doc.type as "terms" | "privacy" | "communications" | "copyright",
            version: doc.version,
            title: doc.title,
            content: doc.content,
            effective_date: doc.effective_date,
          });
          
          if (doc.type === "terms") hasPendingTerms = true;
          if (doc.type === "privacy") hasPendingPrivacy = true;
          if (doc.type === "communications") hasPendingCommunications = true;
          if (doc.type === "copyright") hasPendingCopyright = true;
        }
      }

      // Determine if only communication consent is needed (for existing users)
      const needsCommunicationConsentOnly = 
        !hasPendingTerms && 
        !hasPendingPrivacy && 
        !hasPendingCopyright &&
        hasPendingCommunications;

      return {
        needsConsent: pendingDocuments.length > 0,
        pendingDocuments,
        needsCommunicationConsentOnly,
      };
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    needsConsent: data?.needsConsent ?? false,
    pendingDocuments: data?.pendingDocuments ?? [],
    needsCommunicationConsentOnly: data?.needsCommunicationConsentOnly ?? false,
    isLoading: authLoading || isLoading,
    refetch,
  };
};
