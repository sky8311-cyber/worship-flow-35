import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Bell, Shield, Menu, Settings, HelpCircle, Sparkles, Gift, Info, GraduationCap, Languages, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

import { LanguageToggle } from "@/components/LanguageToggle";
import { HeaderLogo } from "@/components/layout/HeaderLogo";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";
import { NotificationBadge } from "@/components/dashboard/NotificationBadge";
import { AvatarWithLevel } from "@/components/seeds/AvatarWithLevel";
import { RoleBadge } from "@/components/RoleBadge";
import { TierBadge } from "@/components/admin/TierBadge";

import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useChurchSubscription } from "@/hooks/useChurchSubscription";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTierFeature } from "@/hooks/useTierFeature";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface InstituteHeaderProps {
  breadcrumb?: React.ReactNode;
}

export const InstituteHeader = ({ breadcrumb }: InstituteHeaderProps) => {
  const { isAdmin, signOut, profile, user, isWorshipLeader, isCommunityLeaderInAnyCommunity, isCommunityOwnerInAnyCommunity } = useAuth();
  const { unreadCount, markAllAsRead } = useNotifications();
  const { t, language } = useTranslation();
  const { setLanguage } = useLanguageContext();
  const { isSubscriptionActive } = useChurchSubscription();
  const { isSandboxTester, isLoading: settingsLoading, isInstituteEnabled, isWorshipProfileEnabled } = useAppSettings();
  const { tier } = useTierFeature();
  const navigate = useNavigate();

  const { data: isInstructor } = useQuery({
    queryKey: ["is-instructor", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.from("institute_instructors").select("id").eq("user_id", user.id).maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });

  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    if (notificationOpen && unreadCount > 0) {
      markAllAsRead();
    }
  }, [notificationOpen, unreadCount, markAllAsRead]);

  const showUpgradeBadge = !isSubscriptionActive;

  const handleLogout = async () => {
    await signOut();
    toast.success(t("dashboard.logout"));
    navigate("/login");
  };

  return (
    <header className="border-b border-border/50 bg-card/95 backdrop-blur-sm sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)]">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <Link to="/institute">
            <HeaderLogo />
          </Link>

          {/* Right: Language + Notification + Avatar */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <LanguageToggle />
            </div>

            <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      <NotificationBadge count={unreadCount} />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{language === "ko" ? "알림" : "Notifications"}</TooltipContent>
              </Tooltip>
              <PopoverContent align="center" sideOffset={8} className="p-0 w-auto">
                <NotificationPanel />
              </PopoverContent>
            </Popover>

            {/* Profile Dropdown with admin items */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>{language === "ko" ? "프로필" : "Profile"}</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm font-medium">{profile?.full_name || t("profile.title")}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                    <div className="flex gap-1 flex-wrap">
                      {isAdmin && <RoleBadge role="admin" />}
                      {isCommunityOwnerInAnyCommunity && <RoleBadge role="community_owner" />}
                      {isCommunityLeaderInAnyCommunity && !isCommunityOwnerInAnyCommunity && (
                        <RoleBadge role="community_leader" />
                      )}
                      <TierBadge tier={tier} size="sm" />
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Admin-only: Faculty & Settings for Institute */}
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/institute/faculty">
                        <Wrench className="mr-2 h-4 w-4" />
                        {language === "ko" ? "Faculty 관리" : "Faculty"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/institute/setting">
                        <Settings className="mr-2 h-4 w-4" />
                        {language === "ko" ? "인스티튜트 설정" : "Institute Settings"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {isInstructor && isInstituteEnabled && (
                  <DropdownMenuItem asChild>
                    <Link to="/institute/manage">
                      <GraduationCap className="mr-2 h-4 w-4" />
                      {language === "ko" ? "내 과목 관리" : "My Courses"}
                    </Link>
                  </DropdownMenuItem>
                )}

                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      {t("dashboard.adminMenu")}
                    </Link>
                  </DropdownMenuItem>
                )}

                {/* Mobile language toggle */}
                <DropdownMenuItem className="md:hidden" onClick={() => setLanguage(language === "en" ? "ko" : "en")}>
                  <Languages className="mr-2 h-4 w-4" />
                  <span>{language === "en" ? "한국어" : "English"}</span>
                </DropdownMenuItem>

                {!settingsLoading && (isAdmin || isSandboxTester) && (
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

        {/* Breadcrumb Row */}
        {breadcrumb && (
          <div className="pt-2 pb-1">
            {breadcrumb}
          </div>
        )}
      </div>
    </header>
  );
};
