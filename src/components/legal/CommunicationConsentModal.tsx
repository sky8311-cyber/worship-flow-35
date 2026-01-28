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
import { Loader2, Mail, Check, X } from "lucide-react";
import { toast } from "sonner";

interface CommunicationsDocument {
  type: "terms" | "privacy" | "communications";
  version: string;
  title: string;
  content: string;
  effective_date: string;
}

interface CommunicationConsentModalProps {
  open: boolean;
  communicationsDoc: CommunicationsDocument | null;
  onConsentComplete: () => void;
}

export const CommunicationConsentModal = ({
  open,
  communicationsDoc,
  onConsentComplete,
}: CommunicationConsentModalProps) => {
  const { language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleAccept = async (acceptAll: boolean) => {
    if (!user || !communicationsDoc) return;
    
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

      // Record acceptance for communications document
      const { error: acceptError } = await supabase
        .from("legal_acceptances")
        .insert({
          user_id: user.id,
          document_type: "communications" as any,
          version: communicationsDoc.version,
          language: language as "ko" | "en",
          ip_address: null,
        });
      
      if (acceptError) throw acceptError;

      // Create email preferences based on user choice
      const { error: prefError } = await (supabase
        .from("email_preferences" as any)
        .upsert({
          user_id: user.id,
          automated_reminders: acceptAll,
          community_updates: acceptAll,
          product_updates: acceptAll,
          marketing_emails: acceptAll,
        }, { onConflict: "user_id" }) as any);

      if (prefError) throw prefError;
      
      // Optimistically update the cache
      queryClient.setQueryData(
        ["legal-consent-check", user.id, language],
        { needsConsent: false, pendingDocuments: [], needsCommunicationConsentOnly: false }
      );
      
      toast.success(
        acceptAll 
          ? (language === "ko" ? "이메일 수신에 동의하셨습니다" : "Email preferences saved")
          : (language === "ko" ? "이메일 수신 거부가 설정되었습니다" : "Email opt-out saved")
      );
      onConsentComplete();
    } catch (error: any) {
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

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md" 
        hideCloseButton
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">
            {language === "ko" ? "이메일 수신 설정" : "Email Preferences"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {language === "ko" 
              ? "K-Worship에서 서비스 관련 이메일을 보내드립니다."
              : "K-Worship would like to send you service-related emails."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span>📬</span>
              <span>{language === "ko" ? "자동 리마인더" : "Automated reminders"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👥</span>
              <span>{language === "ko" ? "커뮤니티/서비스 업데이트" : "Community/service updates"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🎯</span>
              <span>{language === "ko" ? "마케팅 이메일" : "Marketing emails"}</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            {language === "ko" 
              ? "설정 > 이메일 수신 설정에서 언제든지 변경할 수 있습니다."
              : "You can change this anytime in Settings > Email Preferences."}
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline"
            onClick={() => handleAccept(false)} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
            {language === "ko" ? "수신 안함" : "No thanks"}
          </Button>
          <Button 
            onClick={() => handleAccept(true)} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            {language === "ko" ? "수신 동의하기" : "Accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
