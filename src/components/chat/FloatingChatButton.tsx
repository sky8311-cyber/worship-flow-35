import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface FloatingChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function FloatingChatButton({ onClick, isOpen }: FloatingChatButtonProps) {
  const { unreadCount } = useNotifications();

  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-200",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "hidden lg:flex",
        isOpen && "scale-95"
      )}
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Button>
  );
}
