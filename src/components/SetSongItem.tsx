import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GripVertical, X, Youtube, FileText, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface SetSongItemProps {
  setSong: any;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: any) => void;
}

export const SetSongItem = ({ setSong, index, onRemove, onUpdate }: SetSongItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: index });
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const { t } = useTranslation();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const song = setSong.song || setSong.songs;

  const handleCopyLyrics = () => {
    if (setSong.lyrics) {
      navigator.clipboard.writeText(setSong.lyrics);
      toast.success(t("setSongItem.lyricsCopied"));
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex flex-col items-center justify-start pt-1">
              <button {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
                <GripVertical className="w-5 h-5" />
              </button>
              <div className="text-2xl font-bold text-primary mt-2">
                {index + 1}
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-semibold text-foreground">{song?.title}</h4>
                {song?.artist && (
                  <p className="text-sm text-muted-foreground">{song.artist}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">키</label>
                  <Input
                    value={setSong.key || ""}
                    onChange={(e) => onUpdate(index, { key: e.target.value })}
                    placeholder={song?.default_key || "키 입력"}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">BPM</label>
                  <Input
                    type="number"
                    value={setSong.bpm || ""}
                    onChange={(e) => onUpdate(index, { bpm: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="BPM"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">박자</label>
                  <Input
                    value={setSong.time_signature || ""}
                    onChange={(e) => onUpdate(index, { time_signature: e.target.value })}
                    placeholder="4/4"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">에너지 레벨</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={setSong.energy_level || ""}
                    onChange={(e) => onUpdate(index, { energy_level: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="1-5"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">진행설명</label>
                <Textarea
                  value={setSong.custom_notes || ""}
                  onChange={(e) => onUpdate(index, { custom_notes: e.target.value })}
                  placeholder="예: 후렴 2번 반복, 브리지 생략"
                  rows={2}
                  className="mt-1"
                />
              </div>

              {/* Lyrics Section */}
              <Collapsible open={lyricsOpen} onOpenChange={setLyricsOpen}>
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                      <label className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                        {t("setSongItem.lyrics")}
                        {lyricsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </label>
                    </Button>
                  </CollapsibleTrigger>
                  {setSong.lyrics && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLyrics}
                      className="h-6 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      {t("setSongItem.copyLyrics")}
                    </Button>
                  )}
                </div>
                <CollapsibleContent>
                  <Textarea
                    value={setSong.lyrics || ""}
                    onChange={(e) => onUpdate(index, { lyrics: e.target.value })}
                    placeholder={t("setSongItem.lyricsPlaceholder")}
                    rows={6}
                    className="mt-1 font-mono text-sm"
                  />
                </CollapsibleContent>
              </Collapsible>

              <div className="flex gap-2">
                {song?.youtube_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(song.youtube_url, "_blank")}
                  >
                    <Youtube className="w-4 h-4 mr-1" />
                    유튜브
                  </Button>
                )}
                {song?.score_file_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(song.score_file_url, "_blank")}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    악보
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
