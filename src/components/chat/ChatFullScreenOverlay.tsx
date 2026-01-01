import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ChatFeed } from "@/components/dashboard/ChatFeed";
import { useTranslation } from "@/hooks/useTranslation";
import { useNotifications } from "@/hooks/useNotifications";

interface ChatFullScreenOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatFullScreenOverlay({ isOpen, onClose }: ChatFullScreenOverlayProps) {
  const { t } = useTranslation();
  const { markChatNotificationsAsRead } = useNotifications();

  // Mark chat notifications as read when opened
  useEffect(() => {
    if (isOpen) {
      markChatNotificationsAsRead();
    }
  }, [isOpen, markChatNotificationsAsRead]);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[85vh] max-h-[85vh]">
        <DrawerHeader className="border-b flex flex-row items-center justify-between py-3 px-4">
          <DrawerTitle className="text-lg font-semibold">
            {t("chat.communityFeed")}
          </DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden">
          <ChatFeed />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
