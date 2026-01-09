import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { cn } from "@/lib/utils";

interface FloatingChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function FloatingChatButton({ onClick, isOpen }: FloatingChatButtonProps) {
  const { chatUnreadCount } = useNotifications();
  const { playerState, playlist } = useMusicPlayer();
  
  // Check if mini player is visible
  const isMiniPlayerVisible = playerState === 'mini' && playlist.length > 0;

  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-200",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "hidden lg:flex",
        isMiniPlayerVisible ? "bottom-[7.5rem]" : "bottom-6",
        isOpen && "scale-95"
      )}
    >
      <MessageCircle className="h-6 w-6" />
      {chatUnreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground">
          {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
        </span>
      )}
    </Button>
  );
}
