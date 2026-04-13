import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/useTranslation";
import { Printer, FileText, Music2, LayoutList } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { getSignedScoreUrls } from "@/utils/scoreUrl";

interface SongScore {
  id: string;
  song_id: string;
  key: string;
  file_url: string;
  page_number?: number | null;
}

interface PrintOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceSet: any;
  setSongs: any[];
  setComponents: any[];
  allSongScores?: SongScore[];
  browsingKeyIndex?: Record<string, number>;
}

type PrintMode = "order" | "scores" | "full";

interface PrintFields {
  serviceInfo: boolean;
  songTitles: boolean;
  keyBpm: boolean;
  performanceNotes: boolean;
  lyrics: boolean;
  components: boolean;
}

export function PrintOptionsDialog({
  open,
  onOpenChange,
  serviceSet,
  setSongs,
  setComponents,
  allSongScores = [],
  browsingKeyIndex = {},
}: PrintOptionsDialogProps) {
  const { t, language } = useTranslation();
  const [printMode, setPrintMode] = useState<PrintMode>("order");
  const [fields, setFields] = useState<PrintFields>({
    serviceInfo: true,
    songTitles: true,
    keyBpm: true,
    performanceNotes: true,
    lyrics: false,
    components: true,
  });

  const handleFieldChange = (field: keyof PrintFields) => {
    setFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const waitForImages = (doc: Document, callback: () => void) => {
    const images = doc.querySelectorAll("img");
    let loadedCount = 0;
    const totalImages = images.length;

    if (totalImages === 0) {
      callback();
      return;
    }

    const checkComplete = () => {
      loadedCount++;
      if (loadedCount === totalImages) callback();
    };

    images.forEach((img) => {
      if (img.complete) {
        checkComplete();
      } else {
        img.onload = checkComplete;
        img.onerror = checkComplete;
      }
    });

    // 5 second timeout fallback
    setTimeout(() => {
      if (loadedCount < totalImages) callback();
    }, 5000);
  };

  const handlePrint = async () => {
    // Collect all score URLs that need signing
    const allScoreUrls: string[] = [];
    setSongs.forEach((setSong) => {
      const songScores = allSongScores.filter((s) => s.song_id === setSong.song_id);
      songScores.forEach((s) => { if (s.file_url) allScoreUrls.push(s.file_url); });
      if (setSong.override_score_file_url) allScoreUrls.push(setSong.override_score_file_url);
      if (setSong.songs?.score_file_url) allScoreUrls.push(setSong.songs.score_file_url);
    });

    // Batch-sign all URLs before generating HTML
    const signedUrlMap = await getSignedScoreUrls(allScoreUrls);
    const getSignedUrl = (url: string) => signedUrlMap.get(url) || url;

    const html = generatePrintHtml(getSignedUrl);
    if (!html) return;

    // Close dialog first
    onOpenChange(false);

    // Detect iOS/Safari/Mobile
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Delay to allow dialog to fully close
    setTimeout(() => {
      if (isIOS || (isMobile && isSafari)) {
        // iOS/Safari: Use Blob URL in new tab
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, "_blank");

        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.focus();
              printWindow.print();
              URL.revokeObjectURL(url);
            }, 500);
          };
        } else {
          // Popup blocked: fallback to replace page content
          const originalContent = document.body.innerHTML;
          document.body.innerHTML = html;
          window.print();
          document.body.innerHTML = originalContent;
          window.location.reload();
        }
      } else {
        // Desktop/Android: Use iframe method
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "none";
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();

          waitForImages(doc, () => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 1000);
          });
        }
      }
    }, 300);
  };

  const generatePrintHtml = (getSignedUrl: (url: string) => string) => {
    const dateStr = format(
      new Date(serviceSet.date),
      language === "ko" ? "yyyy년 M월 d일 (EEEE)" : "MMMM d, yyyy (EEEE)",
      { locale: language === "ko" ? ko : undefined }
    );

    // Merge songs and components
    const mergedItems = [
      ...setSongs.map((song) => ({ type: "song", data: song, position: song.position })),
      ...setComponents.map((comp) => ({ type: "component", data: comp, position: comp.position })),
    ].sort((a, b) => a.position - b.position);

    let content = "";

    if (printMode === "scores") {
      // Scores only mode - one score per page
      // Use allSongScores prop for real-time score data
      const printScores: { title: string; key: string; url: string }[] = [];
      setSongs.forEach((setSong) => {
        const song = setSong.songs;
        
        // Get available keys for this song
        const songScores = allSongScores.filter((s) => s.song_id === setSong.song_id);
        const availableKeys = [...new Set(songScores.map(s => s.key).filter(Boolean))];
        const currentBrowsingIdx = browsingKeyIndex[setSong.id];
        
        // Priority: browsing key > saved score_key > performance key
        const selectedKey = 
          (currentBrowsingIdx !== undefined && availableKeys[currentBrowsingIdx])
          || setSong.score_key 
          || setSong.key 
          || song?.default_key 
          || "";
        
        // First try exact key match
        let scoreFiles = songScores
          .filter((score) => score.key === selectedKey)
          .sort((a, b) => (a.page_number || 1) - (b.page_number || 1));
        
        // If no exact match, fallback to first available key
        if (scoreFiles.length === 0 && songScores.length > 0) {
          const fallbackKey = songScores[0].key;
          scoreFiles = songScores
            .filter((s) => s.key === fallbackKey)
            .sort((a, b) => (a.page_number || 1) - (b.page_number || 1));
        }
        
        if (scoreFiles.length > 0) {
          scoreFiles.forEach((score) => {
            printScores.push({
              title: song?.title || "",
              key: selectedKey || "",
              url: getSignedUrl(score.file_url),
            });
          });
        } else if (setSong.override_score_file_url || song?.score_file_url) {
          printScores.push({
            title: song?.title || "",
            key: selectedKey || "",
            url: getSignedUrl(setSong.override_score_file_url || song?.score_file_url),
          });
        }
      });

      content = printScores.map((score) => `
        <div class="score-page">
          <img src="${score.url}" />
        </div>
      `).join("");
    } else if (printMode === "order") {
      // Order sheet mode
      content = `
        ${fields.serviceInfo ? `
          <div class="header" style="margin-bottom: 24px; border-bottom: 2px solid #333; padding-bottom: 16px;">
            <h1 style="font-size: 24px; margin: 0 0 8px 0;">${serviceSet.service_name}</h1>
            <p style="color: #666; margin: 4px 0;">${dateStr}</p>
            ${serviceSet.worship_leader ? `<p style="margin: 4px 0;"><strong>${language === "ko" ? "인도자" : "Leader"}:</strong> ${serviceSet.worship_leader}</p>` : ""}
            ${serviceSet.theme ? `<p style="margin: 4px 0;"><strong>${language === "ko" ? "주제" : "Theme"}:</strong> ${serviceSet.theme}</p>` : ""}
            ${serviceSet.scripture_reference ? `<p style="margin: 4px 0;"><strong>${language === "ko" ? "본문" : "Scripture"}:</strong> ${serviceSet.scripture_reference}</p>` : ""}
          </div>
        ` : ""}
        <div class="items">
          ${mergedItems.map((item) => {
            if (item.type === "component" && fields.components) {
              const comp = item.data;
              return `
                <div class="item" style="padding: 12px 0; border-bottom: 1px solid #eee; display: flex; gap: 16px;">
                  <div style="width: 32px; height: 32px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">
                    ${item.position}
                  </div>
                  <div style="flex: 1;">
                    <span style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${comp.label || comp.component_type}</span>
                    ${comp.duration_minutes ? `<span style="color: #666; font-size: 12px; margin-left: 8px;">${comp.duration_minutes}${language === "ko" ? "분" : "min"}</span>` : ""}
                  </div>
                </div>
              `;
            } else if (item.type === "song") {
              const setSong = item.data;
              const song = setSong.songs;
              if (!fields.songTitles) return "";
              return `
                <div class="item" style="padding: 12px 0; border-bottom: 1px solid #eee; display: flex; gap: 16px;">
                  <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #2b4b8a, #d16265); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; flex-shrink: 0;">
                    ${item.position}
                  </div>
                  <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 16px;">${song?.title || ""}</div>
                    ${song?.artist ? `<div style="color: #666; font-size: 14px;">${song.artist}</div>` : ""}
                    ${fields.keyBpm ? `
                      <div style="margin-top: 4px; display: flex; gap: 8px;">
                        ${setSong.key ? `<span style="background: #2b4b8a; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${language === "ko" ? "키" : "Key"}: ${setSong.key}</span>` : ""}
                        ${setSong.bpm ? `<span style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px; font-size: 12px;">BPM: ${setSong.bpm}</span>` : ""}
                        ${setSong.time_signature ? `<span style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${setSong.time_signature}</span>` : ""}
                      </div>
                    ` : ""}
                    ${fields.performanceNotes && setSong.custom_notes ? `
                      <div style="margin-top: 8px; padding: 8px; background: #fef3c7; border-radius: 4px; font-size: 13px;">
                        ${setSong.custom_notes}
                      </div>
                    ` : ""}
                    ${fields.lyrics && setSong.lyrics ? `
                      <div style="margin-top: 8px; padding: 8px; background: #f3f4f6; border-radius: 4px; white-space: pre-wrap; font-size: 12px;">
                        ${setSong.lyrics}
                      </div>
                    ` : ""}
                  </div>
                </div>
              `;
            }
            return "";
          }).join("")}
        </div>
      `;
    } else if (printMode === "full") {
      // Full mode - one page per song with all info + score
      content = setSongs.map((setSong, index) => {
        const song = setSong.songs;
        
        // Get available keys for this song
        const songScores = allSongScores.filter((s) => s.song_id === setSong.song_id);
        const availableKeys = [...new Set(songScores.map(s => s.key).filter(Boolean))];
        const currentBrowsingIdx = browsingKeyIndex[setSong.id];
        
        // Priority: browsing key > saved score_key > performance key
        const selectedKey = 
          (currentBrowsingIdx !== undefined && availableKeys[currentBrowsingIdx])
          || setSong.score_key 
          || setSong.key 
          || song?.default_key 
          || "";
        
        // Get score URL
        let scoreUrl = "";
        
        const keyScores = songScores
          .filter((score) => score.key === selectedKey)
          .sort((a, b) => (a.page_number || 1) - (b.page_number || 1));
        
        if (keyScores.length > 0) {
          scoreUrl = getSignedUrl(keyScores[0].file_url);
        } else if (songScores.length > 0) {
          scoreUrl = getSignedUrl(songScores[0].file_url);
        } else {
          const rawUrl = setSong.override_score_file_url || song?.score_file_url || "";
          scoreUrl = rawUrl ? getSignedUrl(rawUrl) : "";
        }

        return `
          <div class="full-page">
            <div class="song-header">
              <div class="position-badge">${index + 1}</div>
              <div class="song-info">
                <h2>${song?.title || ""}</h2>
                ${song?.artist ? `<p class="artist">${song.artist}</p>` : ""}
                <div class="meta">
                  ${setSong.key ? `<span class="key">${language === "ko" ? "키" : "Key"}: ${setSong.key}</span>` : ""}
                  ${setSong.bpm ? `<span class="bpm">BPM: ${setSong.bpm}</span>` : ""}
                  ${setSong.time_signature ? `<span class="time">${setSong.time_signature}</span>` : ""}
                </div>
              </div>
            </div>
            
            ${setSong.custom_notes ? `
              <div class="notes-section">
                <strong>${language === "ko" ? "곡 진행 / 부가 설명" : "Performance Notes"}:</strong>
                <p>${setSong.custom_notes}</p>
              </div>
            ` : ""}
            
            ${scoreUrl ? `
              <div class="score-section">
                <img src="${scoreUrl}" alt="${song?.title || "Score"}" />
              </div>
            ` : `
              <div class="no-score">
                <p>${language === "ko" ? "악보 없음" : "No score available"}</p>
              </div>
            `}
          </div>
        `;
      }).join("");
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${serviceSet.service_name} - ${dateStr}</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 24px;
              color: #1f2937;
            }
            .score-page {
              page-break-after: always;
              page-break-inside: avoid;
              width: 100%;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: white;
              padding: 16px;
              margin: 0;
              box-sizing: border-box;
            }
            .score-page:last-child {
              page-break-after: avoid;
            }
            .score-page img {
              max-width: 100%;
              max-height: calc(100vh - 32px);
              width: auto;
              height: auto;
              object-fit: contain;
            }
            
            /* Full page mode styles */
            .full-page {
              page-break-after: always;
              height: 100vh;
              width: 100%;
              padding: 24px;
              display: flex;
              flex-direction: column;
              box-sizing: border-box;
            }
            .full-page:last-child {
              page-break-after: avoid;
            }
            .song-header {
              display: flex;
              align-items: flex-start;
              gap: 16px;
              margin-bottom: 16px;
              flex-shrink: 0;
            }
            .position-badge {
              width: 48px;
              height: 48px;
              background: linear-gradient(135deg, #2b4b8a, #d16265);
              border-radius: 12px;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: bold;
              flex-shrink: 0;
            }
            .song-info h2 {
              margin: 0 0 4px 0;
              font-size: 22px;
              font-weight: 600;
            }
            .song-info .artist {
              margin: 0;
              color: #666;
              font-size: 14px;
            }
            .song-info .meta {
              margin-top: 8px;
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
            }
            .song-info .meta span {
              padding: 2px 10px;
              border-radius: 4px;
              font-size: 12px;
            }
            .song-info .key {
              background: #2b4b8a;
              color: white;
            }
            .song-info .bpm, .song-info .time {
              background: #e5e7eb;
              color: #374151;
            }
            .notes-section {
              background: #fef3c7;
              padding: 12px 16px;
              border-radius: 8px;
              margin-bottom: 16px;
              flex-shrink: 0;
              border-left: 4px solid #f59e0b;
            }
            .notes-section strong {
              display: block;
              margin-bottom: 4px;
              font-size: 13px;
              color: #92400e;
            }
            .notes-section p {
              margin: 0;
              font-size: 14px;
              white-space: pre-wrap;
            }
            .score-section {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              min-height: 0;
            }
            .score-section img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .no-score {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #9ca3af;
              font-size: 16px;
            }
            
            @media print {
              @page { 
                margin: 10mm;
                size: A4 portrait;
              }
              html, body {
                margin: 0;
                padding: 0;
                width: 100%;
              }
              .score-page { 
                page-break-after: always;
                page-break-inside: avoid;
                width: 100% !important;
                height: auto !important;
                min-height: 0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
              }
              .score-page:last-child { 
                page-break-after: avoid; 
              }
              .score-page img {
                max-width: 100% !important;
                max-height: 260mm !important;
                width: auto !important;
                height: auto !important;
                object-fit: contain !important;
              }
              .full-page {
                page-break-inside: avoid;
                height: auto !important;
                min-height: 0 !important;
              }
              .full-page:last-child {
                page-break-after: avoid;
              }
            }
            
            /* Mobile-specific print rules - does not affect desktop */
            @media print and (max-width: 768px) {
              @page { 
                margin: 8mm;
                size: A4 portrait;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
              }
              body {
                padding: 0 !important;
              }
              .score-page { 
                page-break-after: always !important;
                page-break-inside: avoid !important;
                break-after: page !important;
                break-inside: avoid !important;
                width: 100% !important;
                height: auto !important;
                min-height: 0 !important;
                max-height: none !important;
                display: block !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                overflow: visible !important;
              }
              .score-page:last-child { 
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              .score-page img {
                max-width: 100% !important;
                max-height: 270mm !important;
                width: auto !important;
                height: auto !important;
                object-fit: contain !important;
                display: block !important;
                margin: 0 auto !important;
              }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            {t("bandView.printOptions.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Print Mode Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("bandView.printOptions.mode")}</Label>
            <RadioGroup
              value={printMode}
              onValueChange={(value) => setPrintMode(value as PrintMode)}
              className="space-y-2"
            >
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="order" id="order" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="order" className="flex items-center gap-2 cursor-pointer font-medium">
                    <LayoutList className="w-4 h-4" />
                    {t("bandView.printOptions.orderMode")}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("bandView.printOptions.orderModeDesc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="scores" id="scores" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="scores" className="flex items-center gap-2 cursor-pointer font-medium">
                    <Music2 className="w-4 h-4" />
                    {t("bandView.printOptions.scoresMode")}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("bandView.printOptions.scoresModeDesc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="full" id="full" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="full" className="flex items-center gap-2 cursor-pointer font-medium">
                    <FileText className="w-4 h-4" />
                    {t("bandView.printOptions.fullMode")}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("bandView.printOptions.fullModeDesc")}
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Field Selection (only for order mode) */}
          {printMode === "order" && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t("bandView.printOptions.fields")}</Label>
              <div className="space-y-2">
                {[
                  { key: "serviceInfo", label: t("bandView.printOptions.serviceInfo") },
                  { key: "songTitles", label: t("bandView.printOptions.songTitles") },
                  { key: "keyBpm", label: t("bandView.printOptions.keyBpm") },
                  { key: "performanceNotes", label: t("bandView.printOptions.performanceNotes") },
                  { key: "lyrics", label: t("bandView.printOptions.lyrics") },
                  { key: "components", label: t("bandView.printOptions.components") },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={fields[key as keyof PrintFields]}
                      onCheckedChange={() => handleFieldChange(key as keyof PrintFields)}
                    />
                    <Label htmlFor={key} className="text-sm cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            {t("bandView.printOptions.printButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
