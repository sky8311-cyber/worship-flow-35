import { Badge } from "@/components/ui/badge";
import { ArrowRight, Youtube, FileText } from "lucide-react";
import { WorshipArcCard } from "./WorshipArcCard";
import type { GeneratedSong, WorshipArc } from "./types";
import { ROLE_COLORS, TEMPO_COLORS } from "./types";
import { openYouTubeUrl } from "@/lib/youtubeHelper";

interface AISetBuilderResultProps {
  result: GeneratedSong[];
  songMap: Record<string, any>;
  worshipArc: WorshipArc | null;
}

export function AISetBuilderResult({ result, songMap, worshipArc }: AISetBuilderResultProps) {
  return (
    <div className="w-full min-w-0 max-w-full space-y-3 py-4 pb-6">
      {/* Worship Arc Card */}
      {worshipArc && (
        <WorshipArcCard worshipArc={worshipArc} />
      )}

      {/* Song cards */}
      {result.map((item, idx) => {
        const song = songMap[item.song_id];
        return (
          <div key={item.song_id} className="w-full min-w-0 max-w-full space-y-2 rounded-lg border p-3">
            {item.transition_note && idx > 0 && (
              <div className="-mt-1 mb-2 flex min-w-0 items-start gap-2 rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" />
                <span className="min-w-0 break-words">{item.transition_note}</span>
              </div>
            )}

            <div className="flex min-w-0 items-start gap-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                {item.order_position}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {song?.title || item.song_title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.artist || song?.artist || ""}
                </p>
                <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    Key: {item.key}
                  </Badge>
                  {item.role && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[item.role] || 'bg-muted text-muted-foreground'}`}>
                      {item.role}
                    </span>
                  )}
                  {item.tempo && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TEMPO_COLORS[item.tempo] || 'bg-muted text-muted-foreground'}`}>
                      {item.tempo}
                    </span>
                  )}
                </div>
              </div>
              {/* YouTube & Score preview buttons */}
              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                {song?.youtube_url && (
                  <button
                    type="button"
                    onClick={() => openYouTubeUrl(song.youtube_url)}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
                    title="YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </button>
                )}
                {song?.score_file_url && (
                  <button
                    type="button"
                    onClick={() => window.open(song.score_file_url, "_blank")}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                    title="악보"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {item.rationale && (
              <p className="min-w-0 break-words pl-10 text-xs italic text-muted-foreground">
                {item.rationale}
              </p>
            )}
          </div>
        );
      })}

      {/* Branding */}
      <p className="text-center text-xs text-muted-foreground pt-2">
        Powered by <span className="font-semibold">Worship Arc™</span>
      </p>
    </div>
  );
}
