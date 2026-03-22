import { useState, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FavoriteButton } from "./FavoriteButton";
import { Edit, Trash2, Youtube, Eye, ShoppingCart, BarChart3, Check, Lock } from "lucide-react";
import { FileMusic, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { openYouTubeUrl } from "@/lib/youtubeHelper";
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
  
  // Fallback: use song_scores if score_file_url is not directly set
  const scoreUrl = song.score_file_url || song.song_scores?.[0]?.file_url || null;
  
  const canViewUsageHistory = isAdmin || isWorshipLeader;

  const handleDelete = async () => {
    try {
      const { count } = await supabase
        .from("set_songs")
        .select("*", { count: "exact", head: true })
        .eq("song_id", song.id);
      
      if (count && count > 0) {
        toast.error(
          language === "ko"
            ? `이 곡은 ${count}개의 워십세트에서 사용 중이므로 삭제할 수 없습니다.`
            : `This song is used in ${count} worship set(s) and cannot be deleted.`
        );
        return;
      }

      const { error } = await supabase
        .from("songs")
        .delete()
        .eq("id", song.id);

      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ["songs"] });
      
      toast.success(t("songCard.songDeleted"));
      onDelete?.();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const getLanguageTranslation = (lang: string) => {
    const langMap: { [key: string]: string } = {
      "KO": t("songLibrary.languages.ko"),
      "EN": t("songLibrary.languages.en"),
      "KO/EN": t("songLibrary.languages.koen"),
    };
    return langMap[lang] || lang;
  };

  const isDraft = song.status === 'draft';

  return (
    <>
      <Card className={`shadow-md hover:shadow-lg transition-all animate-fade-in overflow-hidden relative ${
        inCart ? "ring-2 ring-blue-500 shadow-lg" : ""
      } ${
        selectorMode && isSelectedForSet ? "ring-2 ring-primary shadow-lg" : ""
      } ${
        isDraft ? "opacity-75" : ""
      }`}>
        {isDraft && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-orange-500 text-white border-orange-500 text-[10px] px-1.5 py-0.5">
              {language === "ko" ? "임시저장" : "Draft"}
            </Badge>
          </div>
        )}
        {scoreUrl && (
          <div 
            className="relative h-32 bg-muted cursor-pointer group"
            onClick={() => setScorePreviewOpen(true)}
          >
            <img 
              src={scoreUrl} 
              alt={`${song.title} score preview`}
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
        <CardContent className="p-5">
          <div className="mb-3">
           {song.is_private && (
             <div className="flex justify-end mb-1">
               <Badge variant="secondary" className="text-xs gap-1">
                 <Lock className="w-3 h-3" />
                 {t("songDialog.private")}
               </Badge>
             </div>
           )}
            <div className="flex items-baseline gap-1.5 mb-1">
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
            </div>
          </div>

          {/* Media buttons (hidden for drafts) */}
          {!isDraft && (
            <div className="flex flex-col sm:flex-row gap-2">
              {song.youtube_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openYouTubeUrl(song.youtube_url)}
                  className="flex-1 w-full group hover:bg-accent hover:text-white hover:border-accent"
                  data-tutorial="song-youtube-btn"
                >
                  <Youtube className="w-4 h-4 mr-1 text-accent group-hover:text-white" />
                  <span className="truncate">{t("songCard.viewYouTube")}</span>
                </Button>
              )}
              {scoreUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScorePreviewOpen(true)}
                  className="flex-1 w-full group hover:bg-primary hover:text-white hover:border-primary"
                >
                  <FileMusic className="w-4 h-4 mr-1 text-primary group-hover:text-white" />
                  <span className="truncate">{t("songCard.viewScore")}</span>
                </Button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <TooltipProvider>
            <div className="flex gap-1 justify-start mt-4">
              {isDraft ? (
                onEdit && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onEdit(song)}
                    className="h-8 px-3 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    {language === "ko" ? "곡 등록 마무리" : "Finish Registration"}
                  </Button>
                )
              ) : (
                <>
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
                        <>
                          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5" />
                          {song.is_private && <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5" />}
                          {t("songSelector.addToSet")}
                        </>
                      )}
                    </Button>
                  )}
                  {!selectorMode && onToggleCart && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={inCart ? "default" : "outline"}
                          size="icon"
                          onClick={() => onToggleCart()}
                          className="h-7 w-7 sm:h-8 sm:w-8"
                        >
                          <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {inCart ? t("songLibrary.inCart") : t("songLibrary.addToCart")}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {canViewUsageHistory && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setUsageHistoryOpen(true)}
                          className="h-7 w-7 sm:h-8 sm:w-8 relative"
                        >
                          <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {usageCount > 0 && (
                            <span className="absolute -top-1 -right-1.5 bg-primary text-primary-foreground text-[10px] rounded-full h-4 min-w-4 flex items-center justify-center font-bold px-1">
                              {usageCount > 99 ? "99+" : usageCount}
                            </span>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("songUsage.viewUsageHistory")}</TooltipContent>
                    </Tooltip>
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEdit(song)}
                          className="h-7 w-7 sm:h-8 sm:w-8"
                        >
                          <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("common.edit")}</TooltipContent>
                    </Tooltip>
                  )}
                  {onDelete && (
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="group h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:bg-destructive hover:text-white hover:border-destructive"
                            >
                              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:text-white" />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("common.delete")}</TooltipContent>
                      </Tooltip>
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
                </>
              )}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
      
      <ScorePreviewDialog
        open={scorePreviewOpen}
        onOpenChange={setScorePreviewOpen}
        scoreUrl={scoreUrl}
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
