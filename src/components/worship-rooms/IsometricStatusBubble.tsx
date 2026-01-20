import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { Z_LAYERS } from "./FloorSlots";

interface IsometricStatusBubbleProps {
  emoji: string | null;
  text: string | null;
  isOwnRoom: boolean;
  onSave?: (emoji: string, text: string) => void;
}

const STATUS_EMOJIS = ["😊", "😢", "😍", "😤", "🙏", "💭", "✨", "❤️", "🎵", "📖", "☀️", "🌙"];

/**
 * "TODAY IS..." status bubble positioned at top of room.
 * Room owner can click to edit their status.
 */
export function IsometricStatusBubble({ 
  emoji, 
  text, 
  isOwnRoom, 
  onSave 
}: IsometricStatusBubbleProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(emoji || "😊");
  const [statusText, setStatusText] = useState(text || "");

  const handleSave = () => {
    onSave?.(selectedEmoji, statusText);
    setIsOpen(false);
  };

  // If no status and not own room, don't show
  if (!emoji && !text && !isOwnRoom) {
    return null;
  }

  const bubbleContent = (
    <div 
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 
                 backdrop-blur-sm rounded-full border border-primary/20 shadow-md"
    >
      <span className="text-xs font-medium text-primary/70 uppercase tracking-wide">
        {t("rooms.todayIs")}
      </span>
      <span className="text-xl">{emoji || "😊"}</span>
      {text && (
        <span className="text-sm font-medium text-foreground max-w-32 truncate">
          {text}
        </span>
      )}
      {isOwnRoom && !emoji && !text && (
        <span className="text-xs text-muted-foreground">
          {t("rooms.setStatus")}
        </span>
      )}
    </div>
  );

  if (!isOwnRoom) {
    return (
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: 30,
          zIndex: Z_LAYERS.STATUS_BUBBLE,
        }}
      >
        {bubbleContent}
      </div>
    );
  }

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2"
      style={{
        top: 30,
        zIndex: Z_LAYERS.STATUS_BUBBLE,
      }}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button className="hover:scale-105 transition-transform cursor-pointer">
            {bubbleContent}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="center">
          <div className="space-y-4">
            <h4 className="font-medium text-sm">{t("rooms.todayIs")}...</h4>
            
            {/* Emoji grid */}
            <div className="grid grid-cols-6 gap-2">
              {STATUS_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setSelectedEmoji(e)}
                  className={`text-2xl p-1 rounded-lg transition-all ${
                    selectedEmoji === e 
                      ? "bg-primary/20 scale-110 ring-2 ring-primary" 
                      : "hover:bg-muted"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Status text input */}
            <Input
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder={t("rooms.statusPlaceholder")}
              maxLength={30}
              className="text-sm"
            />

            {/* Save button */}
            <Button onClick={handleSave} className="w-full" size="sm">
              {t("common.save")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
