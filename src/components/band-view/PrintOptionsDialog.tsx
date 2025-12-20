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

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = generatePrintHtml();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    onOpenChange(false);
  };

  const generatePrintHtml = () => {
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
        const selectedKey = setSong.key || song?.default_key || "";
        
        // Get scores for this song from allSongScores prop
        const songScores = allSongScores.filter((s) => s.song_id === setSong.song_id);
        
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
              url: score.file_url,
            });
          });
        } else if (setSong.override_score_file_url || song?.score_file_url) {
          printScores.push({
            title: song?.title || "",
            key: selectedKey || "",
            url: setSong.override_score_file_url || song?.score_file_url,
          });
        }
      });

      content = printScores.map((score, idx) => `
        <div class="score-page">
          <img src="${score.url}" />
          <div class="score-overlay">
            ${score.title} ${score.key ? `(${score.key})` : ""} · ${idx + 1}/${printScores.length}
          </div>
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
    } else {
      // Full mode - use browser print
      window.print();
      return "";
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
              height: 100vh;
              width: 100vw;
              display: flex;
              align-items: center;
              justify-content: center;
              background: black;
              padding: 0;
              margin: 0;
              position: relative;
            }
            .score-page img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .score-overlay {
              position: absolute;
              bottom: 16px;
              left: 0;
              right: 0;
              text-align: center;
              color: rgba(255,255,255,0.7);
              font-size: 12px;
              background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
              padding: 24px 16px 16px;
            }
            @media print {
              @page { margin: 0; size: auto; }
              body { margin: 0; padding: 0; background: black; }
              .score-page { 
                page-break-inside: avoid;
                height: 100vh !important;
                width: 100vw !important;
              }
              .score-page:last-child { page-break-after: avoid; }
              .score-page img {
                width: 100% !important;
                height: 100% !important;
                object-fit: contain !important;
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
