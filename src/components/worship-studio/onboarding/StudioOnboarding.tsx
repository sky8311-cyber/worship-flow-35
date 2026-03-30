import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateStudio } from "@/hooks/useCreateStudio";
import { useCreateSpace } from "@/hooks/useStudioSpaces";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StudioBGMSelector } from "../StudioBGMSelector";
import { BookOpen, Music, Heart, Mic, StickyNote, Calendar, PenLine, Users, ArrowRight, Check, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { BlockType } from "@/hooks/useStudioPosts";

const ICON_CATEGORIES = [
  { label: { ko: "예배/신앙", en: "Worship" }, icons: ["🙏", "✝️", "📖", "🕊️", "🎵", "🎶", "🌿", "🕯️", "🌸", "💒"] },
  { label: { ko: "일상/감성", en: "Daily" }, icons: ["☕", "🍀", "📷", "✏️", "🎨", "🌙", "⭐", "🌈", "💌", "📝"] },
  { label: { ko: "폴더/시스템", en: "System" }, icons: ["📁", "📂", "🗂️", "📋", "📌", "🔖", "💼", "🗃️", "📦", "🗄️"] },
];

const COLOR_SWATCHES = [
  "#b8902a", "#6366f1", "#ec4899", "#10b981", "#f59e0b",
  "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6", "#64748b",
];

const BLOCK_OPTIONS: { value: BlockType; icon: React.ReactNode; label: string; labelEn: string; color: string }[] = [
  { value: "song", icon: <Music className="h-5 w-5" />, label: "♩ 곡", labelEn: "♩ Song", color: "#7c6a9e" },
  { value: "worship_set", icon: <Calendar className="h-5 w-5" />, label: "✦ 워십셋", labelEn: "✦ Set", color: "#b8902a" },
  { value: "scripture", icon: <BookOpen className="h-5 w-5" />, label: "📖 말씀", labelEn: "📖 Scripture", color: "#4a7c6a" },
  { value: "prayer_note", icon: <Heart className="h-5 w-5" />, label: "✦ 기도노트", labelEn: "✦ Prayer", color: "#8b5e52" },
  { value: "audio", icon: <Mic className="h-5 w-5" />, label: "◉ 오디오", labelEn: "◉ Audio", color: "#3a6b8a" },
  { value: "note", icon: <StickyNote className="h-5 w-5" />, label: "▪ 노트", labelEn: "▪ Note", color: "#6b6560" },
];

interface StudioOnboardingProps {
  onComplete: () => void;
}

type VisibilityOption = "private" | "friends" | "public";

export function StudioOnboarding({ onComplete }: StudioOnboardingProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const createStudio = useCreateStudio();
  const createSpace = useCreateSpace();
  const queryClient = useQueryClient();
  const t = (ko: string, en: string) => language === "ko" ? ko : en;

  const [step, setStep] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);

  // Step 1 state
  const [studioName, setStudioName] = useState("");

  // Step 2 state
  const [bgmSongId, setBgmSongId] = useState<string | null>(null);
  const [guestbookEnabled, setGuestbookEnabled] = useState(true);
  const [visibility, setVisibility] = useState<VisibilityOption>("friends");

  // Step 3 state
  const [spaceName, setSpaceName] = useState("");
  const [spaceIcon, setSpaceIcon] = useState("🙏");
  const [spaceColor, setSpaceColor] = useState("#b8902a");

  // Step 4 state
  const [selectedBlock, setSelectedBlock] = useState<BlockType | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleCreateStudio = () => {
    const name = studioName.trim() || undefined;
    createStudio.mutate({ studioName: name }, {
      onSuccess: (data) => {
        setRoomId(data.id);
        setStep(1);
      },
    });
  };

  const handleStep2Next = async () => {
    if (!roomId) return;
    setIsSubmitting(true);
    try {
      const updates: Record<string, unknown> = { visibility };
      if (bgmSongId) updates.bgm_song_id = bgmSongId;
      updates.guestbook_enabled = guestbookEnabled;

      await supabase.from("worship_rooms").update(updates).eq("id", roomId);
      setStep(2);
    } catch {
      toast.error(t("설정 저장 실패", "Failed to save settings"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep3Add = async () => {
    if (!roomId) return;
    setIsSubmitting(true);
    try {
      await createSpace.mutateAsync({
        room_id: roomId,
        name: spaceName.trim() || t("기본 공간", "Default Space"),
        icon: spaceIcon,
        color: spaceColor,
        sort_order: 0,
      });
      setStep(3);
    } catch {
      toast.error(t("공간 추가 실패", "Failed to add space"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep4Create = async () => {
    if (!roomId || !selectedBlock) return;
    setIsSubmitting(true);
    try {
      // Create a simple block/post
      await supabase.from("room_posts").insert({
        room_id: roomId,
        block_type: selectedBlock,
        title: t("첫 번째 블록", "First Block"),
        status: "draft",
        author_id: user?.id,
      });
      await finishOnboarding();
    } catch {
      toast.error(t("블록 추가 실패", "Failed to add block"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishOnboarding = async () => {
    if (!roomId) return;
    try {
      await supabase.from("worship_rooms").update({ onboarding_completed: true }).eq("id", roomId);
      queryClient.invalidateQueries({ queryKey: ["worship-room"] });
      toast.success(t("아틀리에가 오픈되었습니다! 🎉", "Your Atelier is now open! 🎉"));
      onComplete();
    } catch {
      toast.error(t("완료 처리 실패", "Failed to complete setup"));
    }
  };

  const handleSkipToFinish = async () => {
    setIsSubmitting(true);
    await finishOnboarding();
    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-lg">
        {/* Progress */}
        <div className="px-6 pt-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{t("단계", "Step")} {step + 1} / {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Step 0: Consent & Name */}
        {step === 0 && (
          <>
            <CardHeader className="pb-3 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold">
                {t("나만의 워십 아틀리에를 열어보세요", "Open your own Worship Atelier")}
              </h2>
              <p className="text-muted-foreground text-sm italic mt-3 leading-relaxed">
                {t(
                  "\"예배는 무대가 아닌, 삶입니다.\n삶이 예배가 될 때, 사역이 빚어집니다.\n이 아틀리에는 그 여정이 기록되고 나눠지는 곳입니다.\"",
                  "\"Worship is not a stage, it is life.\nAs life becomes worship, ministry takes shape.\nThis Atelier is where that journey is written and shared.\""
                )}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { icon: PenLine, text: t("블록 에디터로 글 작성하기", "Write posts with a block editor") },
                  { icon: Music, text: t("찬양곡과 예배셋 삽입하기", "Embed songs and worship sets") },
                  { icon: Users, text: t("친구들과 나눔하기", "Share with friends") },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <f.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm">{f.text}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Label htmlFor="studio-name">{t("아틀리에 이름", "Atelier Name")}</Label>
                <Input
                  id="studio-name"
                  placeholder={t("예: 은혜의 아틀리에", "e.g. Grace Atelier")}
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("비워두면 기본 이름이 사용됩니다", "Leave empty to use the default name")}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleCreateStudio} className="w-full" disabled={createStudio.isPending}>
                {createStudio.isPending
                  ? t("생성 중...", "Creating...")
                  : t("예, 아틀리에를 오픈합니다", "Yes, open my Atelier")}
              </Button>
            </CardFooter>
          </>
        )}

        {/* Step 1: Settings */}
        {step === 1 && (
          <>
            <CardHeader className="pb-3 text-center">
              <h2 className="text-lg font-bold">{t("기본 설정", "Basic Settings")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("아틀리에의 기본 환경을 설정하세요", "Set up your Atelier environment")}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Visibility */}
              <div className="space-y-2">
                <Label>{t("공개 범위", "Visibility")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { val: "private" as VisibilityOption, ko: "비공개", en: "Private" },
                    { val: "friends" as VisibilityOption, ko: "이웃", en: "Neighbors" },
                    { val: "public" as VisibilityOption, ko: "공개", en: "Public" },
                  ]).map((v) => (
                    <button
                      key={v.val}
                      onClick={() => setVisibility(v.val)}
                      className={cn(
                        "px-3 py-2 rounded-lg border text-sm transition-colors",
                        visibility === v.val
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      {t(v.ko, v.en)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guestbook */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("방명록", "Guestbook")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("방문자가 메시지를 남길 수 있습니다", "Visitors can leave messages")}
                  </p>
                </div>
                <Switch checked={guestbookEnabled} onCheckedChange={setGuestbookEnabled} />
              </div>

              {/* BGM */}
              <div className="space-y-2">
                <Label>{t("배경 음악 (BGM)", "Background Music (BGM)")}</Label>
                <StudioBGMSelector selectedSongId={bgmSongId} onSelect={setBgmSongId} />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
                <SkipForward className="h-4 w-4 mr-1" />
                {t("스킵", "Skip")}
              </Button>
              <Button onClick={handleStep2Next} className="flex-1" disabled={isSubmitting}>
                {t("다음", "Next")} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </>
        )}

        {/* Step 2: Add Space */}
        {step === 2 && (
          <>
            <CardHeader className="pb-3 text-center">
              <h2 className="text-lg font-bold">{t("첫 공간 추가", "Add Your First Space")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("공간은 콘텐츠를 분류하는 탭입니다", "Spaces are tabs to organize your content")}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("공간 이름", "Space Name")}</Label>
                <Input
                  placeholder={t("예: 예배 일지", "e.g. Worship Journal")}
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="space-y-2">
                <Label>{t("아이콘", "Icon")}</Label>
                {ICON_CATEGORIES.map((cat) => (
                  <div key={cat.label.en}>
                    <p className="text-xs text-muted-foreground mb-1">{t(cat.label.ko, cat.label.en)}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.icons.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setSpaceIcon(icon)}
                          className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center text-base border transition-colors",
                            spaceIcon === icon ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"
                          )}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>{t("색상", "Color")}</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_SWATCHES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSpaceColor(c)}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-transform",
                        spaceColor === c ? "border-foreground scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(3)} className="flex-1">
                <SkipForward className="h-4 w-4 mr-1" />
                {t("나중에", "Later")}
              </Button>
              <Button onClick={handleStep3Add} className="flex-1" disabled={isSubmitting || !spaceName.trim()}>
                {t("추가", "Add")} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </>
        )}

        {/* Step 3: Add Block */}
        {step === 3 && (
          <>
            <CardHeader className="pb-3 text-center">
              <h2 className="text-lg font-bold">{t("첫 블록 추가", "Add Your First Block")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("어떤 콘텐츠를 만들어볼까요?", "What would you like to create?")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {BLOCK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedBlock(selectedBlock === opt.value ? null : opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                      selectedBlock === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:border-muted-foreground/30 hover:bg-muted/30"
                    )}
                  >
                    <span style={{ color: opt.color }}>{opt.icon}</span>
                    <span className="text-xs font-medium text-foreground/80">
                      {t(opt.label, opt.labelEn)}
                    </span>
                    {selectedBlock === opt.value && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="ghost" onClick={handleSkipToFinish} className="flex-1" disabled={isSubmitting}>
                <SkipForward className="h-4 w-4 mr-1" />
                {t("나중에", "Later")}
              </Button>
              <Button
                onClick={handleStep4Create}
                className="flex-1"
                disabled={isSubmitting || !selectedBlock}
              >
                {isSubmitting ? t("완료 중...", "Finishing...") : t("완료", "Finish")}
                <Check className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
