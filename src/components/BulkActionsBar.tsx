import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkCategorize: (category: string) => void;
  onClearSelection: () => void;
  bulkEditMode: boolean;
  onEnterBulkEdit: () => void;
  onSaveBulkEdit: () => void;
  onCancelBulkEdit: () => void;
}

export const BulkActionsBar = ({
  selectedCount,
  onBulkDelete,
  onBulkCategorize,
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
            
            <Select onValueChange={onBulkCategorize}>
              <SelectTrigger className="h-9 bg-primary-foreground text-primary border-none w-[140px]">
                <SelectValue placeholder={t("songLibrary.bulkCategorize")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">{t("songLibrary.categories.uncategorized")}</SelectItem>
                <SelectItem value="찬송가">{t("songLibrary.categories.hymn")}</SelectItem>
                <SelectItem value="모던워십 (한국)">{t("songLibrary.categories.modernKorean")}</SelectItem>
                <SelectItem value="모던워십 (서양)">{t("songLibrary.categories.modernWestern")}</SelectItem>
                <SelectItem value="모던워십 (기타)">{t("songLibrary.categories.modernOther")}</SelectItem>
                <SelectItem value="한국 복음성가">{t("songLibrary.categories.koreanGospel")}</SelectItem>
              </SelectContent>
            </Select>

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
