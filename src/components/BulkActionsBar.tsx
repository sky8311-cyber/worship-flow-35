import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  bulkEditMode: boolean;
  onEnterBulkEdit: () => void;
  onSaveBulkEdit: () => void;
  onCancelBulkEdit: () => void;
}

export const BulkActionsBar = ({
  selectedCount,
  onBulkDelete,
  onClearSelection,
  bulkEditMode,
  onEnterBulkEdit,
  onSaveBulkEdit,
  onCancelBulkEdit,
}: BulkActionsBarProps) => {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-50">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-3">
        <span className="font-medium flex-shrink-0">
          {t("songLibrary.selectedCount", { count: selectedCount })}
        </span>
        
        {!bulkEditMode ? (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={onEnterBulkEdit}
              className="h-9"
            >
              {t("songLibrary.bulkEdit")}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              className="h-9"
            >
              {t("songLibrary.bulkDelete")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={onSaveBulkEdit}
              className="h-9 bg-green-500 text-white hover:bg-green-600"
            >
              {t("songLibrary.saveAll")}
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={onCancelBulkEdit}
              className="h-9"
            >
              {t("common.cancel")}
            </Button>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
