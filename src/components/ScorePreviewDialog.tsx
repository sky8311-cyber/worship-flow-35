import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FileMusic, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { ScoreViewerDisclaimer } from "@/components/copyright/ScoreViewerDisclaimer";
import { SignedScoreImage } from "@/components/score/SignedScoreImage";

interface ScorePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scoreUrl: string | null;
  songTitle: string;
  songId?: string;
  /**
   * When provided, the dialog loads per-set score variations from set_song_scores
   * (the new architecture). When omitted, only the single `scoreUrl` (if any) is shown.
   * Legacy song_scores library data is no longer queried.
   */
  setSongId?: string;
}

interface ScoreVariation {
  key: string;
  files: Array<{ url: string; page: number }>;
}

export const ScorePreviewDialog = ({
  open,
  onOpenChange,
  scoreUrl,
  songTitle,
  songId,
  setSongId,
}: ScorePreviewDialogProps) => {
  const { t } = useTranslation();
  
  const [scoreVariations, setScoreVariations] = useState<ScoreVariation[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && setSongId) {
      loadScoreVariations();
    } else {
      setScoreVariations([]);
      setSelectedKey("");
      setCurrentPage(0);
    }
  }, [open, setSongId]);

  const loadScoreVariations = async () => {
    if (!setSongId) return;

    setLoading(true);
    try {
      // Per-set scores ONLY. Legacy `song_scores` (Song Library) is intentionally
      // not queried — every worship set must use its own set_song_scores entries.
      const { data, error } = await supabase
        .from("set_song_scores")
        .select("*")
        .eq("set_song_id", setSongId)
        .order("musical_key", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) throw error;

      const grouped: Record<string, Array<{ url: string; page: number }>> = {};
      data?.forEach((score: any, idx: number) => {
        const key = score.musical_key;
        if (!key || key.trim() === "") return;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({
          url: score.score_url,
          page: score.sort_order ?? idx,
        });
      });

      const variations = Object.entries(grouped)
        .filter(([key]) => key && key.trim() !== "")
        .map(([key, files]) => ({
          key,
          files: files.sort((a, b) => a.page - b.page),
        }));

      setScoreVariations(variations);

      if (variations.length > 0) {
        setSelectedKey(variations[0].key);
        setCurrentPage(0);
      }
    } catch (error) {
      console.error("Error loading score variations:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentVariation = scoreVariations.find((v) => v.key === selectedKey);
  const currentFiles = currentVariation?.files || [];
  const hasMultiplePages = currentFiles.length > 1;

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < currentFiles.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // When no per-set variations exist, fall back to the single `scoreUrl` prop
  // (this is a per-set URL passed by the caller, NOT a legacy library file).
  const shouldShowSingleScore = scoreVariations.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton
        className={cn(
          "flex flex-col bg-background",
          // Fullscreen on ALL viewports — image fits screen, no scroll
          "!fixed !top-0 !left-0 !right-0 !bottom-0",
          "!translate-x-0 !translate-y-0",
          "w-screen h-[100dvh] max-w-none max-h-none rounded-none p-3 sm:p-4",
          "pt-[max(0.75rem,env(safe-area-inset-top))]",
          "pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        )}
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-base sm:text-lg flex-1 min-w-0 truncate">
              {t("songLibrary.previewScore")} - {songTitle}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 -mr-2 -mt-2"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        ) : shouldShowSingleScore ? (
          // Single score file display — full-screen fit, no scroll
          <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
            {scoreUrl ? (
              <SignedScoreImage
                src={scoreUrl}
                alt={`${songTitle} score`}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileMusic className="w-16 h-16 mb-4 opacity-50" />
                <p>{t("songLibrary.noScoreAvailable")}</p>
              </div>
            )}
          </div>
        ) : scoreVariations.length > 0 ? (
          // New multi-key variation display
          <>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 flex-shrink-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <label className="text-sm font-medium">{t("songDialog.key")}:</label>
                <Select value={selectedKey} onValueChange={(key) => {
                  setSelectedKey(key);
                  setCurrentPage(0);
                }}>
                 <SelectTrigger className="w-36 sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scoreVariations
                      .filter((variation) => variation.key && variation.key.trim() !== "")
                      .map((variation) => (
                        <SelectItem key={variation.key} value={variation.key}>
                          {variation.key} ({variation.files.length}{" "}
                          {variation.files.length === 1 ? t("songDialog.page") : t("songDialog.page")})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {hasMultiplePages && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {currentPage + 1} / {currentFiles.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === currentFiles.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
              {currentFiles[currentPage] ? (
                <SignedScoreImage
                  src={currentFiles[currentPage].url}
                  alt={`${songTitle} ${selectedKey} - Page ${currentPage + 1}`}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                />
              ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileMusic className="w-16 h-16 mb-4 opacity-50" />
                  <p>{t("songLibrary.noScoreAvailable")}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <FileMusic className="w-16 h-16 mb-4 opacity-50" />
            <p>{t("songLibrary.noScoreAvailable")}</p>
          </div>
        )}

        {/* Score viewer disclaimer - always visible */}
        <div className="flex-shrink-0 mt-2">
          <ScoreViewerDisclaimer />
        </div>
      </DialogContent>
    </Dialog>
  );
};
