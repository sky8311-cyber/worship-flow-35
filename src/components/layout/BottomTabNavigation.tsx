import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Music, Users, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useNotifications } from "@/hooks/useNotifications";
import { ChatFullScreenOverlay } from "@/components/chat/ChatFullScreenOverlay";

export const BottomTabNavigation = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();
  const [chatOpen, setChatOpen] = useState(false);
  
  const tabs = [
    {
      to: "/dashboard",
      icon: Home,
      label: t("navigation.home"),
      match: (path: string) => path === "/dashboard",
    },
    {
      to: "/worship-sets",
      icon: Calendar,
      label: t("navigation.worshipSets"),
      match: (path: string) => path.includes("/worship-sets") || path.includes("/set-builder"),
    },
    {
      to: "/songs",
      icon: Music,
      label: t("navigation.songs"),
      match: (path: string) => path === "/songs" || path === "/favorites",
    },
    {
      to: "/community/search",
      icon: Users,
      label: t("navigation.community"),
      match: (path: string) => path.includes("/community"),
    },
  ];
  
  return (
    <>
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t shadow-lg"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab, index) => {
            const isActive = tab.match(location.pathname);
            const Icon = tab.icon;
            
            return (
              <Link
                key={`${tab.to}-${index}`}
                to={tab.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </Link>
            );
          })}
          
          {/* Chat tab (5th position) */}
          <button
            onClick={() => setChatOpen(true)}
            className="flex flex-col items-center justify-center gap-1 transition-colors text-muted-foreground hover:text-foreground relative"
          >
            <div className="relative">
              <MessageCircle className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{t("navigation.feed")}</span>
          </button>
        </div>
      </nav>

      <ChatFullScreenOverlay 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
      />
    </>
  );
};
