import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Music2, Trash2, Youtube, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
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
  onEdit: (song: any) => void;
  onDelete: () => void;
}

export const SongCard = ({ song, onEdit, onDelete }: SongCardProps) => {
  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("songs")
        .delete()
        .eq("id", song.id);

      if (error) throw error;
      toast.success("곡이 삭제되었습니다");
      onDelete();
    } catch (error: any) {
      toast.error("삭제 실패: " + error.message);
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

  return (
    <Card className="shadow-md hover:shadow-lg transition-all animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1">{song.title}</h3>
            {song.artist && (
              <p className="text-sm text-muted-foreground">{song.artist}</p>
            )}
          </div>
          <Music2 className="w-5 h-5 text-primary" />
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
                {song.language}
              </span>
            )}
            {song.category && (
              <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                {song.category}
              </span>
            )}
          </div>

          {song.bpm && (
            <p className="text-xs text-muted-foreground">BPM: {song.bpm}</p>
          )}

          {lastUsed && (
            <p className="text-xs text-muted-foreground">
              마지막 사용: {format(lastUsed, "yyyy년 M월 d일", { locale: ko })} ({usageCount}회)
            </p>
          )}

          {!lastUsed && usageCount === 0 && (
            <p className="text-xs text-muted-foreground">아직 사용되지 않음</p>
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
              유튜브
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
              악보
            </Button>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(song)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            수정
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Trash2 className="w-4 h-4 mr-1" />
                삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>곡 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  "{song.title}" 곡을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
