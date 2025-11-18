import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Music2, Trash2, Youtube, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";
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

interface SongCardProps {
  song: any;
  onEdit?: (song: any) => void;
  onDelete?: () => void;
}

export const SongCard = ({ song, onEdit, onDelete }: SongCardProps) => {
  const { t, language } = useTranslation();

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("songs")
        .delete()
        .eq("id", song.id);

      if (error) throw error;
      toast.success(t("songCard.songDeleted"));
      onDelete();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const getLastUsedDate = () => {
    if (!song.set_songs || song.set_songs.length === 0) return null;
    const dates = song.set_songs
      .map((ss: any) => ss.service_sets?.date)
      .filter(Boolean)
      .sort()
      .reverse();
    return dates[0] ? new Date(dates[0]) : null;
  };

  const lastUsed = getLastUsedDate();
  const usageCount = song.set_songs?.length || 0;
  const locale = language === "ko" ? ko : enUS;

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
    <Card className="shadow-md hover:shadow-lg transition-all animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1 truncate">{song.title}</h3>
            {song.artist && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{song.artist}</p>
            )}
          </div>
          <Music2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
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

          {song.bpm && (
            <p className="text-xs text-muted-foreground truncate">{t("songCard.bpm")}: {song.bpm}</p>
          )}

          {lastUsed && (
            <p className="text-xs text-muted-foreground truncate">
              {t("songCard.lastUsed")}: {format(lastUsed, language === "ko" ? "yyyy년 M월 d일" : "MMM d, yyyy", { locale })} ({usageCount})
            </p>
          )}

          {!lastUsed && usageCount === 0 && (
            <p className="text-xs text-muted-foreground">{t("songCard.neverUsed")}</p>
          )}
        </div>

        <div className="flex gap-2">
          {song.youtube_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(song.youtube_url, "_blank")}
              className="flex-1"
            >
              <Youtube className="w-4 h-4 mr-1" />
              {t("songCard.viewYouTube")}
            </Button>
          )}
          {song.score_file_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(song.score_file_url, "_blank")}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-1" />
              {t("songCard.viewScore")}
            </Button>
          )}
        </div>

        {(onEdit || onDelete) && (
          <div className="flex gap-2 mt-4">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(song)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                {t("common.edit")}
              </Button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
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
        )}
      </CardContent>
    </Card>
  );
};
