import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useSongCart } from "@/contexts/SongCartContext";
import { supabase } from "@/integrations/supabase/client";
import { ChatFullScreenOverlay } from "@/components/chat/ChatFullScreenOverlay";
import { navigationTabs, chatTab } from "@/lib/navigationConfig";
import type { TranslationPath } from "@/hooks/useTranslation";

export const BottomTabNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { chatUnreadCount } = useNotifications();
  const { user } = useAuth();
  const { cartCount } = useSongCart();
  const [chatOpen, setChatOpen] = useState(false);

  // Fetch user's draft count and latest draft ID
  const { data: draftData } = useQuery({
    queryKey: ["user-drafts-nav", user?.id],
    queryFn: async () => {
      if (!user?.id) return { count: 0, latestId: null };
      
      // Get count
      const { count, error: countError } = await supabase
        .from("service_sets")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id)
        .eq("status", "draft");
      
      // Get latest draft ID
      const { data: latestDraft, error: latestError } = await supabase
        .from("service_sets")
        .select("id")
        .eq("created_by", user.id)
        .eq("status", "draft")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return {
        count: countError ? 0 : (count || 0),
        latestId: latestError ? null : latestDraft?.id || null,
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  const draftCount = draftData?.count || 0;
  const latestDraftId = draftData?.latestId;

  // Handle worship sets tab click - navigate to latest draft if available
  const handleWorshipSetsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (latestDraftId) {
      navigate(`/set-builder/${latestDraftId}`);
    } else {
      navigate("/worship-sets");
    }
  };
  
  return (
    <>
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border/50"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="grid grid-cols-5 h-14">
          {navigationTabs.map((tab, index) => {
            const isActive = tab.match(location.pathname);
            const Icon = tab.icon;
            const isDraftTab = tab.to.startsWith("/worship-sets");
            const isSongsTab = tab.to === "/songs";
            
            // Use custom click handler for worship sets tab to navigate to latest draft
            if (isDraftTab) {
              return (
                <button
                  key={`${tab.to}-${index}`}
                  onClick={handleWorshipSetsClick}
                  className="flex items-center justify-center py-1"
                >
                  <div className={cn(
                    "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                    <div className="relative">
                      <Icon className="h-5 w-5" />
                      {draftCount > 0 && (
                        <span className="absolute -top-1.5 -right-2.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                          {draftCount > 9 ? "9+" : draftCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium">{t(tab.labelKey as TranslationPath)}</span>
                  </div>
                </button>
              );
            }
            
            return (
              <Link
                key={`${tab.to}-${index}`}
                to={tab.to}
                className="flex items-center justify-center py-1"
              >
                <div className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {isSongsTab && cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{t(tab.labelKey as TranslationPath)}</span>
                </div>
              </Link>
            );
          })}
          
          {/* Chat tab (5th position) */}
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center justify-center py-1"
          >
            <div className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all text-muted-foreground hover:text-foreground">
              <div className="relative">
                <chatTab.icon className="h-5 w-5" />
                {chatUnreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                    {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{t(chatTab.labelKey as TranslationPath)}</span>
            </div>
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
