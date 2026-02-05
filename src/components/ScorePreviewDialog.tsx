import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FileMusic, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ScorePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scoreUrl: string | null;
  songTitle: string;
  songId?: string;
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
}: ScorePreviewDialogProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [scoreVariations, setScoreVariations] = useState<ScoreVariation[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && songId) {
      loadScoreVariations();
    } else {
      setScoreVariations([]);
      setSelectedKey("");
      setCurrentPage(0);
    }
  }, [open, songId]);

  const loadScoreVariations = async () => {
    if (!songId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("song_scores")
        .select("*")
        .eq("song_id", songId)
        .order("key", { ascending: true })
        .order("page_number", { ascending: true });

      if (error) throw error;

      // Group by key - filter out empty keys
      const grouped: Record<string, Array<{ url: string; page: number }>> = {};
      data?.forEach((score) => {
        // Skip entries with empty or missing keys
        if (!score.key || score.key.trim() === "") return;
        
        if (!grouped[score.key]) {
          grouped[score.key] = [];
        }
        grouped[score.key].push({
          url: score.file_url,
          page: score.page_number,
        });
      });

      const variations = Object.entries(grouped)
        .filter(([key]) => key && key.trim() !== "") // Extra safety check
        .map(([key, files]) => ({
          key,
          files: files.sort((a, b) => a.page - b.page),
        }));

      setScoreVariations(variations);
      
      // Auto-select first key
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

  // Fallback to old single score file if no variations exist
  const shouldShowOldScore = !songId || (scoreVariations.length === 0 && scoreUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton={isMobile}
        className={cn(
          "flex flex-col",
          // Mobile: fullscreen
          "w-full h-[100dvh] max-w-full max-h-[100dvh] rounded-none p-4",
          // Desktop: centered modal
          "sm:max-w-4xl sm:max-h-[90vh] sm:h-auto sm:rounded-xl sm:p-6"
        )}
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base sm:text-lg pr-8">
              {t("songLibrary.previewScore")} - {songTitle}
            </DialogTitle>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        ) : shouldShowOldScore ? (
          // Old single score file display
          <div className="flex-1 overflow-auto min-h-0">
            {scoreUrl ? (
              <img
                src={scoreUrl}
                alt={`${songTitle} score`}
                className="w-full h-auto rounded-lg"
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
                  <SelectTrigger className="w-24 sm:w-32">
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

            <div className="flex-1 overflow-auto min-h-0">
              {currentFiles[currentPage] ? (
                <img
                  src={currentFiles[currentPage].url}
                  alt={`${songTitle} ${selectedKey} - Page ${currentPage + 1}`}
                  className="w-full h-auto rounded-lg"
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
      </DialogContent>
    </Dialog>
  );
};
