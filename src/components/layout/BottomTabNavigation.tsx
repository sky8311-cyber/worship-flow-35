import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useSongCart } from "@/contexts/SongCartContext";
import { supabase } from "@/integrations/supabase/client";
import { ChatFullScreenOverlay } from "@/components/chat/ChatFullScreenOverlay";
import { useEnabledNavigationItems, iconMap } from "@/hooks/useNavigationItems";
import type { TranslationPath } from "@/hooks/useTranslation";

export const BottomTabNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { chatUnreadCount } = useNotifications();
  const { user } = useAuth();
  const { cartCount } = useSongCart();
  const [chatOpen, setChatOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Detect keyboard visibility using focus events (more reliable than viewport changes)
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        setKeyboardVisible(true);
      }
    };
    
    const handleFocusOut = () => {
      setKeyboardVisible(false);
    };
    
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Fetch navigation items from DB
  const { data: navItems, isLoading: navLoading } = useEnabledNavigationItems("bottom");

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

  // Check if path matches the item's match pattern
  const isPathActive = (matchPattern: string | null, path: string | null): boolean => {
    if (!matchPattern) return false;
    const patterns = matchPattern.split(",").map(p => p.trim());
    return patterns.some(pattern => location.pathname.includes(pattern));
  };

  // Filter out chat (handled separately) and get regular nav items
  const regularItems = navItems?.filter(item => item.key !== "chat") || [];
  const chatItem = navItems?.find(item => item.key === "chat");

  // Calculate grid columns based on items count + chat
  const totalItems = regularItems.length + (chatItem ? 1 : 0);
  const gridCols = totalItems <= 4 ? `grid-cols-${totalItems}` : "grid-cols-5";
  
  // Hide navigation when keyboard is visible
  if (keyboardVisible) {
    return null;
  }

  if (navLoading) {
    return (
      <nav 
        className="fixed inset-x-0 bottom-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border/50"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
        }}
      >
        <div className="grid grid-cols-5 h-14">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center justify-center py-1">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </nav>
    );
  }
  
  return (
    <>
      <nav 
        className="fixed inset-x-0 bottom-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border/50"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
        }}
      >
        <div className={cn("grid h-14", `grid-cols-${totalItems}`)}>
          {regularItems.map((item, index) => {
            const isActive = isPathActive(item.match_pattern, item.path);
            const Icon = iconMap[item.icon] || iconMap.Home;
            const isDraftTab = item.key === "worship-sets";
            const isSongsTab = item.key === "songs";
            
            // Use custom click handler for worship sets tab to navigate to latest draft
            if (isDraftTab) {
              return (
                <button
                  key={`${item.key}-${index}`}
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
                    <span className="text-[10px] font-medium">{t(item.label_key as TranslationPath)}</span>
                  </div>
                </button>
              );
            }
            
            return (
              <Link
                key={`${item.key}-${index}`}
                to={item.path || "/"}
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
                  <span className="text-[10px] font-medium">{t(item.label_key as TranslationPath)}</span>
                </div>
              </Link>
            );
          })}
          
          {/* Chat tab */}
          {chatItem && (
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center justify-center py-1"
            >
              <div className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all text-muted-foreground hover:text-foreground">
                <div className="relative">
                  {(() => {
                    const ChatIcon = iconMap[chatItem.icon] || iconMap.MessageCircle;
                    return <ChatIcon className="h-5 w-5" />;
                  })()}
                  {chatUnreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                      {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{t(chatItem.label_key as TranslationPath)}</span>
              </div>
            </button>
          )}
        </div>
      </nav>

      <ChatFullScreenOverlay 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
      />
    </>
  );
};
