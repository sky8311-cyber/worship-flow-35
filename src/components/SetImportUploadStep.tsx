import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface SetImportUploadStepProps {
  onFileSelect: (file: File) => void;
  onDownloadTemplate: () => void;
  fileName?: string;
}

export const SetImportUploadStep = ({
  onFileSelect,
  onDownloadTemplate,
  fileName,
}: SetImportUploadStepProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">{t("setImport.uploadStep")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("setImport.uploadDescription")}
        </p>
      </div>

      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={onDownloadTemplate}
          className="w-full"
        >
          <FileText className="w-4 h-4 mr-2" />
          {t("setImport.downloadTemplate")}
        </Button>

        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-2">
            {fileName || t("setImport.dragDropCSV")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("setImport.clickToUpload")}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
