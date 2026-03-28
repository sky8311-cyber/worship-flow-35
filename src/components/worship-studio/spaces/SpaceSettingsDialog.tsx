import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUpdateSpace } from "@/hooks/useStudioSpaces";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { StudioSpace } from "@/hooks/useStudioSpaces";

const ICONS = ["🎵", "🎹", "🎸", "📖", "🙏", "✝️", "🕊️", "💡", "📝", "🎤"];
const COLORS = [
  "#b8902a", "#cc3333", "#3a6b8a", "#5a7a5a", "#7c6a9e",
  "#e8c840", "#4a7c6a", "#8b5e52", "#6b6b6b", "#4a4a4a",
];

interface SpaceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space: StudioSpace;
  isFirstSpace: boolean;
}

export function SpaceSettingsDialog({ open, onOpenChange, space, isFirstSpace }: SpaceSettingsDialogProps) {
  const { language } = useTranslation();
  const updateSpace = useUpdateSpace();
  const t = (ko: string, en: string) => (language === "ko" ? ko : en);

  const [name, setName] = useState(space.name);
  const [icon, setIcon] = useState(space.icon);
  const [color, setColor] = useState(space.color);
  const [visibility, setVisibility] = useState(space.visibility);
  const [guestbookEnabled, setGuestbookEnabled] = useState(space.guestbook_enabled);
  const [guestbookPermission, setGuestbookPermission] = useState(space.guestbook_permission);

  const handleSave = () => {
    updateSpace.mutate({
      id: space.id,
      name: name.trim() || space.name,
      icon,
      color,
      visibility: isFirstSpace ? "public" : visibility,
      guestbook_enabled: guestbookEnabled,
      guestbook_permission: guestbookPermission,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("공간 설정", "Space Settings")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("이름", "Name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="text-sm" />
          </div>

          {/* Icon */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("아이콘", "Icon")}</Label>
            <div className="flex gap-1.5 flex-wrap">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`h-8 w-8 rounded-md flex items-center justify-center text-lg border-2 transition-colors ${icon === ic ? "border-[#b8902a] bg-[#b8902a]/10" : "border-transparent hover:bg-muted/50"}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("색깔", "Color")}</Label>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("공개 설정", "Visibility")}</Label>
            {isFirstSpace ? (
              <p className="text-xs text-muted-foreground">{t("첫 번째 공간은 항상 공개입니다", "First space is always public")}</p>
            ) : (
              <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as any)} className="flex gap-3">
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="public" id="vis-public" />
                  <Label htmlFor="vis-public" className="text-xs">{t("전체공개", "Public")}</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="friends" id="vis-friends" />
                  <Label htmlFor="vis-friends" className="text-xs">{t("친구만", "Friends")}</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="private" id="vis-private" />
                  <Label htmlFor="vis-private" className="text-xs">{t("비공개", "Private")}</Label>
                </div>
              </RadioGroup>
            )}
          </div>

          {/* Guestbook */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t("방명록 활성화", "Enable Guestbook")}</Label>
              <Switch checked={guestbookEnabled} onCheckedChange={setGuestbookEnabled} />
            </div>
            {guestbookEnabled && (
              <RadioGroup value={guestbookPermission} onValueChange={(v) => setGuestbookPermission(v as any)} className="flex gap-3 pl-1">
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="all" id="gb-all" />
                  <Label htmlFor="gb-all" className="text-xs">{t("전체", "Everyone")}</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="friends" id="gb-friends" />
                  <Label htmlFor="gb-friends" className="text-xs">{t("친구만", "Friends only")}</Label>
                </div>
              </RadioGroup>
            )}
          </div>
        </div>

        <Button onClick={handleSave} className="w-full bg-[#b8902a] hover:bg-[#a07d24] text-white">
          {t("저장", "Save")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
