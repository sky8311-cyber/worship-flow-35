import { useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Bell, Heart, MessageCircle, Shield, Menu, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LanguageToggle } from "@/components/LanguageToggle";
import { HeaderLogo } from "@/components/layout/HeaderLogo";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";
import { NotificationBadge } from "@/components/dashboard/NotificationBadge";
import { MobileSidebarDrawer } from "@/components/layout/MobileSidebarDrawer";
import { AvatarWithLevel } from "@/components/seeds/AvatarWithLevel";
import { SongCartPopover } from "@/components/SongCartPopover";
import { ChatFullScreenOverlay } from "@/components/chat/ChatFullScreenOverlay";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useChurchSubscription } from "@/hooks/useChurchSubscription";
import { useEdgeSwipe } from "@/hooks/useEdgeSwipe";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Home, Languages } from "lucide-react";
import { navigationTabs, chatTab } from "@/lib/navigationConfig";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  showBackButton?: boolean;
  backPath?: string;
  breadcrumb?: React.ReactNode;
}

export const AppHeader = ({ showBackButton, backPath, breadcrumb }: AppHeaderProps) => {
  const { isAdmin, signOut, profile, isWorshipLeader, isCommunityLeaderInAnyCommunity } = useAuth();
  const { unreadCount } = useNotifications();
  const { t, language } = useTranslation();
  const { setLanguage } = useLanguageContext();
  const { isSubscriptionActive } = useChurchSubscription();
  const { isChurchMenuVisible, isLoading: settingsLoading } = useAppSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navSheetOpen, setNavSheetOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  // Enable swipe from left edge to open sidebar on mobile
  const handleEdgeSwipe = useCallback(() => {
    setSidebarOpen(true);
  }, []);
  
  useEdgeSwipe({
    edgeThreshold: 30,
    swipeThreshold: 50,
    onSwipe: handleEdgeSwipe,
  });

  // Show upgrade badge if user is worship leader/admin but doesn't have active church subscription
  const showUpgradeBadge = (isWorshipLeader || isAdmin) && !isSubscriptionActive;

  const handleLogout = async () => {
    await signOut();
    toast.success(t("dashboard.logout"));
    navigate("/login");
  };

  return (
    <>
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Left: Menu button (Mobile/Tablet) + Home Icon (Desktop) */}
            <div className="justify-self-start flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden" 
                onClick={() => setSidebarOpen(true)}
                aria-label={t("navigation.menu")}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Link to="/dashboard" className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Home className="h-4 w-4" />
              </Link>
            </div>
          
          {/* Center: Logo */}
          <Link to="/dashboard" className="justify-self-center col-start-2">
            <HeaderLogo />
          </Link>
          
          {/* Right: Navigation Items */}
          <div className="col-start-3 justify-self-end flex items-center gap-2">
            {/* Language Toggle - Desktop only */}
            <div className="hidden lg:block">
              <LanguageToggle />
            </div>
            
            {/* Heart Icon - Tablet & Desktop only */}
            <Button variant="ghost" size="icon" onClick={() => navigate("/favorites")} className="hidden md:flex">
              <Heart className="h-5 w-5" />
            </Button>
            
            {/* Song Cart - Shows only when items in cart */}
            {(isWorshipLeader || isAdmin) && <SongCartPopover />}
            
            {/* Notification Bell - Always visible */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <NotificationBadge count={unreadCount} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="p-0 w-auto">
                <NotificationPanel />
              </PopoverContent>
            </Popover>
            
            {/* Message Icon - Tablet & Desktop only */}
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <MessageCircle className="h-5 w-5" />
            </Button>
            
            {/* Navigation Hamburger Menu - Mobile/Tablet only */}
            <Sheet open={navSheetOpen} onOpenChange={setNavSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <nav className="flex flex-col pt-12">
                  {navigationTabs.map((tab) => {
                    const isActive = tab.match(location.pathname);
                    const Icon = tab.icon;
                    return (
                      <Link
                        key={tab.to}
                        to={tab.to}
                        onClick={() => setNavSheetOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-6 py-4 transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary border-r-2 border-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{t(tab.labelKey as any)}</span>
                      </Link>
                    );
                  })}
                  
                  {/* Chat/Feed item */}
                  <button
                    onClick={() => {
                      setNavSheetOpen(false);
                      setChatOpen(true);
                    }}
                    className="flex items-center gap-3 px-6 py-4 transition-colors text-muted-foreground hover:bg-muted hover:text-foreground w-full text-left"
                  >
                    <div className="relative">
                      <chatTab.icon className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">{t(chatTab.labelKey as any)}</span>
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  {profile ? (
                    <AvatarWithLevel
                      userId={profile.id}
                      avatarUrl={profile.avatar_url}
                      fallback={profile.full_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || "U"}
                      size="md"
                      showLevel={false}
                      className="h-10 w-10"
                    />
                  ) : (
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm font-medium">{profile?.full_name || t("profile.title")}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                    
                    {/* Role Badges */}
                    <div className="flex gap-1 flex-wrap">
                      {isAdmin && (
                        <Badge variant="destructive" className="text-xs">
                          {t("roles.admin")}
                        </Badge>
                      )}
                      {isWorshipLeader && (
                        <Badge className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                          {t("roles.worshipLeader")}
                        </Badge>
                      )}
                      {isCommunityLeaderInAnyCommunity && (
                        <Badge className="text-xs bg-accent hover:bg-accent/90 text-accent-foreground">
                          {t("roles.communityLeader")}
                        </Badge>
                      )}
                      {!isAdmin && !isWorshipLeader && !isCommunityLeaderInAnyCommunity && (
                        <Badge variant="outline" className="text-xs">
                          {t("roles.member")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Mobile-only items */}
                <DropdownMenuItem className="md:hidden" onClick={() => setLanguage(language === "en" ? "ko" : "en")}>
                  <Languages className="mr-2 h-4 w-4" />
                  <span>{language === "en" ? "한국어" : "English"}</span>
                </DropdownMenuItem>
                
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      {t("dashboard.adminMenu")}
                    </Link>
                  </DropdownMenuItem>
                )}
                
                {!settingsLoading && isChurchMenuVisible && (isWorshipLeader || isAdmin) && (
                  <DropdownMenuItem asChild>
                    <Link to="/church-account" className="flex items-center justify-between w-full">
                      <span className="flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        {t("churchAccount.title")}
                      </span>
                      {showUpgradeBadge && (
                        <Badge variant="destructive" className="text-xs ml-2 gap-1">
                          <Sparkles className="w-3 h-3" />
                          {t("churchAccount.upgrade")}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem className="md:hidden" onClick={() => navigate("/favorites")}>
                  <Heart className="mr-2 h-4 w-4" />
                  {t("navigation.favorites")}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("dashboard.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Breadcrumb Row */}
        {breadcrumb && (
          <div className="container mx-auto px-4 pb-2 pt-2">
            {breadcrumb}
          </div>
        )}
      </div>
    </header>

    <MobileSidebarDrawer open={sidebarOpen} onOpenChange={setSidebarOpen} />
    <ChatFullScreenOverlay isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
};
