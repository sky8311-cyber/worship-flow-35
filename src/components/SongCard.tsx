import { useState, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "./FavoriteButton";
import { Edit, Trash2, Youtube, FileText, Eye, Plus, BarChart3, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { ScorePreviewDialog } from "./ScorePreviewDialog";
import { SongUsageHistoryDialog } from "./SongUsageHistoryDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Helper function to check if song is new (within 14 days)
const isNewSong = (createdAt: string | null) => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  return created > fourteenDaysAgo;
};

interface SongCardProps {
  song: any;
  onEdit?: (song: any) => void;
  onDelete?: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (songId: string) => void;
  inCart?: boolean;
  onToggleCart?: () => void;
  isFavorite?: boolean;
  favoriteCount?: number;
  usageCount?: number;
  // Selector mode props - for use in SongSelector dialog
  selectorMode?: boolean;
  isSelectedForSet?: boolean;
  onSelectForSet?: (song: any, selectedKey?: string, selectedScoreUrl?: string) => void;
  selectedScoreKey?: string;
  selectedScoreUrl?: string;
}

export const SongCard = memo(function SongCard({ 
  song, 
  onEdit, 
  onDelete,
  selectionMode = false,
  isSelected = false,
  onToggleSelection,
  inCart = false,
  onToggleCart,
  isFavorite = false,
  favoriteCount = 0,
  usageCount = 0,
  selectorMode = false,
  isSelectedForSet = false,
  onSelectForSet,
  selectedScoreKey,
  selectedScoreUrl
}: SongCardProps) {
  const { t, language } = useTranslation();
  const { isAdmin, isWorshipLeader } = useAuth();
  const queryClient = useQueryClient();
  const [scorePreviewOpen, setScorePreviewOpen] = useState(false);
  const [usageHistoryOpen, setUsageHistoryOpen] = useState(false);
  
  // Check if user can see usage history (admin or worship leader only)
  const canViewUsageHistory = isAdmin || isWorshipLeader;

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("songs")
        .delete()
        .eq("id", song.id);

      if (error) throw error;
      
      // Invalidate queries for real-time UI update
      await queryClient.invalidateQueries({ queryKey: ["songs"] });
      
      toast.success(t("songCard.songDeleted"));
      onDelete?.();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const getCategoryTranslation = (category: string | null) => {
    if (!category) {
      return t("songLibrary.categories.uncategorized");
    }
    const categoryMap: { [key: string]: string } = {
      "찬송가": t("songLibrary.categories.hymn"),
      "모던워십 (한국)": t("songLibrary.categories.modernKorean"),
      "모던워십 (서양)": t("songLibrary.categories.modernWestern"),
      "모던워십 (기타)": t("songLibrary.categories.modernOther"),
      "한국 복음성가": t("songLibrary.categories.koreanGospel"),
    };
    return categoryMap[category] || category;
  };

  const getLanguageTranslation = (lang: string) => {
    const langMap: { [key: string]: string } = {
      "KO": t("songLibrary.languages.ko"),
      "EN": t("songLibrary.languages.en"),
      "KO/EN": t("songLibrary.languages.koen"),
    };
    return langMap[lang] || lang;
  };

  return (
    <>
      <Card className={`shadow-md hover:shadow-lg transition-all animate-fade-in overflow-hidden relative ${
        selectionMode && isSelected ? "ring-2 ring-primary shadow-lg" : ""
      } ${
        inCart ? "ring-2 ring-blue-500 shadow-lg" : ""
      } ${
        selectorMode && isSelectedForSet ? "ring-2 ring-primary shadow-lg" : ""
      }`}>
        {selectionMode && (
          <div className="absolute top-2 right-2 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection?.(song.id)}
              className="bg-background shadow-md h-5 w-5"
            />
          </div>
        )}
        {song.score_file_url && (
          <div 
            className="relative h-32 bg-muted cursor-pointer group"
            onClick={() => setScorePreviewOpen(true)}
          >
            <img 
              src={song.score_file_url} 
              alt={`${song.title} score preview`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
        <CardContent className="p-5">
          <div className="mb-3">
            <div className="flex items-baseline mb-1">
              <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">{song.title}</h3>
              {isNewSong(song.created_at) && (
                <sup className="ml-0.5 bg-green-500 text-white text-[8px] font-bold px-1 py-0 rounded leading-none">
                  N
                </sup>
              )}
            </div>
            {song.artist && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{song.artist}</p>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {song.default_key && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                  {song.default_key}
                </span>
              )}
              {song.language && (
                <span className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded-full">
                  {getLanguageTranslation(song.language)}
                </span>
              )}
              <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                {getCategoryTranslation(song.category)}
              </span>
            </div>
          </div>

          {/* Media buttons - stacked on mobile */}
          <div className="flex flex-col sm:flex-row gap-2">
            {song.youtube_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(song.youtube_url, "_blank")}
                className="flex-1 w-full"
              >
                <Youtube className="w-4 h-4 mr-1 text-red-500" />
                <span className="truncate">{t("songCard.viewYouTube")}</span>
              </Button>
            )}
            {song.score_file_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScorePreviewOpen(true)}
                className="flex-1 w-full"
              >
                <FileText className="w-4 h-4 mr-1 text-blue-500" />
                <span className="truncate">{t("songCard.viewScore")}</span>
              </Button>
            )}
          </div>

          {/* Action buttons - Selector mode or Cart first, Usage History, then Heart, Edit, Delete */}
          <div className="flex gap-1 justify-start mt-4">
            {selectorMode && onSelectForSet && (
              <Button
                variant={isSelectedForSet ? "default" : "outline"}
                size="sm"
                onClick={() => onSelectForSet(song, selectedScoreKey, selectedScoreUrl)}
                className="h-7 sm:h-8 px-2 tracking-tight"
              >
                {isSelectedForSet ? (
                  <><Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5" />{t("songSelector.selected")}</>
                ) : (
                  <><Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5" />{t("songSelector.addToSet")}</>
                )}
              </Button>
            )}
            {!selectorMode && onToggleCart && (
              <Button
                variant={inCart ? "default" : "outline"}
                size="icon"
                onClick={() => onToggleCart()}
                className="h-7 w-7 sm:h-8 sm:w-8"
                title={inCart ? t("songLibrary.inCart") : t("songLibrary.addToCart")}
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Button>
            )}
            {canViewUsageHistory && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setUsageHistoryOpen(true)}
                className="h-7 w-7 sm:h-8 sm:w-8 relative"
                title={t("songUsage.viewUsageHistory")}
              >
                <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {usageCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-primary text-primary-foreground text-[10px] rounded-full h-4 min-w-4 flex items-center justify-center font-bold px-1">
                    {usageCount > 99 ? "99+" : usageCount}
                  </span>
                )}
              </Button>
            )}
            <FavoriteButton 
              songId={song.id} 
              isFavorite={isFavorite}
              favoriteCount={favoriteCount}
              size="icon" 
              variant="outline" 
              className="h-7 w-7 sm:h-8 sm:w-8" 
            />
            {onEdit && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onEdit(song)}
                className="h-7 w-7 sm:h-8 sm:w-8"
                title={t("common.edit")}
              >
                <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                    title={t("common.delete")}
                  >
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("songCard.deleteConfirm")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      {t("common.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
      
      <ScorePreviewDialog
        open={scorePreviewOpen}
        onOpenChange={setScorePreviewOpen}
        scoreUrl={song.score_file_url}
        songTitle={song.title}
        songId={song.id}
      />
      
      <SongUsageHistoryDialog
        open={usageHistoryOpen}
        onOpenChange={setUsageHistoryOpen}
        songId={song.id}
        songTitle={song.title}
      />
    </>
  );
});
