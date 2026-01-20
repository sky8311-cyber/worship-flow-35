import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface RoomStatusBubbleProps {
  emoji: string | null;
  text: string | null;
  isOwnRoom: boolean;
  onSave?: (emoji: string, text: string) => void;
}

const STATUS_EMOJIS = [
  "😊", "😢", "😍", "🙏", "💭", "✨", "❤️", "🎵",
  "☀️", "🌙", "🔥", "💪", "😴", "🥰", "😌", "🎉"
];

export function RoomStatusBubble({ emoji, text, isOwnRoom, onSave }: RoomStatusBubbleProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(emoji || "😊");
  const [statusText, setStatusText] = useState(text || "");

  const handleSave = () => {
    onSave?.(selectedEmoji, statusText);
    setIsOpen(false);
  };

  // If no status and not own room, don't show anything
  if (!emoji && !text && !isOwnRoom) {
    return null;
  }

  return (
    <div className="absolute top-3 right-3 z-20">
      {isOwnRoom ? (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full",
                "bg-gradient-to-r from-primary/10 to-secondary/10",
                "border border-primary/20 shadow-md backdrop-blur-sm",
                "hover:scale-105 transition-transform cursor-pointer",
                "text-sm font-medium"
              )}
            >
              <span className="text-lg">{emoji || "💭"}</span>
              <span className="text-foreground/80 max-w-[120px] truncate">
                {text || t("rooms.setStatus")}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-3">
              <p className="text-sm font-medium text-center">
                {t("rooms.todayIs")}
              </p>
              
              {/* Emoji picker */}
              <div className="grid grid-cols-8 gap-1">
                {STATUS_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setSelectedEmoji(e)}
                    className={cn(
                      "text-xl p-1 rounded hover:bg-muted transition-colors",
                      selectedEmoji === e && "bg-primary/20 ring-2 ring-primary"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
              
              {/* Status text input */}
              <Input
                placeholder={t("rooms.statusPlaceholder")}
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                maxLength={30}
              />
              
              <Button onClick={handleSave} className="w-full" size="sm">
                {t("common.save")}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        // Read-only display for visitors
        emoji && (
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full",
              "bg-gradient-to-r from-primary/10 to-secondary/10",
              "border border-primary/20 shadow-md backdrop-blur-sm",
              "text-sm font-medium"
            )}
          >
            <span className="text-lg">{emoji}</span>
            {text && (
              <span className="text-foreground/80 max-w-[120px] truncate">
                {text}
              </span>
            )}
          </div>
        )
      )}
    </div>
  );
}
