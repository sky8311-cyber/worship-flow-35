import { useTranslation } from "@/hooks/useTranslation";
import DOMPurify from "dompurify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface AutomatedEmailTemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  body: string;
  triggerDays: number;
  emailType: string;
}

const emailTypeLabels: Record<string, { label: string; labelKo: string }> = {
  inactive_user: { label: "Inactive User Reminder", labelKo: "미접속자 리마인더" },
  no_team_invite: { label: "Team Invite Reminder", labelKo: "팀원 초대 리마인더" },
  no_worship_set: { label: "Worship Set Reminder", labelKo: "워십세트 생성 리마인더" },
};

// Replace template variables with sample values
function replaceVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
}

export const AutomatedEmailTemplatePreviewDialog = ({
  open,
  onOpenChange,
  subject,
  body,
  triggerDays,
  emailType,
}: AutomatedEmailTemplatePreviewDialogProps) => {
  const { language } = useTranslation();

  const sampleVariables: Record<string, string> = {
    user_name: language === "ko" ? "홍길동" : "John Doe",
    days: triggerDays.toString(),
    community_name: language === "ko" ? "샘플 교회 찬양팀" : "Sample Church Worship Team",
    app_url: "https://kworship.app",
    cta_url: "https://kworship.app/set-builder",
  };

  const previewSubject = replaceVariables(subject, sampleVariables);
  const previewBody = replaceVariables(body, sampleVariables);
  const sanitizedBody = DOMPurify.sanitize(previewBody);

  const typeInfo = emailTypeLabels[emailType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            👁️ {language === "ko" ? "템플릿 미리보기" : "Template Preview"}
            <Badge variant="secondary" className="ml-2">
              {language === "ko" ? typeInfo?.labelKo : typeInfo?.label}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {language === "ko"
              ? "실제 발송 시 변수는 각 수신자 정보로 치환됩니다."
              : "Variables will be replaced with recipient data when sent."}
          </DialogDescription>
        </DialogHeader>

        {/* Subject Preview */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {language === "ko" ? "제목" : "Subject"}
          </p>
          <div className="p-3 bg-muted rounded-lg border">
            <p className="font-medium">{previewSubject}</p>
          </div>
        </div>

        {/* Body Preview */}
        <div className="space-y-1 flex-1 min-h-0">
          <p className="text-xs font-medium text-muted-foreground">
            {language === "ko" ? "본문" : "Body"}
          </p>
          <ScrollArea className="flex-1 border rounded-lg bg-white dark:bg-zinc-950">
            <div className="p-4">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizedBody }}
              />
            </div>
          </ScrollArea>
        </div>

        {/* Variable Info */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">
              {language === "ko" ? "샘플 데이터 사용 중" : "Using Sample Data"}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              {language === "ko" 
                ? `{{user_name}} → ${sampleVariables.user_name}, {{days}} → ${sampleVariables.days}, {{community_name}} → ${sampleVariables.community_name}`
                : `{{user_name}} → ${sampleVariables.user_name}, {{days}} → ${sampleVariables.days}, {{community_name}} → ${sampleVariables.community_name}`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "ko" ? "닫기" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
