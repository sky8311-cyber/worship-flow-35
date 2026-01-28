import { useState, useCallback, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Bell, Heart, MessageCircle, Shield, Menu, Building2, Sparkles, Settings, HelpCircle, Music2, Share2, Gift, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { RoleBadge } from "@/components/RoleBadge";
import { LanguageToggle } from "@/components/LanguageToggle";
import { HeaderLogo } from "@/components/layout/HeaderLogo";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";
import { NotificationBadge } from "@/components/dashboard/NotificationBadge";
import { MobileSidebarDrawer } from "@/components/layout/MobileSidebarDrawer";
import { AvatarWithLevel } from "@/components/seeds/AvatarWithLevel";
import { SongCartPopover } from "@/components/SongCartPopover";
import { ShareReferralDialog } from "@/components/ShareReferralDialog";

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

interface AppHeaderProps {
  showBackButton?: boolean;
  backPath?: string;
  breadcrumb?: React.ReactNode;
}

export const AppHeader = ({ showBackButton, backPath, breadcrumb }: AppHeaderProps) => {
  const { isAdmin, signOut, profile, isWorshipLeader, isCommunityLeaderInAnyCommunity, isCommunityOwnerInAnyCommunity } = useAuth();
  const { unreadCount, markAllAsRead } = useNotifications();
  const { t, language } = useTranslation();
  const { setLanguage } = useLanguageContext();
  const { isSubscriptionActive } = useChurchSubscription();
  const { isChurchMenuVisible, isLoading: settingsLoading } = useAppSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // Auto-mark all notifications as read when panel opens
  useEffect(() => {
    if (notificationOpen && unreadCount > 0) {
      markAllAsRead();
    }
  }, [notificationOpen, unreadCount, markAllAsRead]);
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
      <header className="border-b border-border/50 bg-card/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 md:grid md:grid-cols-3">
            {/* Left: Menu button + Logo (Mobile/Tablet) | Breadcrumb or Home Icon (Desktop) */}
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
              
              {/* Logo - Left aligned on mobile/tablet */}
              <Link to="/dashboard" className="md:hidden">
                <HeaderLogo />
              </Link>
              
              {/* Desktop: Show breadcrumb in place of Home icon, or Home icon if no breadcrumb */}
              {breadcrumb ? (
                <div className="hidden lg:block">
                  {breadcrumb}
                </div>
              ) : (
                <Link to="/dashboard" className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Home className="h-4 w-4" />
                </Link>
              )}
            </div>
          
          {/* Center: Logo - Desktop only */}
          <Link to="/dashboard" className="hidden md:flex justify-self-center col-start-2">
            <HeaderLogo />
          </Link>
          
          {/* Right: Navigation Items */}
          <div className="col-start-3 justify-self-end flex items-center gap-2">
            {/* Language Toggle - Desktop only */}
            <div className="hidden lg:block">
              <LanguageToggle />
            </div>
            
            {/* Heart Icon - Always visible */}
            <Button variant="ghost" size="icon" onClick={() => navigate("/songs?filter=favorites")}>
              <Heart className="h-5 w-5" />
            </Button>
            
            {/* My Songs Icon - Always visible */}
            <Button variant="ghost" size="icon" onClick={() => navigate("/songs?filter=my-songs")}>
              <Music2 className="h-5 w-5" />
            </Button>
            
            {/* Share/Referral Icon */}
            <Button variant="ghost" size="icon" onClick={() => setShareDialogOpen(true)}>
              <Share2 className="h-5 w-5" />
            </Button>
            
            {/* Song Cart - Shows only when items in cart */}
            {(isWorshipLeader || isAdmin) && <SongCartPopover />}
            
            {/* Notification Bell - Always visible */}
            <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <NotificationBadge count={unreadCount} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="center" sideOffset={8} className="p-0 w-auto">
                <NotificationPanel />
              </PopoverContent>
            </Popover>
            
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
                      {isAdmin && <RoleBadge role="admin" />}
                      {isCommunityOwnerInAnyCommunity && <RoleBadge role="community_owner" />}
                      {isWorshipLeader && <RoleBadge role="worship_leader" />}
                      {isCommunityLeaderInAnyCommunity && !isCommunityOwnerInAnyCommunity && (
                        <RoleBadge role="community_leader" />
                      )}
                      {!isAdmin && !isWorshipLeader && !isCommunityLeaderInAnyCommunity && !isCommunityOwnerInAnyCommunity && (
                        <RoleBadge role="member" />
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
                
                {!settingsLoading && isChurchMenuVisible && (
                  <DropdownMenuItem asChild>
                    <Link to="/membership" className="flex items-center justify-between w-full">
                      <span className="flex items-center">
                        <Sparkles className="mr-2 h-4 w-4" />
                        {language === "ko" ? "멤버십" : "Membership"}
                      </span>
                      {showUpgradeBadge && (
                        <Badge variant="destructive" className="text-xs ml-2 gap-1">
                          {language === "ko" ? "업그레이드" : "Upgrade"}
                        </Badge>
                      )}
                    </Link>
                </DropdownMenuItem>
                )}
                
                
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  {language === "ko" ? "설정" : "Settings"}
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => navigate("/help")}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  {language === "ko" ? "도움말" : "Help"}
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => navigate("/referral")}>
                  <Gift className="mr-2 h-4 w-4" />
                  {language === "ko" ? "친구 초대" : "Referral"}
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => navigate("/kworship-info")}>
                  <Info className="mr-2 h-4 w-4" />
                  {language === "ko" ? "K-Worship 정보" : "About K-Worship"}
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
        
        {/* Breadcrumb Row - Mobile/Tablet only */}
        {breadcrumb && (
          <div className="container mx-auto px-4 pb-2 pt-4 lg:hidden">
            {breadcrumb}
          </div>
        )}
      </div>
    </header>

    <MobileSidebarDrawer open={sidebarOpen} onOpenChange={setSidebarOpen} />
    <ShareReferralDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} />
    </>
  );
};
