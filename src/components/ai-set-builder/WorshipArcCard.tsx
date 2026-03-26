import { BookOpen, ArrowRight, Music, MessageSquare } from "lucide-react";
import type { WorshipArc } from "./types";

interface WorshipArcCardProps {
  worshipArc: WorshipArc;
}

export function WorshipArcCard({ worshipArc }: WorshipArcCardProps) {
  // Parse emotional journey into stages (e.g. "나아감 → 선포 → 고백 → 경배")
  const journeyStages = worshipArc.emotionalJourney
    ? worshipArc.emotionalJourney.split(/\s*→\s*|\s*->\s*|\s*>\s*/)
    : [];

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <BookOpen className="w-4 h-4" />
        Worship Arc™ 개요
      </div>

      {/* Theological Proposition */}
      {worshipArc.theologicalProposition && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">신학 명제</p>
          <p className="text-sm font-medium">{worshipArc.theologicalProposition}</p>
        </div>
      )}

      {/* Emotional Journey */}
      {journeyStages.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">감정 여정</p>
          <div className="flex items-center gap-1 flex-wrap">
            {journeyStages.map((stage, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {stage.trim()}
                </span>
                {idx < journeyStages.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tempo Pattern */}
      {worshipArc.tempoPattern && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Music className="w-3 h-3" /> 템포 패턴
          </p>
          <p className="text-sm">{worshipArc.tempoPattern}</p>
        </div>
      )}

      {/* Conductor Note */}
      {worshipArc.conductorNote && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> 인도자 노트
          </p>
          <p className="text-sm italic text-muted-foreground">{worshipArc.conductorNote}</p>
        </div>
      )}
    </div>
  );
}
