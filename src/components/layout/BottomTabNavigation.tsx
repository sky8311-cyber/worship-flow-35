import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ChatFullScreenOverlay } from "@/components/chat/ChatFullScreenOverlay";
import { navigationTabs, chatTab } from "@/lib/navigationConfig";
import type { TranslationPath } from "@/hooks/useTranslation";

export const BottomTabNavigation = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { chatUnreadCount } = useNotifications();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  // Fetch user's draft count
  const { data: draftCount = 0 } = useQuery({
    queryKey: ["user-draft-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("service_sets")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id)
        .eq("status", "draft");
      
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
  
  return (
    <>
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t shadow-lg"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="grid grid-cols-5 h-16">
          {navigationTabs.map((tab, index) => {
            const isActive = tab.match(location.pathname);
            const Icon = tab.icon;
            const isDraftTab = tab.to === "/worship-sets";
            
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
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {isDraftTab && draftCount > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {draftCount > 9 ? "9+" : draftCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{t(tab.labelKey as TranslationPath)}</span>
              </Link>
            );
          })}
          
          {/* Chat tab (5th position) */}
          <button
            onClick={() => setChatOpen(true)}
            className="flex flex-col items-center justify-center gap-1 transition-colors text-muted-foreground hover:text-foreground relative"
          >
            <div className="relative">
              <chatTab.icon className="h-5 w-5" />
              {chatUnreadCount > 0 && (
                <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{t(chatTab.labelKey as TranslationPath)}</span>
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
