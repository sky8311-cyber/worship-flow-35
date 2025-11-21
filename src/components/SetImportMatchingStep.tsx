import { useState } from "react";
import { ParsedWorshipSet } from "@/lib/csvSetParser";
import { MatchResult, MatchType, Song } from "@/lib/songMatcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useTranslation } from "@/hooks/useTranslation";
import { CheckCircle, AlertTriangle, XCircle, HelpCircle, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [openComboboxes, setOpenComboboxes] = useState<Record<string, boolean>>({});

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
                          <Popover
                            open={openComboboxes[song.originalText] || false}
                            onOpenChange={(open) => {
                              setOpenComboboxes(prev => ({ ...prev, [song.originalText]: open }));
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-[300px] justify-between text-xs h-8"
                              >
                                {matchResult.matchedSong
                                  ? `${matchResult.matchedSong.title}${matchResult.matchedSong.artist ? ` - ${matchResult.matchedSong.artist}` : ''}`
                                  : t("setImport.selectFromLibrary")
                                }
                                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command>
                                <CommandInput
                                  placeholder={t("setImport.searchSongs")}
                                  className="h-8"
                                />
                                <CommandList>
                                  <CommandEmpty>{t("setImport.noSongsFound")}</CommandEmpty>
                                  <CommandGroup>
                                    {matchResult.candidates?.map((candidate) => (
                                      <CommandItem
                                        key={candidate.id}
                                        value={`${candidate.title} ${candidate.artist || ''}`}
                                        onSelect={() => {
                                          onUpdateMatch(song.originalText, {
                                            ...matchResult,
                                            matchType: MatchType.EXACT,
                                            confidence: 100,
                                            matchedSong: candidate,
                                          });
                                          setOpenComboboxes(prev => ({ ...prev, [song.originalText]: false }));
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            matchResult.matchedSong?.id === candidate.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-medium">{candidate.title}</span>
                                          {candidate.artist && (
                                            <span className="text-xs text-muted-foreground">{candidate.artist}</span>
                                          )}
                                        </div>
                                      </CommandItem>
                                    ))}

                                    {songLibrary
                                      .filter(s => !matchResult.candidates?.some(c => c.id === s.id))
                                      .map((libSong) => (
                                        <CommandItem
                                          key={libSong.id}
                                          value={`${libSong.title} ${libSong.artist || ''}`}
                                          onSelect={() => {
                                            onUpdateMatch(song.originalText, {
                                              ...matchResult,
                                              matchType: MatchType.EXACT,
                                              confidence: 100,
                                              matchedSong: libSong,
                                            });
                                            setOpenComboboxes(prev => ({ ...prev, [song.originalText]: false }));
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              matchResult.matchedSong?.id === libSong.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span className="font-medium">{libSong.title}</span>
                                            {libSong.artist && (
                                              <span className="text-xs text-muted-foreground">{libSong.artist}</span>
                                            )}
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>

                                  <CommandGroup>
                                    <CommandItem
                                      value="skip-song-option"
                                      onSelect={() => {
                                        onUpdateMatch(song.originalText, {
                                          ...matchResult,
                                          matchType: MatchType.NOT_FOUND,
                                          matchedSong: undefined,
                                        });
                                        setOpenComboboxes(prev => ({ ...prev, [song.originalText]: false }));
                                      }}
                                    >
                                      <XCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                                      <span className="text-muted-foreground">{t("setImport.skipSong")}</span>
                                    </CommandItem>
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
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
