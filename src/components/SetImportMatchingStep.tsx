import { useState } from "react";
import { ParsedWorshipSet } from "@/lib/csvSetParser";
import { MatchResult, MatchType, Song } from "@/lib/songMatcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/useTranslation";
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

interface SetImportMatchingStepProps {
  parsedSets: ParsedWorshipSet[];
  matchResults: Map<string, MatchResult>;
  songLibrary: Song[];
  onUpdateMatch: (originalText: string, matchResult: MatchResult) => void;
}

export const SetImportMatchingStep = ({
  parsedSets,
  matchResults,
  songLibrary,
  onUpdateMatch,
}: SetImportMatchingStepProps) => {
  const { t } = useTranslation();

  const getMatchIcon = (matchType: MatchType) => {
    switch (matchType) {
      case MatchType.EXACT:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case MatchType.FUZZY_HIGH:
        return <CheckCircle className="w-4 h-4 text-yellow-600" />;
      case MatchType.FUZZY_MID:
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case MatchType.MULTIPLE:
        return <HelpCircle className="w-4 h-4 text-blue-600" />;
      case MatchType.NOT_FOUND:
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getMatchBadge = (matchType: MatchType, confidence: number) => {
    const variants: Record<MatchType, any> = {
      [MatchType.EXACT]: "default",
      [MatchType.FUZZY_HIGH]: "secondary",
      [MatchType.FUZZY_MID]: "outline",
      [MatchType.MULTIPLE]: "outline",
      [MatchType.NOT_FOUND]: "destructive",
    };

    return (
      <Badge variant={variants[matchType]} className="gap-1">
        {getMatchIcon(matchType)}
        <span>{t(`setImport.${matchType}`)}</span>
        {confidence > 0 && <span className="ml-1">({confidence}%)</span>}
      </Badge>
    );
  };

  const totalSongs = parsedSets.reduce((sum, set) => sum + set.parsedSongs.length, 0);
  const exactMatches = Array.from(matchResults.values()).filter(
    (r) => r.matchType === MatchType.EXACT
  ).length;
  const fuzzyHighMatches = Array.from(matchResults.values()).filter(
    (r) => r.matchType === MatchType.FUZZY_HIGH
  ).length;
  const needsReview = Array.from(matchResults.values()).filter(
    (r) => r.matchType === MatchType.FUZZY_MID || r.matchType === MatchType.MULTIPLE
  ).length;
  const notFound = Array.from(matchResults.values()).filter(
    (r) => r.matchType === MatchType.NOT_FOUND
  ).length;

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h3 className="font-semibold">{t("setImport.matchingSummary")}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{t("setImport.totalSets")}</p>
            <p className="text-2xl font-bold">{parsedSets.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("setImport.totalSongs")}</p>
            <p className="text-2xl font-bold">{totalSongs}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("setImport.autoMatched")}</p>
            <p className="text-2xl font-bold text-green-600">
              {exactMatches + fuzzyHighMatches}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("setImport.needsReview")}</p>
            <p className="text-2xl font-bold text-orange-600">{needsReview}</p>
          </div>
        </div>
        {notFound > 0 && (
          <p className="text-sm text-destructive">
            ⚠️ {notFound} {t("setImport.songsNotMatched")}
          </p>
        )}
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {parsedSets.map((set, setIndex) => (
          <div key={setIndex} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{set.title}</h4>
                <p className="text-sm text-muted-foreground">{set.date}</p>
              </div>
            </div>

            <div className="space-y-2">
              {set.parsedSongs.map((song, songIndex) => {
                const matchResult = matchResults.get(song.originalText);
                if (!matchResult) return null;

                return (
                  <div
                    key={songIndex}
                    className="flex items-start gap-3 p-2 bg-muted/30 rounded"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{song.title}</span>
                        {song.key && (
                          <Badge variant="outline" className="text-xs">
                            {song.key}
                          </Badge>
                        )}
                      </div>
                      {getMatchBadge(matchResult.matchType, matchResult.confidence)}

                      {matchResult.matchedSong && (
                        <p className="text-xs text-muted-foreground">
                          → {matchResult.matchedSong.title}
                          {matchResult.matchedSong.artist && ` - ${matchResult.matchedSong.artist}`}
                        </p>
                      )}

                      {(matchResult.matchType === MatchType.MULTIPLE ||
                        matchResult.matchType === MatchType.NOT_FOUND) && (
                        <div className="flex items-center gap-2 mt-2">
                          <Select
                            onValueChange={(value) => {
                              if (value === "skip") {
                                onUpdateMatch(song.originalText, {
                                  ...matchResult,
                                  matchType: MatchType.NOT_FOUND,
                                  matchedSong: undefined,
                                });
                              } else {
                                const selectedSong = songLibrary.find((s) => s.id === value);
                                if (selectedSong) {
                                  onUpdateMatch(song.originalText, {
                                    ...matchResult,
                                    matchType: MatchType.EXACT,
                                    confidence: 100,
                                    matchedSong: selectedSong,
                                  });
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="w-[250px] h-8 text-xs">
                              <SelectValue placeholder={t("setImport.selectFromLibrary")} />
                            </SelectTrigger>
                            <SelectContent>
                              {matchResult.candidates?.map((candidate) => (
                                <SelectItem key={candidate.id} value={candidate.id}>
                                  {candidate.title}
                                  {candidate.artist && ` - ${candidate.artist}`}
                                </SelectItem>
                              )) || 
                                songLibrary.slice(0, 10).map((song) => (
                                  <SelectItem key={song.id} value={song.id}>
                                    {song.title}
                                    {song.artist && ` - ${song.artist}`}
                                  </SelectItem>
                                ))}
                              <SelectItem value="skip">{t("setImport.skipSong")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
