import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, AlertCircle, CheckCircle2, XCircle, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Papa from "papaparse";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
  const [csvFileCount, setCSVFileCount] = useState(0);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const normalizeFilename = (filename: string): string => {
    return filename.toLowerCase().trim().replace(/\s+/g, "-");
  };

  const matchImageFile = (scoreFilename: string, imageFiles: File[]): File | undefined => {
    if (!scoreFilename) return undefined;
    
    const normalized = normalizeFilename(scoreFilename);
    
    return imageFiles.find(file => {
      const fileNormalized = normalizeFilename(file.name);
      return fileNormalized === normalized || fileNormalized.startsWith(normalized);
    });
  };

  const validateRow = (row: CSVRow, index: number): string | null => {
    if (!row.title || row.title.trim() === "") {
      return t("csvImport.rowError", { row: index + 2, error: t("songDialog.titleRequired") });
    }

    return null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const csvFiles = Array.from(files).filter(file => 
      file.name.endsWith('.csv') || file.type === 'text/csv'
    );

    if (csvFiles.length === 0) {
      toast.error("Please upload CSV files");
      return;
    }

    setCSVFileCount(csvFiles.length);
    const allData: CSVRow[] = [];
    const validationErrors: string[] = [];
    let processedFiles = 0;

    for (const file of csvFiles) {
      await new Promise<void>((resolve) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data as CSVRow[];
            
            data.forEach((row, index) => {
              const error = validateRow(row, allData.length + index);
              if (error) validationErrors.push(`[${file.name}] ${error}`);
            });

            allData.push(...data);
            processedFiles++;
            
            if (processedFiles === csvFiles.length) {
              if (validationErrors.length > 0) {
                setErrors(validationErrors);
                setCSVData([]);
                setStep("upload");
              } else {
                setErrors([]);
                setCSVData(allData);
                setStep("preview");
              }
            }
            resolve();
          },
          error: (error) => {
            toast.error(`${file.name}: ${error.message}`);
            resolve();
          },
        });
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    const imageFileList = Array.from(files).filter(file => 
      file.type.startsWith("image/") || file.type === "application/pdf"
    );
    
    setImageFiles(imageFileList);
  };

  const uploadScoreImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("scores")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("scores")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      return null;
    }
  };

  const handleImport = async () => {
    if (csvData.length === 0) return;

    setImporting(true);
    try {
      const songsToInsert = await Promise.all(
        csvData.map(async (row) => {
          let uploadedScoreUrl = null;
          
          if (row.score_file_url) {
            const matchedFile = matchImageFile(row.score_file_url, imageFiles);
            if (matchedFile) {
              uploadedScoreUrl = await uploadScoreImage(matchedFile);
            }
          }

          return {
            title: row.title.trim(),
            subtitle: row.subtitle?.trim() || null,
            artist: row.artist || null,
            language: row.language || null,
            default_key: row.default_key || null,
            category: row.category || null,
            tags: row.tags || null,
            youtube_url: row.youtube_url?.trim() || null,
            score_file_url: uploadedScoreUrl,
            interpretation: row.interpretation || null,
            notes: row.notes || null,
          };
        })
      );

      const { error } = await supabase.from("songs").insert(songsToInsert);

      if (error) throw error;

      const matchedCount = csvData.filter(row => 
        matchImageFile(row.score_file_url || "", imageFiles)
      ).length;

      toast.success(t("csvImport.successWithImages", { 
        count: csvData.length, 
        images: matchedCount 
      }));
      
      setCSVData([]);
      setImageFiles([]);
      setErrors([]);
      setStep("upload");
      onImportComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(t("csvImport.error") + ": " + error.message);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `title,subtitle,artist,language,default_key,category,tags,youtube_url,score_file_url,interpretation,notes
Amazing Grace,,Traditional,EN,G,모던워십 (서양),"grace,worship",https://youtube.com/watch?v=...,amazing-grace.pdf,Classic hymn of grace and redemption,Beautiful traditional hymn
주 안에 있는 나에게,,김명식,KO,D,모던워십 (한국),"은혜,감사",https://youtube.com/watch?v=...,joo-ane-innun.pdf,주님 안에서의 평안을 노래하는 찬양,
거룩하신 하나님,주님 찬양해,마커스워십,KO,C,모던워십 (한국),"경배,찬양",https://youtube.com/watch?v=...,georokhasin-hananim.pdf,하나님의 거룩하심을 선포하는 곡,부제가 있는 예시
`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "song-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getImageMatchStatus = () => {
    if (csvData.length === 0 || imageFiles.length === 0) return { matched: 0, total: 0 };
    
    const matched = csvData.filter(row => 
      matchImageFile(row.score_file_url || "", imageFiles)
    ).length;
    
    return { matched, total: csvData.length };
  };

  const getDataCompleteness = () => {
    const missingYouTube = csvData.filter(row => !row.youtube_url || row.youtube_url.trim() === "").length;
    const missingScoreFile = csvData.filter(row => !row.score_file_url || row.score_file_url.trim() === "").length;
    const imageMatchStatus = getImageMatchStatus();
    
    return {
      total: csvData.length,
      missingYouTube,
      missingScoreFile,
      matchedImages: imageMatchStatus.matched
    };
  };

  const handleReset = () => {
    setCSVData([]);
    setCSVFileCount(0);
    setImageFiles([]);
    setErrors([]);
    setStep("upload");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleReset();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("csvImport.title")}</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {t("csvImport.instructionsWithImages")}
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

            <div className="grid md:grid-cols-2 gap-4">
              <div 
                className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">{t("csvImport.uploadCSV")}</p>
                <p className="text-xs text-muted-foreground">
                  {csvData.length > 0 
                    ? `${csvFileCount} ${t("csvImport.filesLoaded")}, ${csvData.length} ${t("csvImport.songsLoaded")}` 
                    : t("csvImport.clickToUpload")}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div 
                className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">{t("csvImport.uploadImages")}</p>
                <p className="text-xs text-muted-foreground">
                  {imageFiles.length > 0 ? `${imageFiles.length} ${t("csvImport.imagesLoaded")}` : t("csvImport.clickToUpload")}
                </p>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={() => {
                  if (csvData.length > 0) {
                    setStep("preview");
                  } else {
                    toast.error(t("csvImport.uploadCSVOnly"));
                  }
                }}
                disabled={csvData.length === 0}
              >
                {t("csvImport.continue")}
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {t("csvImport.dataCompleteness", getDataCompleteness())}
              </AlertDescription>
            </Alert>

            <div>
              <h3 className="font-semibold mb-3">
                {t("csvImport.songsPreview")} ({csvData.length} {t("csvImport.songs")})
              </h3>
              <div className="border rounded-lg overflow-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left w-8"></th>
                      <th className="p-2 text-left">{t("songDialog.title")}</th>
                      <th className="p-2 text-left">{t("songDialog.artist")}</th>
                      <th className="p-2 text-left">{t("songDialog.category")}</th>
                      <th className="p-2 text-left">{t("songDialog.key")}</th>
                      <th className="p-2 text-left">{t("csvImport.youtubeStatus")}</th>
                      <th className="p-2 text-left">{t("csvImport.scoreStatus")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.map((row, index) => {
                      const matchedFile = matchImageFile(row.score_file_url || "", imageFiles);
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-2 text-center text-muted-foreground">{index + 1}</td>
                          <td className="p-2 font-medium">{row.title}</td>
                          <td className="p-2 text-sm">{row.artist || "-"}</td>
                          <td className="p-2 text-sm">{row.category || "-"}</td>
                          <td className="p-2 text-sm">
                            {row.default_key || "-"}
                          </td>
                          <td className="p-2">
                            {row.youtube_url && row.youtube_url.trim() !== "" ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {t("csvImport.youtubePresent")}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {t("csvImport.youtubeMissing")}
                              </Badge>
                            )}
                          </td>
                          <td className="p-2">
                            {row.score_file_url && row.score_file_url.trim() !== "" ? (
                              matchedFile ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {t("csvImport.matched")}
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="w-3 h-3" />
                                  {t("csvImport.notMatched")}
                                </Badge>
                              )
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {t("csvImport.scoreMissing")}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                {t("csvImport.back")}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? t("csvImport.importing") : t("csvImport.importWithImages", getImageMatchStatus())}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
