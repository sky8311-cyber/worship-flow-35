import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./NotificationItem";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "@/hooks/useTranslation";
import { Loader2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseLocalDate } from "@/lib/countdownHelper";

export function NotificationPanel() {
  const { t } = useTranslation();
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [activeTab, setActiveTab] = useState("all");

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  // Group notifications by "new" (last 24 hours) and "earlier"
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const newNotifications = filteredNotifications.filter(
    (n) => parseLocalDate(n.created_at) > oneDayAgo
  );
  const earlierNotifications = filteredNotifications.filter(
    (n) => parseLocalDate(n.created_at) <= oneDayAgo
  );

  if (isLoading) {
    return (
      <div className="w-[calc(100vw-2rem)] sm:w-96 p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-[calc(100vw-2rem)] sm:w-96 bg-background border rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-xl font-semibold">{t("notifications.title")}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => markAllAsRead()}>
              {t("notifications.markAllRead")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
          <TabsTrigger value="all">{t("notifications.all")}</TabsTrigger>
          <TabsTrigger value="unread">{t("notifications.unread")}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <ScrollArea className="h-[500px]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No notifications
              </div>
            ) : (
              <>
                {/* New Notifications */}
                {newNotifications.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
                      <span className="text-sm font-semibold">{t("notifications.new")}</span>
                    </div>
                    {newNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={markAsRead}
                      />
                    ))}
                  </div>
                )}

                {/* Earlier Notifications */}
                {earlierNotifications.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/30 mt-2">
                      <span className="text-sm font-semibold">{t("notifications.earlier")}</span>
                    </div>
                    {earlierNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={markAsRead}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
