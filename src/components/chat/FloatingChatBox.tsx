import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatFeed } from "@/components/dashboard/ChatFeed";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface FloatingChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingChatBox({ isOpen, onClose }: FloatingChatBoxProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-24 right-6 z-50 hidden lg:flex",
        "w-[400px] h-[500px] flex-col",
        "bg-card border rounded-xl shadow-2xl overflow-hidden",
        "animate-in slide-in-from-bottom-4 fade-in duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
        <h3 className="font-semibold text-foreground">
          {t("chat.communityFeed")}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat content */}
      <div className="flex-1 overflow-hidden">
        <ChatFeed />
      </div>
    </div>
  );
}
