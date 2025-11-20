import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { FileText } from "lucide-react";

interface ScorePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scoreUrl: string | null;
  songTitle: string;
}

export const ScorePreviewDialog = ({
  open,
  onOpenChange,
  scoreUrl,
  songTitle,
}: ScorePreviewDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t("songLibrary.previewScore")} - {songTitle}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {scoreUrl ? (
            <img
              src={scoreUrl}
              alt={`${songTitle} score`}
              className="w-full h-auto rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="w-16 h-16 mb-4" />
              <p>{t("songLibrary.noScoreAvailable")}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
