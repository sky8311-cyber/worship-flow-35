import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, AlertCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Papa from "papaparse";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface CSVRow {
  title: string;
  subtitle?: string;
  artist?: string;
  language?: string;
  default_key?: string;
  bpm?: string;
  time_signature?: string;
  energy_level?: string;
  category?: string;
  tags?: string;
  youtube_url?: string;
  score_file_url?: string;
  interpretation?: string;
  notes?: string;
}

export const CSVImportDialog = ({ open, onOpenChange, onImportComplete }: CSVImportDialogProps) => {
  const { t } = useTranslation();
  const [csvData, setCSVData] = useState<CSVRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateRow = (row: CSVRow, index: number): string | null => {
    if (!row.title || row.title.trim() === "") {
      return t("csvImport.rowError", { row: index + 2, error: t("songDialog.titleRequired") });
    }

    if (!row.youtube_url || row.youtube_url.trim() === "") {
      return t("csvImport.rowError", { row: index + 2, error: t("csvImport.youtubeRequired") });
    }

    if (!row.score_file_url || row.score_file_url.trim() === "") {
      return t("csvImport.rowError", { row: index + 2, error: t("csvImport.scoreRequired") });
    }

    if (row.bpm && isNaN(Number(row.bpm))) {
      return t("csvImport.rowError", { row: index + 2, error: "BPM must be a number" });
    }

    if (row.energy_level) {
      const level = Number(row.energy_level);
      if (isNaN(level) || level < 1 || level > 5) {
        return t("csvImport.rowError", { row: index + 2, error: "Energy level must be 1-5" });
      }
    }

    return null;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        const validationErrors: string[] = [];

        data.forEach((row, index) => {
          const error = validateRow(row, index);
          if (error) validationErrors.push(error);
        });

        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          setCSVData([]);
        } else {
          setErrors([]);
          setCSVData(data);
        }
      },
      error: (error) => {
        toast.error(t("csvImport.error") + ": " + error.message);
      },
    });
  };

  const handleImport = async () => {
    if (csvData.length === 0) return;

    setImporting(true);
    try {
    const songsToInsert = csvData.map((row) => ({
      title: row.title.trim(),
      subtitle: row.subtitle?.trim() || null,
      artist: row.artist || null,
      language: row.language || null,
      default_key: row.default_key || null,
      bpm: row.bpm ? parseInt(row.bpm) : null,
      time_signature: row.time_signature || null,
      energy_level: row.energy_level ? parseInt(row.energy_level) : null,
      category: row.category || null,
      tags: row.tags || null,
      youtube_url: row.youtube_url?.trim() || null,
      score_file_url: row.score_file_url?.trim() || null,
      interpretation: row.interpretation || null,
      notes: row.notes || null,
    }));

      const { error } = await supabase.from("songs").insert(songsToInsert);

      if (error) throw error;

      toast.success(t("csvImport.success", { count: csvData.length }));
      setCSVData([]);
      setErrors([]);
      onImportComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(t("csvImport.error") + ": " + error.message);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `title,subtitle,artist,language,default_key,bpm,time_signature,energy_level,category,tags,youtube_url,score_file_url,interpretation,notes
Amazing Grace,,Traditional,EN,G,80,4/4,3,모던워십 (서양),"grace,worship",https://youtube.com/watch?v=...,https://supabase.co/.../score.pdf,Classic hymn of grace and redemption,Beautiful traditional hymn
주 안에 있는 나에게,,김명식,KO,D,120,4/4,4,모던워십 (한국),"은혜,감사",https://youtube.com/watch?v=...,https://supabase.co/.../score.pdf,주님 안에서의 평안을 노래하는 찬양,
거룩하신 하나님,주님 찬양해,마커스워십,KO,C,95,4/4,5,모던워십 (한국),"경배,찬양",https://youtube.com/watch?v=...,https://supabase.co/.../score.pdf,하나님의 거룩하심을 선포하는 곡,부제가 있는 예시
`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "song-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("csvImport.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t("csvImport.instructions")}
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {t("csvImport.downloadTemplate")}
            </Button>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              {t("csvImport.dragDrop")}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">{t("csvImport.validationError")}</div>
                <ul className="text-sm space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {csvData.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">
                {t("csvImport.preview")} ({csvData.length} {t("songLibrary.title")})
              </h3>
              <div className="border rounded-lg overflow-auto max-h-60">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">{t("songDialog.title")}</th>
                      <th className="p-2 text-left">{t("songDialog.artist")}</th>
                      <th className="p-2 text-left">{t("songDialog.language")}</th>
                      <th className="p-2 text-left">{t("songDialog.key")}</th>
                      <th className="p-2 text-left">{t("songDialog.bpm")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{row.title}</td>
                        <td className="p-2">{row.artist}</td>
                        <td className="p-2">{row.language}</td>
                        <td className="p-2">{row.default_key}</td>
                        <td className="p-2">{row.bpm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvData.length > 10 && (
                  <div className="p-2 text-center text-sm text-muted-foreground bg-muted">
                    ... and {csvData.length - 10} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleImport}
              disabled={csvData.length === 0 || importing}
            >
              {importing ? t("csvImport.importing") : t("csvImport.import")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
