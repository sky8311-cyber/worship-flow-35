import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/useTranslation";
import { useCopyrightAcknowledgment } from "@/hooks/useCopyrightAcknowledgment";
import { AlertTriangle } from "lucide-react";

interface CopyrightUploadNoticeProps {
  className?: string;
}

export const CopyrightUploadNotice = ({ className }: CopyrightUploadNoticeProps) => {
  const { language } = useTranslation();
  const { hasAcknowledged, acknowledge, isAcknowledging } = useCopyrightAcknowledgment();
  const isKo = language === "ko";

  return (
    <div className={className}>
      {/* Always-visible disclaimer */}
      <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          {isKo
            ? "업로드하는 콘텐츠에 대한 저작권 책임은 사용자에게 있습니다. 저작권이 있는 자료를 무단으로 업로드하지 마세요."
            : "You are responsible for the copyright of content you upload. Do not upload copyrighted materials without authorization."}
        </span>
      </div>

      {/* Checkbox — only shown if not yet acknowledged */}
      {!hasAcknowledged && (
        <label className="flex items-start gap-2 mt-2 cursor-pointer">
          <Checkbox
            checked={false}
            disabled={isAcknowledging}
            onCheckedChange={async (checked) => {
              if (checked) {
                await acknowledge();
              }
            }}
            className="mt-0.5"
          />
          <span className="text-xs text-muted-foreground leading-tight">
            {isKo
              ? "본인은 해당 콘텐츠를 업로드할 법적 권한이 있으며 저작권을 침해하지 않음을 확인합니다."
              : "I confirm that I have the legal right to upload this content and that it does not infringe copyright."}
          </span>
        </label>
      )}
    </div>
  );
};

/**
 * Wrapper to block upload actions when acknowledgment hasn't been given.
 * Use `hasAcknowledged` from the hook to conditionally disable upload buttons.
 */
export { useCopyrightAcknowledgment };
