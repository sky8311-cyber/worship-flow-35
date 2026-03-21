import { useState, useEffect, useMemo } from "react";
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
import { useAdminSupportUnreadCount } from "@/hooks/useSupportChat";
import type { TranslationPath } from "@/hooks/useTranslation";

// Detect iOS devices for stability fixes
const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const BottomTabNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { chatUnreadCount } = useNotifications();
  const { user, isAdmin } = useAuth();
  const { cartCount } = useSongCart();
  const adminSupportUnread = useAdminSupportUnreadCount();
  const [chatOpen, setChatOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Memoize iOS detection to avoid recalculating
  const isiOSDevice = useMemo(() => isIOS(), []);
  
  // iOS: disable backdrop-blur for stability during scroll (address bar toggle)
  const navClassName = cn(
    "fixed inset-x-0 bottom-0 z-50 border-t border-border/50",
    isiOSDevice 
      ? "bg-card" // iOS: solid background, no blur
      : "bg-card/95 backdrop-blur-sm" // Other: blur effect
  );

  // Detect keyboard visibility using focus events (more reliable than viewport changes)
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Check if input is inside a drawer, dialog, or overlay
        // In these cases, navigation is already covered, so no need to hide it
        const isInsideOverlay = target.closest('[role="dialog"]') || 
                                target.closest('[data-vaul-drawer]') ||
                                target.closest('[data-radix-portal]');
        
        if (!isInsideOverlay) {
          setKeyboardVisible(true);
        }
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
  const isCompact = totalItems >= 6;
  
  // Static mapping for Tailwind JIT - dynamic classes don't work
  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  }[totalItems] || "grid-cols-5";
  
  const iconSize = isCompact ? "h-4 w-4" : "h-5 w-5";
  const itemPadding = isCompact ? "px-1.5 py-1" : "px-3 py-1.5";
  const labelSize = isCompact ? "text-[9px]" : "text-[10px]";
  const badgeClass = isCompact
    ? "absolute -top-1 -right-2 flex h-3 min-w-3 items-center justify-center rounded-full bg-destructive px-0.5 text-[8px] font-bold text-destructive-foreground"
    : "absolute -top-1.5 -right-2.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground";
  
  // Hide navigation when keyboard is visible
  if (keyboardVisible) {
    return null;
  }

  if (navLoading) {
    return (
      <nav 
        className={navClassName}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
        }}
      >
        <div className="grid grid-cols-6 h-14">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex items-center justify-center py-1">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </nav>
    );
  }
  
  return (
    <>
      <nav 
        className={navClassName}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
        }}
      >
        <div className={cn("grid h-14", gridColsClass)}>
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
                    "flex flex-col items-center justify-center gap-0.5 rounded-full transition-all",
                    itemPadding,
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                    <div className="relative">
                      <Icon className={iconSize} />
                      {draftCount > 0 && (
                        <span className={badgeClass}>
                          {draftCount > 9 ? "9+" : draftCount}
                        </span>
                      )}
                    </div>
                    <span className={cn(labelSize, "font-medium")}>{t(item.label_key as TranslationPath)}</span>
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
                  "flex flex-col items-center justify-center gap-0.5 rounded-full transition-all",
                  itemPadding,
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                  <div className="relative">
                    <Icon className={iconSize} />
                    {isSongsTab && cartCount > 0 && (
                      <span className={badgeClass}>
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </div>
                  <span className={cn(labelSize, "font-medium")}>{t(item.label_key as TranslationPath)}</span>
                </div>
              </Link>
            );
          })}
          
          {/* Chat tab */}
          {chatItem && (
            <button
              onClick={() => {
                if (isAdmin) {
                  navigate("/admin/support");
                } else {
                  setChatOpen(true);
                }
              }}
              className="flex items-center justify-center py-1"
            >
              <div className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all",
                isAdmin && location.pathname.includes("/admin/support")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}>
                <div className="relative">
                  {(() => {
                    const ChatIcon = iconMap[chatItem.icon] || iconMap.MessageCircle;
                    return <ChatIcon className="h-5 w-5" />;
                  })()}
                  {(isAdmin ? adminSupportUnread : chatUnreadCount) > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                      {isAdmin 
                        ? (adminSupportUnread > 99 ? "99+" : adminSupportUnread)
                        : (chatUnreadCount > 99 ? "99+" : chatUnreadCount)
                      }
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">
                  {isAdmin ? t("navigation.customerSupport") : t(chatItem.label_key as TranslationPath)}
                </span>
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
