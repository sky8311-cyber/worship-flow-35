import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { useTierFeature } from "@/hooks/useTierFeature";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CurationProfileChat } from "@/components/CurationProfileChat";

import { AISetBuilderForm } from "@/components/ai-set-builder/AISetBuilderForm";
import { AISetBuilderResult } from "@/components/ai-set-builder/AISetBuilderResult";
import type { GeneratedSong, WorshipArc } from "@/components/ai-set-builder/types";

interface AISetBuilderPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId?: string;
  onAddSongs: (songs: Array<{ song: any; key: string }>, worshipArc?: WorshipArc) => void;
  initialTheme?: string;
  initialDuration?: number;
}

type PanelView = "onboarding" | "form" | "result";

export function AISetBuilderPanel({ open, onOpenChange, communityId, onAddSongs, initialTheme, initialDuration }: AISetBuilderPanelProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const { hasFeature, tier } = useTierFeature();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState("");
  const [songCount, setSongCount] = useState(5);
  const [preferredKey, setPreferredKey] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [tone, setTone] = useState("mixed");
  const [serviceType, setServiceType] = useState("");
  const [tempoPattern, setTempoPattern] = useState("slow-fast-slow-slow");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedSong[] | null>(null);
  const [worshipArc, setWorshipArc] = useState<WorshipArc | null>(null);
  const [songMap, setSongMap] = useState<Record<string, any>>({});
  const [showEditProfile, setShowEditProfile] = useState(false);

  const hasAiAccess = hasFeature("ai_set_builder");
  const canAccessProfile = tier === "worship_leader" || tier === "premium" || tier === "church";

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

  const getCurrentView = (): PanelView => {
    if (showEditProfile) return "onboarding";
    if (result) return "result";
    if (canAccessProfile && !hasProfile && !profileLoading) return "onboarding";
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
    setWorshipArc(null);

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
            serviceType: serviceType || undefined,
            tempoPattern: tempoPattern === "auto" ? undefined : tempoPattern,
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

      // Store worship arc metadata
      if (data.worshipArc) {
        setWorshipArc(data.worshipArc as WorshipArc);
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

    // Warn if some songs were dropped
    const droppedCount = result.length - songsToAdd.length;
    if (droppedCount > 0) {
      toast.warning(
        language === "ko"
          ? `${droppedCount}곡이 데이터베이스에서 찾을 수 없어 제외되었습니다.`
          : `${droppedCount} song(s) were not found in the database and excluded.`
      );
    }

    onAddSongs(songsToAdd, worshipArc || undefined);
    toast.success(
      language === "ko"
        ? `${songsToAdd.length}곡이 세트에 추가되었습니다.`
        : `${songsToAdd.length} songs added to the set.`
    );
    onOpenChange(false);
    setResult(null);
    setWorshipArc(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full min-w-0 flex-col sm:max-w-md">
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
            <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
              <div className="w-full min-w-0 pr-1">
                {currentView === "form" ? (
                  <AISetBuilderForm
                    theme={theme} setTheme={setTheme}
                    songCount={songCount} setSongCount={setSongCount}
                    preferredKey={preferredKey} setPreferredKey={setPreferredKey}
                    durationMinutes={durationMinutes} setDurationMinutes={setDurationMinutes}
                    tone={tone} setTone={setTone}
                    serviceType={serviceType} setServiceType={setServiceType}
                    tempoPattern={tempoPattern} setTempoPattern={setTempoPattern}
                    isLoading={isLoading}
                    onGenerate={handleGenerate}
                    hasAiAccess={hasAiAccess}
                    hasProfile={hasProfile}
                    curationProfile={curationProfile}
                    onEditProfile={() => setShowEditProfile(true)}
                    language={language}
                  />
                ) : (
                  <AISetBuilderResult
                    result={result!}
                    songMap={songMap}
                    worshipArc={worshipArc}
                  />
                )}
              </div>
            </div>

            {result && (
              <div className="flex w-full min-w-0 gap-2 border-t pt-4">
                <Button variant="outline" onClick={handleGenerate} disabled={isLoading} className="min-w-0 flex-1">
                  <RefreshCw className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{language === "ko" ? "다시 생성" : "Regenerate"}</span>
                </Button>
                <Button onClick={handleUseSet} className="min-w-0 flex-1">
                  <Check className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{language === "ko" ? "이 세트 사용" : "Use this set"}</span>
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
