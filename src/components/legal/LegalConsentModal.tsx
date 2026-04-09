import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Shield, ExternalLink, Mail, Scale } from "lucide-react";
import { toast } from "sonner";

interface PendingDocument {
  type: "terms" | "privacy" | "communications" | "copyright";
  version: string;
  title: string;
  content: string;
  effective_date: string;
}

interface LegalConsentModalProps {
  open: boolean;
  pendingDocuments: PendingDocument[];
  onConsentComplete: () => void;
}

export const LegalConsentModal = ({
  open,
  pendingDocuments,
  onConsentComplete,
}: LegalConsentModalProps) => {
  const { language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [agreed, setAgreed] = useState(false);
  const [communicationConsent, setCommunicationConsent] = useState(true); // Default checked
  const [loading, setLoading] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  // Filter documents: terms and privacy are mandatory, communications is optional
  const mandatoryDocs = pendingDocuments.filter(d => d.type === "terms" || d.type === "privacy" || d.type === "copyright");
  const communicationsDoc = pendingDocuments.find(d => d.type === "communications");

  const handleAccept = async () => {
    if (!user || !agreed) return;
    
    setLoading(true);
    try {
      // 세션 갱신 시도
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        toast.error(
          language === "ko" 
            ? "세션이 만료되었습니다. 페이지를 새로고침 해주세요." 
            : "Session expired. Please refresh the page."
        );
        setLoading(false);
        return;
      }

      // Record acceptance for mandatory documents (terms, privacy)
      for (const doc of mandatoryDocs) {
        const { error } = await supabase.from("legal_acceptances").insert({
          user_id: user.id,
          document_type: doc.type,
          version: doc.version,
          language: language as "ko" | "en",
          ip_address: null,
        });
        
        if (error) throw error;
      }

      // Record acceptance for communications (if present)
      if (communicationsDoc) {
        const { error } = await supabase.from("legal_acceptances").insert({
          user_id: user.id,
          document_type: "communications" as any,
          version: communicationsDoc.version,
          language: language as "ko" | "en",
          ip_address: null,
        });
        
        if (error) throw error;

        // Create email preferences based on communication consent
        const { error: prefError } = await (supabase
          .from("email_preferences" as any)
          .upsert({
            user_id: user.id,
            automated_reminders: communicationConsent,
            community_updates: communicationConsent,
            product_updates: communicationConsent,
            marketing_emails: communicationConsent,
          }, { onConflict: "user_id" }) as any);

        if (prefError) throw prefError;
      }
      
      // Optimistically update the cache to prevent modal from re-appearing on back navigation
      queryClient.setQueryData(
        ["legal-consent-check", user.id, language],
        { needsConsent: false, pendingDocuments: [], needsCommunicationConsentOnly: false }
      );
      
      toast.success(language === "ko" ? "약관에 동의하셨습니다" : "Terms accepted");
      onConsentComplete();
    } catch (error: any) {
      // RLS 오류인 경우 친절한 메시지
      if (error.code === "42501") {
        toast.error(
          language === "ko"
            ? "인증 오류가 발생했습니다. 페이지를 새로고침 해주세요."
            : "Authentication error. Please refresh the page."
        );
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    if (type === "terms") return FileText;
    if (type === "privacy") return Shield;
    if (type === "copyright") return Scale;
    return Mail;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-lg" 
        hideCloseButton
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {language === "ko" ? "약관이 업데이트되었습니다" : "Updated Terms & Policies"}
          </DialogTitle>
          <DialogDescription>
            {language === "ko" 
              ? "계속 사용하시려면 업데이트된 약관에 동의해 주세요."
              : "Please review and accept our updated policies to continue."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Show only mandatory documents (terms, privacy) in expandable list */}
          {mandatoryDocs.map((doc) => {
            const Icon = getIcon(doc.type);
            const isExpanded = expandedDoc === doc.type;
            
            return (
              <div key={doc.type} className="border rounded-lg overflow-hidden">
                <div 
                  className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => setExpandedDoc(isExpanded ? null : doc.type)}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{doc.title}</span>
                    <Badge variant="secondary" className="text-xs">v{doc.version}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    {isExpanded 
                      ? (language === "ko" ? "접기" : "Hide") 
                      : (language === "ko" ? "보기" : "View")}
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                
                {isExpanded && (
                  <ScrollArea className="h-48 p-3 border-t">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {doc.content.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-3 whitespace-pre-wrap leading-relaxed text-xs">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            );
          })}
        </div>

        {/* Mandatory terms checkbox */}
        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
          <Checkbox
            id="consent"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <Label htmlFor="consent" className="text-sm cursor-pointer leading-relaxed">
            {language === "ko" 
              ? "위 약관에 동의합니다 (필수)"
              : "I agree to the above terms and policies (required)"}
          </Label>
        </div>

        {/* Optional communication consent checkbox */}
        {communicationsDoc && (
          <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Checkbox
              id="communication-consent"
              checked={communicationConsent}
              onCheckedChange={(checked) => setCommunicationConsent(checked as boolean)}
            />
            <div>
              <Label htmlFor="communication-consent" className="text-sm cursor-pointer leading-relaxed">
                {language === "ko" 
                  ? "서비스 관련 이메일 수신에 동의합니다 (선택)"
                  : "I agree to receive service-related emails (optional)"}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "ko"
                  ? "리마인더, 커뮤니티 업데이트, 마케팅 이메일 등"
                  : "Reminders, community updates, marketing emails, etc."}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button 
            onClick={handleAccept} 
            disabled={!agreed || loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {language === "ko" ? "동의하고 계속하기" : "Accept and Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};