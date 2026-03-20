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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpTooltip } from "@/components/ui/help-tooltip";
interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface CSVRow {
  id?: string;
  title: string;
  subtitle?: string;
  artist?: string;
  language?: string;
  default_key?: string;
  topics?: string;
  tags?: string;  // Export uses "tags" column
  youtube_url?: string;
  score_file_url?: string;
  interpretation?: string;
  notes?: string;
  lyrics?: string;
  youtube_links?: string;
  scores?: string;
}

const getRowTags = (row: CSVRow): string | null => {
  const val = (row.tags || row.topics || "").trim();
  return val || null;
};

interface ImportProgress {
  phase: string;
  current: number;
  total: number;
}

// 다중 YouTube 링크 파싱: "레이블|URL;;레이블|URL"
const parseYoutubeLinks = (value: string | undefined): { label: string; url: string }[] => {
  if (!value || value.trim() === "") return [];
  return value.split(";;").map(item => {
    const [label, url] = item.split("|");
    return { label: label?.trim() || "YouTube", url: url?.trim() || "" };
  }).filter(item => item.url);
};

// 다중 악보 파싱: "키|URL;;키|URL"
const parseScores = (value: string | undefined): { key: string; url: string }[] => {
  if (!value || value.trim() === "") return [];
  return value.split(";;").map(item => {
    const [key, url] = item.split("|");
    return { key: key?.trim() || "C", url: url?.trim() || "" };
  }).filter(item => item.url);
};

export const CSVImportDialog = ({ open, onOpenChange, onImportComplete }: CSVImportDialogProps) => {
  const { t } = useTranslation();
  const [csvData, setCSVData] = useState<CSVRow[]>([]);
  const [csvFileCount, setCSVFileCount] = useState(0);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [progress, setProgress] = useState<ImportProgress>({ phase: "", current: 0, total: 0 });
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
    setProgress({ phase: "준비 중...", current: 0, total: 0 });
    
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

      // Phase 1: Upload images for new songs
      const songsNeedingImageUpload = newSongs.filter(row => 
        row.score_file_url && !isExistingUrl(row.score_file_url) && matchImageFile(row.score_file_url, imageFiles)
      );
      
      if (songsNeedingImageUpload.length > 0) {
        setProgress({ phase: "이미지 업로드 중", current: 0, total: songsNeedingImageUpload.length });
      }

      const uploadedScoreUrls = new Map<string, string>();
      for (let i = 0; i < songsNeedingImageUpload.length; i++) {
        const row = songsNeedingImageUpload[i];
        const matchedFile = matchImageFile(row.score_file_url!, imageFiles);
        if (matchedFile) {
          const url = await uploadScoreImage(matchedFile);
          if (url) {
            uploadedScoreUrls.set(row.score_file_url!, url);
            matchedImages++;
          }
        }
        setProgress(prev => ({ ...prev, current: i + 1 }));
      }

      // Phase 2: Insert new songs
      if (newSongs.length > 0) {
        setProgress({ phase: "신규 곡 추가 중", current: 0, total: newSongs.length });
        
        for (let i = 0; i < newSongs.length; i++) {
          const row = newSongs[i];
          const uploadedScoreUrl = row.score_file_url ? uploadedScoreUrls.get(row.score_file_url) || null : null;

          const songData = {
            title: row.title.trim(),
            subtitle: row.subtitle?.trim() || null,
            artist: row.artist || null,
            language: row.language || null,
            default_key: row.default_key || null,
            tags: getRowTags(row),
            youtube_url: row.youtube_url?.trim() || null,
            score_file_url: uploadedScoreUrl,
            interpretation: row.interpretation || null,
            notes: row.notes || null,
            lyrics: row.lyrics || null,
          };

          const { data: insertedSong, error } = await supabase
            .from("songs")
            .insert(songData)
            .select("id")
            .single();
          
          if (error) throw error;

          // Insert multiple YouTube links
          const youtubeLinks = parseYoutubeLinks(row.youtube_links);
          if (youtubeLinks.length > 0 && insertedSong) {
            await supabase.from("song_youtube_links").insert(
              youtubeLinks.map((link, idx) => ({
                song_id: insertedSong.id,
                label: link.label,
                url: link.url,
                position: idx + 1
              }))
            );
          }

          // Insert multiple scores
          const scores = parseScores(row.scores);
          if (scores.length > 0 && insertedSong) {
            await supabase.from("song_scores").insert(
              scores.map((score, idx) => ({
                song_id: insertedSong.id,
                key: score.key,
                file_url: score.url,
                position: idx + 1
              }))
            );
          }

          insertedCount++;
          setProgress(prev => ({ ...prev, current: i + 1 }));
        }
      }

      // Phase 3: Update existing songs
      if (updateSongs.length > 0) {
        setProgress({ phase: "기존 곡 업데이트 중", current: 0, total: updateSongs.length });
        
        for (let i = 0; i < updateSongs.length; i++) {
          const row = updateSongs[i];
          let scoreUrl: string | null = null;
          
          // Handle score file URL
          if (row.score_file_url) {
            if (isExistingUrl(row.score_file_url)) {
              scoreUrl = row.score_file_url;
            } else {
              const matchedFile = matchImageFile(row.score_file_url, imageFiles);
              if (matchedFile) {
                scoreUrl = await uploadScoreImage(matchedFile);
                matchedImages++;
              }
            }
          }

          // Full overwrite: all fields replaced (empty → null)
          const updateData: Record<string, any> = {
            title: row.title?.trim() || "",
            subtitle: row.subtitle?.trim() || null,
            artist: row.artist?.trim() || null,
            language: row.language?.trim() || null,
            default_key: row.default_key?.trim() || null,
            tags: getRowTags(row),
            youtube_url: row.youtube_url?.trim() || null,
            interpretation: row.interpretation?.trim() || null,
            notes: row.notes?.trim() || null,
            lyrics: row.lyrics?.trim() || null,
          };

          if (scoreUrl !== null) {
            updateData.score_file_url = scoreUrl;
          }

          const { error } = await supabase
            .from("songs")
            .update(updateData)
            .eq("id", row.id);

          if (error) throw error;

          // Handle multiple YouTube links for updates (replace existing)
          const youtubeLinks = parseYoutubeLinks(row.youtube_links);
          if (youtubeLinks.length > 0) {
            // Delete existing links
            await supabase.from("song_youtube_links").delete().eq("song_id", row.id);
            // Insert new links
            await supabase.from("song_youtube_links").insert(
              youtubeLinks.map((link, idx) => ({
                song_id: row.id,
                label: link.label,
                url: link.url,
                position: idx + 1
              }))
            );
          }

          // Handle multiple scores for updates (replace existing)
          const scores = parseScores(row.scores);
          if (scores.length > 0) {
            // Delete existing scores
            await supabase.from("song_scores").delete().eq("song_id", row.id);
            // Insert new scores
            await supabase.from("song_scores").insert(
              scores.map((score, idx) => ({
                song_id: row.id,
                key: score.key,
                file_url: score.url,
                position: idx + 1
              }))
            );
          }

          updatedCount++;
          setProgress(prev => ({ ...prev, current: i + 1 }));
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
      setProgress({ phase: "", current: 0, total: 0 });
      onImportComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(t("csvImport.error") + ": " + error.message);
    } finally {
      setImporting(false);
      setProgress({ phase: "", current: 0, total: 0 });
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
      { v: "topics", s: headerStyle },
      { v: "youtube_url", s: headerStyle },
      { v: "score_file_url", s: headerStyle },
      { v: "interpretation", s: headerStyle },
      { v: "notes", s: headerStyle },
      { v: "lyrics", s: headerStyle },
      { v: "youtube_links", s: headerStyle },
      { v: "scores", s: headerStyle },
    ];

    const exampleRows = [
      ["", "Amazing Grace", "", "Traditional", "EN", "G", "찬양, 은혜", "https://youtube.com/watch?v=main", "amazing-grace.pdf", "Classic hymn", "Notes", "", "베이스|https://youtube.com/bass;;피아노|https://youtube.com/piano", "C|https://storage.../score-c.jpg;;G|https://storage.../score-g.jpg"],
      ["", "주 안에 있는 나에게", "", "김명식", "KO", "D", "은혜, 감사, 평안", "https://youtube.com/watch?v=main", "", "주님 안에서의 평안", "", "", "드럼|https://youtube.com/drum", "D|https://storage.../score-d.jpg"],
      ["", "거룩하신 하나님", "주님 찬양해", "마커스워십", "KO", "C", "경배, 찬양", "", "", "", "", "", "", ""],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
    ws['!cols'] = [
      { wch: 36 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 8 },
      { wch: 8 }, { wch: 20 }, { wch: 35 }, { wch: 25 },
      { wch: 30 }, { wch: 20 }, { wch: 40 }, { wch: 50 }, { wch: 50 },
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
                <div className="flex items-start gap-1">
                  <span>
                    CSV/Excel 파일로 곡을 대량으로 추가하거나 업데이트합니다.<br/>
                    • <strong>신규 추가:</strong> id 열을 비워두세요<br/>
                    • <strong>기존 업데이트:</strong> id 열에 기존 곡 ID를 입력하세요 (전체 덮어쓰기)
                  </span>
                  <HelpTooltip text="내보내기한 파일을 수정 후 다시 가져오면 ID 기준으로 기존 곡이 업데이트됩니다. 빈 값은 null로 저장됩니다." helpLink="/help#add-song" />
                </div>
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
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  전체
                  <HelpTooltip text="파일에 포함된 총 곡 수" size={12} />
                </div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{getDataCompleteness().newCount}</div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  신규 추가
                  <HelpTooltip text="ID가 없는 곡 — 새로 추가됩니다" size={12} />
                </div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{getDataCompleteness().updateCount}</div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  업데이트
                  <HelpTooltip text="ID가 있는 곡 — 파일 내용으로 전체 덮어쓰기됩니다" size={12} />
                </div>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{getDataCompleteness().matchedImages}</div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  이미지 매칭
                  <HelpTooltip text="업로드한 이미지 파일과 자동 매칭된 악보 수" size={12} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">
                {t("csvImport.songsPreview")} ({csvData.length} {t("csvImport.songs")})
              </h3>
              <ScrollArea className="border rounded-lg max-h-[50vh]">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0 z-10">
                    <tr>
                      <th className="p-2 text-left w-8"></th>
                      <th className="p-2 text-left w-20">
                        <span className="flex items-center gap-1">
                          타입
                          <HelpTooltip text="ID가 있으면 기존 곡을 전체 덮어쓰기, 없으면 신규 추가" size={12} />
                        </span>
                      </th>
                      <th className="p-2 text-left">{t("songDialog.title")}</th>
                      <th className="p-2 text-left">{t("songDialog.artist")}</th>
                      <th className="p-2 text-left">{t("songDialog.topics")}</th>
                      <th className="p-2 text-left">
                        <span className="flex items-center gap-1">
                          {t("csvImport.scoreStatus")}
                          <HelpTooltip text="이미지 파일을 함께 업로드하면 파일명 기준으로 자동 매칭됩니다" size={12} />
                        </span>
                      </th>
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
                          <td className="p-2 text-sm">{getRowTags(row) || "-"}</td>
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
              </ScrollArea>
            </div>

            {/* Progress indicator */}
            {importing && progress.total > 0 && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between text-sm font-medium">
                  <span>{progress.phase}</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <Progress value={(progress.current / progress.total) * 100} />
              </div>
            )}

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep("upload")} disabled={importing}>
                {t("csvImport.back")}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
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
