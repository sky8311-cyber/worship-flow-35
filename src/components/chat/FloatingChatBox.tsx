import { useEffect, useState } from "react";
import { X, Users, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChatFeed } from "@/components/dashboard/ChatFeed";
import { SupportChatFeed } from "@/components/support/SupportChatFeed";
import { useTranslation } from "@/hooks/useTranslation";
import { useNotifications } from "@/hooks/useNotifications";
import { useSupportUnreadCount } from "@/hooks/useSupportChat";
import { cn } from "@/lib/utils";

interface FloatingChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingChatBox({ isOpen, onClose }: FloatingChatBoxProps) {
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

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-24 right-6 z-[60] hidden lg:flex",
        "w-[400px] h-[500px] flex-col",
        "bg-card border rounded-xl shadow-2xl overflow-hidden",
        "animate-in slide-in-from-bottom-4 fade-in duration-200"
      )}
    >
      {/* Header with Tabs */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "community" | "support")} className="flex-1">
          <TabsList className="h-9 bg-transparent p-0 gap-1">
            <TabsTrigger 
              value="community" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
                data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm
                data-[state=inactive]:bg-background data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border"
            >
              <Users className="w-3.5 h-3.5" />
              {t("chat.community")}
            </TabsTrigger>
            <TabsTrigger 
              value="support" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
                data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm
                data-[state=inactive]:bg-background data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border"
            >
              <Headset className="w-3.5 h-3.5" />
              {t("chat.support")}
              {supportUnread > 0 && (
                <Badge variant="destructive" className="ml-0.5 h-4 min-w-4 px-1 text-[10px]">
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
          className="h-7 w-7 ml-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === "community" ? <ChatFeed /> : <SupportChatFeed />}
      </div>
    </div>
  );
}
