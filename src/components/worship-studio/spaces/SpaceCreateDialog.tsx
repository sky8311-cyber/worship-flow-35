import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateSpace } from "@/hooks/useStudioSpaces";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

const ICON_CATEGORIES = [
  { label: { ko: "예배/신앙", en: "Worship" }, icons: ["🙏", "✝️", "📖", "🕊️", "🎵", "🎶", "🌿", "🕯️", "🌸", "💒"] },
  { label: { ko: "일상/감성", en: "Daily" }, icons: ["☕", "🍀", "📷", "✏️", "🎨", "🌙", "⭐", "🌈", "💌", "📝"] },
  { label: { ko: "폴더/시스템", en: "System" }, icons: ["📁", "📂", "🗂️", "📋", "📌", "🔖", "💼", "🗃️", "📦", "🗄️"] },
];

const COLOR_SWATCHES = [
  "#b8902a", "#6366f1", "#ec4899", "#10b981", "#f59e0b",
  "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6", "#64748b",
];

interface SpaceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string | undefined;
  existingCount: number;
  onCreated?: (spaceId: string) => void;
}

export function SpaceCreateDialog({
  open,
  onOpenChange,
  roomId,
  existingCount,
  onCreated,
}: SpaceCreateDialogProps) {
  const { language } = useTranslation();
  const createSpace = useCreateSpace();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📌");
  const [color, setColor] = useState("#b8902a");
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public");

  const isFirstSpace = existingCount === 0;

  const handleSave = async () => {
    if (!roomId) return;
    const result = await createSpace.mutateAsync({
      room_id: roomId,
      name: name.trim() || (language === "ko" ? "새 공간" : "New Space"),
      icon,
      color,
      sort_order: existingCount,
    });
    // Reset
    setName("");
    setIcon("📌");
    setColor("#b8902a");
    setVisibility("public");
    onOpenChange(false);
    onCreated?.(result.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === "ko" ? "새 공간 만들기" : "Create New Space"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>{language === "ko" ? "이름" : "Name"}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "ko" ? "새 공간" : "New Space"}
              maxLength={30}
            />
          </div>

          {/* Icon picker */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "아이콘" : "Icon"}</Label>
            {ICON_CATEGORIES.map((cat) => (
              <div key={cat.label.en}>
                <p className="text-xs text-muted-foreground mb-1">
                  {language === "ko" ? cat.label.ko : cat.label.en}
                </p>
                <div className="flex flex-wrap gap-1">
                  {cat.icons.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md text-lg transition-colors",
                        icon === emoji
                          ? "bg-primary/10 ring-2 ring-primary"
                          : "hover:bg-accent"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Color swatches */}
          <div className="space-y-1.5">
            <Label>{language === "ko" ? "색상" : "Color"}</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-transform",
                    color === c && "ring-2 ring-offset-2 ring-foreground scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-1.5">
            <Label>{language === "ko" ? "공개 설정" : "Visibility"}</Label>
            {isFirstSpace && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 mb-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {language === "ko"
                    ? "첫 번째 공간은 방문자에게 보이는 대문입니다. 전체공개로 고정됩니다."
                    : "The first space is your front door for visitors. It's always public."}
                </span>
              </div>
            )}
            <RadioGroup
              value={isFirstSpace ? "public" : visibility}
              onValueChange={(v) => setVisibility(v as typeof visibility)}
              disabled={isFirstSpace}
              className="flex gap-4"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="public" id="vis-public" />
                <Label htmlFor="vis-public" className="text-sm font-normal cursor-pointer">
                  {language === "ko" ? "전체공개" : "Public"}
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="friends" id="vis-friends" />
                <Label htmlFor="vis-friends" className="text-sm font-normal cursor-pointer">
                  {language === "ko" ? "친구공개" : "Friends"}
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="private" id="vis-private" />
                <Label htmlFor="vis-private" className="text-sm font-normal cursor-pointer">
                  {language === "ko" ? "비공개" : "Private"}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "ko" ? "취소" : "Cancel"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={createSpace.isPending}
            className="bg-[hsl(40,65%,44%)] hover:bg-[hsl(40,65%,38%)] text-white"
          >
            {createSpace.isPending
              ? (language === "ko" ? "생성 중…" : "Creating…")
              : (language === "ko" ? "만들기" : "Create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
