import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, AlertCircle, CheckCircle2, XCircle, Image as ImageIcon, Pencil, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Papa from "papaparse";
import XLSX from "xlsx-js-style";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface CSVRow {
  id?: string;  // Optional ID for upsert support
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
  lyrics?: string;
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
    
    // If it's already a URL (starts with http), no need to match
    if (scoreFilename.startsWith('http')) return undefined;
    
    const normalized = normalizeFilename(scoreFilename);
    
    return imageFiles.find(file => {
      const fileNormalized = normalizeFilename(file.name);
      return fileNormalized === normalized || fileNormalized.startsWith(normalized);
    });
  };

  const isExistingUrl = (value: string | undefined): boolean => {
    return !!value && value.startsWith('http');
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

    const validFiles = Array.from(files).filter(file => 
      file.name.endsWith('.csv') || 
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls') ||
      file.type === 'text/csv'
    );

    if (validFiles.length === 0) {
      toast.error("CSV 또는 Excel 파일을 업로드해주세요");
      return;
    }

    setCSVFileCount(validFiles.length);
    const allData: CSVRow[] = [];
    const validationErrors: string[] = [];

    for (const file of validFiles) {
      try {
        let data: CSVRow[];

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Parse Excel file
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer);
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(sheet) as CSVRow[];
        } else {
          // Parse CSV file
          data = await new Promise<CSVRow[]>((resolve, reject) => {
            Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => resolve(results.data as CSVRow[]),
              error: (error) => reject(error),
            });
          });
        }

        data.forEach((row, index) => {
          const error = validateRow(row, allData.length + index);
          if (error) validationErrors.push(`[${file.name}] ${error}`);
        });

        allData.push(...data);
      } catch (error: any) {
        toast.error(`${file.name}: ${error.message}`);
      }
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setCSVData([]);
      setStep("upload");
    } else {
      setErrors([]);
      setCSVData(allData);
      setStep("preview");
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
      const newSongs: CSVRow[] = [];
      const updateSongs: CSVRow[] = [];
      
      // Separate new songs from updates
      csvData.forEach(row => {
        if (row.id && row.id.trim() !== "") {
          updateSongs.push(row);
        } else {
          newSongs.push(row);
        }
      });

      let insertedCount = 0;
      let updatedCount = 0;
      let matchedImages = 0;

      // Process new songs (INSERT)
      if (newSongs.length > 0) {
        const songsToInsert = await Promise.all(
          newSongs.map(async (row) => {
            let uploadedScoreUrl = null;
            
            if (row.score_file_url && !isExistingUrl(row.score_file_url)) {
              const matchedFile = matchImageFile(row.score_file_url, imageFiles);
              if (matchedFile) {
                uploadedScoreUrl = await uploadScoreImage(matchedFile);
                matchedImages++;
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
              lyrics: row.lyrics || null,
            };
          })
        );

        const { error } = await supabase.from("songs").insert(songsToInsert);
        if (error) throw error;
        insertedCount = songsToInsert.length;
      }

      // Process updates (UPDATE)
      if (updateSongs.length > 0) {
        for (const row of updateSongs) {
          let scoreUrl: string | null = null;
          
          // Handle score file URL
          if (row.score_file_url) {
            if (isExistingUrl(row.score_file_url)) {
              // Keep existing URL
              scoreUrl = row.score_file_url;
            } else {
              // Try to match new file
              const matchedFile = matchImageFile(row.score_file_url, imageFiles);
              if (matchedFile) {
                scoreUrl = await uploadScoreImage(matchedFile);
                matchedImages++;
              }
            }
          }

          const updateData: Record<string, any> = {
            title: row.title.trim(),
            subtitle: row.subtitle?.trim() || null,
            artist: row.artist || null,
            language: row.language || null,
            default_key: row.default_key || null,
            category: row.category || null,
            tags: row.tags || null,
            youtube_url: row.youtube_url?.trim() || null,
            interpretation: row.interpretation || null,
            notes: row.notes || null,
            lyrics: row.lyrics || null,
          };

          // Only update score_file_url if we have a new value
          if (scoreUrl !== null) {
            updateData.score_file_url = scoreUrl;
          }

          const { error } = await supabase
            .from("songs")
            .update(updateData)
            .eq("id", row.id);

          if (error) throw error;
          updatedCount++;
        }
      }

      // Show success message
      const messages: string[] = [];
      if (insertedCount > 0) {
        messages.push(`${insertedCount}개 신규 추가`);
      }
      if (updatedCount > 0) {
        messages.push(`${updatedCount}개 업데이트`);
      }
      if (matchedImages > 0) {
        messages.push(`${matchedImages}개 이미지 업로드`);
      }

      toast.success(`가져오기 완료: ${messages.join(", ")}`);
      
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
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F46E5" } },
      alignment: { horizontal: "center" as const }
    };

    const headers = [
      { v: "id", s: headerStyle },
      { v: "title", s: headerStyle },
      { v: "subtitle", s: headerStyle },
      { v: "artist", s: headerStyle },
      { v: "language", s: headerStyle },
      { v: "default_key", s: headerStyle },
      { v: "category", s: headerStyle },
      { v: "tags", s: headerStyle },
      { v: "youtube_url", s: headerStyle },
      { v: "score_file_url", s: headerStyle },
      { v: "interpretation", s: headerStyle },
      { v: "notes", s: headerStyle },
      { v: "lyrics", s: headerStyle },
    ];

    const exampleRows = [
      ["", "Amazing Grace", "", "Traditional", "EN", "G", "모던워십 (서양)", "grace,worship", "https://youtube.com/watch?v=...", "amazing-grace.pdf", "Classic hymn of grace and redemption", "Beautiful traditional hymn", ""],
      ["", "주 안에 있는 나에게", "", "김명식", "KO", "D", "모던워십 (한국)", "은혜,감사", "https://youtube.com/watch?v=...", "joo-ane-innun.pdf", "주님 안에서의 평안을 노래하는 찬양", "", ""],
      ["", "거룩하신 하나님", "주님 찬양해", "마커스워십", "KO", "C", "모던워십 (한국)", "경배,찬양", "https://youtube.com/watch?v=...", "georokhasin-hananim.pdf", "하나님의 거룩하심을 선포하는 곡", "부제가 있는 예시", ""],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
    ws['!cols'] = [
      { wch: 36 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 8 },
      { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 35 }, { wch: 25 },
      { wch: 30 }, { wch: 20 }, { wch: 40 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "song-import-template.xlsx");
  };

  const getImageMatchStatus = () => {
    if (csvData.length === 0 || imageFiles.length === 0) return { matched: 0, total: 0 };
    
    const matched = csvData.filter(row => 
      row.score_file_url && 
      !isExistingUrl(row.score_file_url) &&
      matchImageFile(row.score_file_url, imageFiles)
    ).length;
    
    return { matched, total: csvData.length };
  };

  const getDataCompleteness = () => {
    const newSongs = csvData.filter(row => !row.id || row.id.trim() === "");
    const updateSongs = csvData.filter(row => row.id && row.id.trim() !== "");
    const missingYouTube = csvData.filter(row => !row.youtube_url || row.youtube_url.trim() === "").length;
    const missingScoreFile = csvData.filter(row => !row.score_file_url || row.score_file_url.trim() === "").length;
    const imageMatchStatus = getImageMatchStatus();
    
    return {
      total: csvData.length,
      newCount: newSongs.length,
      updateCount: updateSongs.length,
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

  const getRowType = (row: CSVRow): "new" | "update" => {
    return row.id && row.id.trim() !== "" ? "update" : "new";
  };

  const getScoreStatus = (row: CSVRow) => {
    if (!row.score_file_url || row.score_file_url.trim() === "") {
      return "missing";
    }
    if (isExistingUrl(row.score_file_url)) {
      return "existing";
    }
    const matchedFile = matchImageFile(row.score_file_url, imageFiles);
    return matchedFile ? "matched" : "notMatched";
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
                CSV로 대량 가져오기 및 업데이트가 가능합니다.<br/>
                • <strong>신규 추가:</strong> id 열을 비워두세요<br/>
                • <strong>기존 업데이트:</strong> id 열에 기존 곡 ID를 입력하세요 (내보내기 CSV 사용)
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
                  accept=".csv,.xlsx,.xls"
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
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{getDataCompleteness().total}</div>
                <div className="text-xs text-muted-foreground">전체</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{getDataCompleteness().newCount}</div>
                <div className="text-xs text-muted-foreground">신규 추가</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{getDataCompleteness().updateCount}</div>
                <div className="text-xs text-muted-foreground">업데이트</div>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{getDataCompleteness().matchedImages}</div>
                <div className="text-xs text-muted-foreground">이미지 매칭</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">
                {t("csvImport.songsPreview")} ({csvData.length} {t("csvImport.songs")})
              </h3>
              <div className="border rounded-lg overflow-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left w-8"></th>
                      <th className="p-2 text-left w-20">타입</th>
                      <th className="p-2 text-left">{t("songDialog.title")}</th>
                      <th className="p-2 text-left">{t("songDialog.artist")}</th>
                      <th className="p-2 text-left">{t("songDialog.category")}</th>
                      <th className="p-2 text-left">{t("csvImport.scoreStatus")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.map((row, index) => {
                      const rowType = getRowType(row);
                      const scoreStatus = getScoreStatus(row);
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-2 text-center text-muted-foreground">{index + 1}</td>
                          <td className="p-2">
                            {rowType === "new" ? (
                              <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
                                <Plus className="w-3 h-3" />
                                NEW
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 bg-blue-500/20 text-blue-700 border-blue-300">
                                <Pencil className="w-3 h-3" />
                                UPDATE
                              </Badge>
                            )}
                          </td>
                          <td className="p-2 font-medium">{row.title}</td>
                          <td className="p-2 text-sm">{row.artist || "-"}</td>
                          <td className="p-2 text-sm">{row.category || "-"}</td>
                          <td className="p-2">
                            {scoreStatus === "existing" ? (
                              <Badge variant="outline" className="gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                기존유지
                              </Badge>
                            ) : scoreStatus === "matched" ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {t("csvImport.matched")}
                              </Badge>
                            ) : scoreStatus === "notMatched" ? (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="w-3 h-3" />
                                {t("csvImport.notMatched")}
                              </Badge>
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
                  {importing ? t("csvImport.importing") : `가져오기 (${getDataCompleteness().newCount}개 추가, ${getDataCompleteness().updateCount}개 업데이트)`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
