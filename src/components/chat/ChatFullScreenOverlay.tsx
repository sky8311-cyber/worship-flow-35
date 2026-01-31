import { useEffect, useState } from "react";
import { X, Users, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChatFeed } from "@/components/dashboard/ChatFeed";
import { SupportChatFeed } from "@/components/support/SupportChatFeed";
import { useTranslation } from "@/hooks/useTranslation";
import { useNotifications } from "@/hooks/useNotifications";
import { useSupportUnreadCount } from "@/hooks/useSupportChat";

interface ChatFullScreenOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatFullScreenOverlay({ isOpen, onClose }: ChatFullScreenOverlayProps) {
  const { t } = useTranslation();
  const { markChatNotificationsAsRead } = useNotifications();
  const supportUnread = useSupportUnreadCount();
  const [activeTab, setActiveTab] = useState<"community" | "support">("community");

  // Mark chat notifications as read when opened
  useEffect(() => {
    if (isOpen) {
      markChatNotificationsAsRead();
    }
  }, [isOpen, markChatNotificationsAsRead]);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[85dvh] max-h-[85dvh] flex flex-col" data-chat-overlay>
        <DrawerHeader className="border-b py-0 px-0 shrink-0">
          <div className="flex items-center justify-between px-4 py-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "community" | "support")} className="flex-1">
              <TabsList className="h-10 bg-transparent p-0 gap-1">
            <TabsTrigger 
              value="community" 
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border
                data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm
                data-[state=inactive]:bg-background data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border"
            >
              <Users className="w-4 h-4" />
              {t("chat.community")}
            </TabsTrigger>
            <TabsTrigger 
              value="support" 
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border
                data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm
                data-[state=inactive]:bg-background data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border"
            >
                  <Headset className="w-4 h-4" />
                  {t("chat.support")}
                  {supportUnread > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                      {supportUnread}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 ml-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
          {activeTab === "community" ? <ChatFeed /> : <SupportChatFeed />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
