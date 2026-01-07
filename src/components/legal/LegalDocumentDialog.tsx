import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface LegalDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: "terms" | "privacy";
}

export const LegalDocumentDialog = ({
  open,
  onOpenChange,
  documentType,
}: LegalDocumentDialogProps) => {
  const { language } = useTranslation();

  const { data: document, isLoading } = useQuery({
    queryKey: ["legal-document", documentType, language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_documents")
        .select("*")
        .eq("type", documentType)
        .eq("language", language)
        .eq("is_active", true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {document?.title || (documentType === "terms" 
              ? (language === "ko" ? "이용약관" : "Terms of Service")
              : (language === "ko" ? "개인정보 처리방침" : "Privacy Policy")
            )}
            {document && (
              <Badge variant="secondary" className="text-xs">v{document.version}</Badge>
            )}
          </DialogTitle>
          {document && (
            <p className="text-xs text-muted-foreground">
              {language === "ko" ? "시행일: " : "Effective: "}
              {format(new Date(document.effective_date), "yyyy-MM-dd")}
            </p>
          )}
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : document ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {document.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4 whitespace-pre-wrap leading-relaxed text-sm">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">
              {language === "ko" ? "문서를 불러올 수 없습니다." : "Document not available."}
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};