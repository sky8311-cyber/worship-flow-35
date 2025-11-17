import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Music } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { SongDialog } from "./SongDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";

interface SongSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (song: any) => void;
}

export const SongSelector = ({ open, onClose, onSelect }: SongSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showSongDialog, setShowSongDialog] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: songs, isLoading } = useQuery({
    queryKey: ["songs-selector", searchQuery, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("songs")
        .select(`
          *,
          set_songs(
            service_set_id,
            service_sets(date)
          )
        `)
        .order("title");

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,tags.ilike.%${searchQuery}%`);
      }

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const getLastUsedDate = (song: any) => {
    if (!song.set_songs || song.set_songs.length === 0) return null;
    const dates = song.set_songs
      .map((ss: any) => ss.service_sets?.date)
      .filter(Boolean)
      .sort()
      .reverse();
    return dates[0] ? new Date(dates[0]) : null;
  };

  const handleSongDialogClose = () => {
    setShowSongDialog(false);
    queryClient.invalidateQueries({ queryKey: ["songs-selector"] });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle>{t("songSelector.title")}</DialogTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowSongDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t("songSelector.addNewSong")}
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="곡 제목 또는 태그로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 카테고리</SelectItem>
              <SelectItem value="오프닝">오프닝</SelectItem>
              <SelectItem value="찬양">찬양</SelectItem>
              <SelectItem value="헌금">헌금</SelectItem>
              <SelectItem value="응답">응답</SelectItem>
              <SelectItem value="파송">파송</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : songs && songs.length > 0 ? (
            songs.map((song) => {
              const lastUsed = getLastUsedDate(song);
              const usageCount = song.set_songs?.length || 0;

              return (
                <div
                  key={song.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer flex items-start justify-between gap-4"
                  onClick={() => onSelect(song)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Music className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">{song.title}</h4>
                    </div>
                    {song.artist && (
                      <p className="text-sm text-muted-foreground mb-2">{song.artist}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {song.default_key && (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          {song.default_key}
                        </span>
                      )}
                      {song.category && (
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                          {song.category}
                        </span>
                      )}
                    </div>
                    {lastUsed && (
                      <p className="text-xs text-muted-foreground mt-2">
                        마지막 사용: {format(lastUsed, "yyyy년 M월 d일", { locale: ko })} ({usageCount}회)
                      </p>
                    )}
                    {!lastUsed && usageCount === 0 && (
                      <p className="text-xs text-amber-600 mt-2">
                        오랜만 (사용 이력 없음)
                      </p>
                    )}
                  </div>
                  <Button size="sm" onClick={() => onSelect(song)}>
                    <Plus className="w-4 h-4 mr-1" />
                    추가
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      </DialogContent>

      <SongDialog 
        open={showSongDialog}
        onOpenChange={setShowSongDialog}
        song={undefined}
        onClose={handleSongDialogClose}
      />
    </Dialog>
  );
};
