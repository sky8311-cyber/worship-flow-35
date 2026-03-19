import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, RefreshCw, Check, ArrowRight, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { useTierFeature } from "@/hooks/useTierFeature";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CurationProfileChat } from "@/components/CurationProfileChat";

interface AISetBuilderPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId?: string;
  onAddSongs: (songs: Array<{ song: any; key: string }>) => void;
  initialTheme?: string;
  initialDuration?: number;
}

interface GeneratedSong {
  song_id: string;
  song_title: string;
  artist: string;
  key: string;
  order_position: number;
  role: string;
  tempo: string;
  transition_note: string;
  rationale: string;
}

const MUSICAL_KEYS = [
  "A", "A#/Bb", "B", "C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab",
  "Am", "A#m/Bbm", "Bm", "Cm", "C#m/Dbm", "Dm", "D#m/Ebm", "Em", "Fm", "F#m/Gbm", "Gm", "G#m/Abm",
];

const ROLE_COLORS: Record<string, string> = {
  '마음열기': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  '선포': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  '고백': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  '경배': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
};

const TEMPO_COLORS: Record<string, string> = {
  '느림': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  '보통': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  '빠름': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

type PanelView = "onboarding" | "form" | "result";

export function AISetBuilderPanel({ open, onOpenChange, communityId, onAddSongs, initialTheme, initialDuration }: AISetBuilderPanelProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const { hasFeature } = useTierFeature();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState("");
  const [songCount, setSongCount] = useState(5);
  const [preferredKey, setPreferredKey] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [tone, setTone] = useState("mixed");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedSong[] | null>(null);
  const [songMap, setSongMap] = useState<Record<string, any>>({});
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Fetch curation profile
  const { data: curationProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["curation-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase
        .from("user_curation_profiles" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle() as any);
      if (error) throw error;
      return data as { user_id: string; skills_summary: string | null; congregation_notes: string | null; updated_at: string } | null;
    },
    enabled: !!user && open,
  });

  const hasProfile = !!curationProfile?.skills_summary;
  const hasAiAccess = hasFeature("ai_set_builder");

  // Determine current view
  const getCurrentView = (): PanelView => {
    if (showEditProfile) return "onboarding";
    if (result) return "result";
    if (hasAiAccess && !hasProfile && !profileLoading) return "onboarding";
    return "form";
  };

  const currentView = getCurrentView();

  useEffect(() => {
    if (open) {
      if (initialTheme) setTheme(initialTheme);
      if (initialDuration) setDurationMinutes(initialDuration);
      setShowEditProfile(false);
    }
  }, [open, initialTheme, initialDuration]);

  const handleProfileComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["curation-profile", user?.id] });
    setShowEditProfile(false);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      await supabase.auth.refreshSession();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        toast.error(language === "ko" ? "로그인이 필요합니다." : "Please log in first.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-worship-set`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            theme,
            songCount: songCount || 5,
            preferredKey: preferredKey || undefined,
            durationMinutes: durationMinutes || 30,
            tone,
            communityId: communityId || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "AI 요청에 실패했습니다.");
      }

      const data = await response.json();
      const worshipSet = data.worshipSet as GeneratedSong[];

      if (!worshipSet || worshipSet.length === 0) {
        throw new Error("AI가 적합한 곡을 찾지 못했습니다.");
      }

      const songIds = worshipSet.map((s) => s.song_id);
      const { data: fullSongs } = await supabase
        .from("songs")
        .select("*")
        .in("id", songIds);

      const map: Record<string, any> = {};
      fullSongs?.forEach((s) => { map[s.id] = s; });
      setSongMap(map);
      setResult(worshipSet.sort((a, b) => a.order_position - b.order_position));
    } catch (error: any) {
      console.error("AI set generation error:", error);
      toast.error(error.message || (language === "ko" ? "AI 세트 생성에 실패했습니다." : "Failed to generate AI set."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseSet = () => {
    if (!result) return;

    const songsToAdd = result
      .filter((item) => songMap[item.song_id])
      .map((item) => ({
        song: songMap[item.song_id],
        key: item.key,
      }));

    if (songsToAdd.length === 0) {
      toast.error(language === "ko" ? "추가할 곡이 없습니다." : "No songs to add.");
      return;
    }

    onAddSongs(songsToAdd);
    toast.success(
      language === "ko"
        ? `${songsToAdd.length}곡이 세트에 추가되었습니다.`
        : `${songsToAdd.length} songs added to the set.`
    );
    onOpenChange(false);
    setResult(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {currentView === "onboarding"
              ? (showEditProfile ? "예배 프로필 수정" : "내 예배 프로필")
              : "AI 세트 만들기"}
          </SheetTitle>
          <SheetDescription>
            {currentView === "onboarding"
              ? "AI가 더 정확한 선곡을 위해 몇 가지를 물어봅니다."
              : language === "ko"
                ? "AI가 예배 흐름에 맞는 세트를 추천합니다."
                : "AI recommends a worship set based on your preferences."}
          </SheetDescription>
        </SheetHeader>

        {currentView === "onboarding" ? (
          <div className="flex-1 min-h-0">
            <CurationProfileChat
              existingSummary={showEditProfile ? curationProfile?.skills_summary : undefined}
              onComplete={handleProfileComplete}
            />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              {currentView === "form" ? (
                <div className="space-y-4 py-4">
                  {/* Profile indicator */}
                  {hasProfile && (
                    <button
                      onClick={() => setShowEditProfile(true)}
                      className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                    >
                      <UserCircle className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">내 예배 프로필</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {curationProfile?.skills_summary?.slice(0, 60)}...
                        </p>
                      </div>
                      <span className="text-xs text-primary shrink-0">수정</span>
                    </button>
                  )}

                  <div className="space-y-2">
                    <Label>{language === "ko" ? "설교 본문/주제" : "Sermon Theme / Scripture"}</Label>
                    <Input
                      placeholder={language === "ko" ? "예: 은혜, 요한복음 3:16" : "e.g., Grace, John 3:16"}
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "ko" ? "곡 수" : "Number of Songs"}</Label>
                    <Input
                      type="number"
                      min={3}
                      max={12}
                      value={songCount || ""}
                      onChange={(e) => setSongCount(parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "ko" ? "선호 키" : "Preferred Key"}</Label>
                    <Select value={preferredKey} onValueChange={setPreferredKey}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "ko" ? "키 선택 (선택사항)" : "Select key (optional)"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{language === "ko" ? "상관없음" : "Any"}</SelectItem>
                        {MUSICAL_KEYS.map((k) => (
                          <SelectItem key={k} value={k}>{k}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "ko" ? "예배 시간 (분)" : "Service Duration (min)"}</Label>
                    <Input
                      type="number"
                      min={10}
                      max={120}
                      value={durationMinutes || ""}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "ko" ? "분위기" : "Tone"}</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high_energy">{language === "ko" ? "에너지 높은" : "High Energy"}</SelectItem>
                        <SelectItem value="reflective">{language === "ko" ? "묵상적" : "Reflective"}</SelectItem>
                        <SelectItem value="mixed">{language === "ko" ? "혼합" : "Mixed"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {language === "ko" ? "AI가 세트를 구성하고 있습니다..." : "AI is building your set..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {language === "ko" ? "AI 세트 생성" : "Generate AI Set"}
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 py-4">
                  {result?.map((item, idx) => {
                    const song = songMap[item.song_id];
                    return (
                      <div key={item.song_id} className="border rounded-lg p-3 space-y-2">
                        {item.transition_note && idx > 0 && (
                          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2 -mt-1 mb-2">
                            <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>{item.transition_note}</span>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
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
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
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
                        </div>

                        {item.rationale && (
                          <p className="text-xs text-muted-foreground italic pl-10">
                            {item.rationale}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {result && (
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleGenerate} disabled={isLoading} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {language === "ko" ? "다시 생성" : "Regenerate"}
                </Button>
                <Button onClick={handleUseSet} className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  {language === "ko" ? "이 세트 사용" : "Use this set"}
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
