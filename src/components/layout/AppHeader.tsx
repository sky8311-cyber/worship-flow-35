import { Link } from "react-router-dom";
import { ArrowLeft, Shield, LogOut, Bell, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LanguageToggle } from "@/components/LanguageToggle";
import { HeaderLogo } from "@/components/layout/HeaderLogo";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";
import { NotificationBadge } from "@/components/dashboard/NotificationBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Home, Languages, User } from "lucide-react";

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
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success(t("dashboard.logout"));
    navigate("/login");
  };

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Left: Breadcrumb or Back Button */}
          <div className="justify-self-start">
            {showBackButton && backPath ? (
              <Link 
                to={backPath}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t("common.back")}</span>
              </Link>
            ) : breadcrumb ? (
              <div className="hidden md:block">{breadcrumb}</div>
            ) : (
              <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:flex">
                <Home className="h-4 w-4" />
              </Link>
            )}
          </div>
          
          {/* Center: Logo */}
          <Link to="/dashboard" className="justify-self-center col-start-2">
            <HeaderLogo />
          </Link>
          
          {/* Right: Navigation Items */}
          <div className="col-start-3 justify-self-end flex items-center gap-2">
            <div className="hidden md:block">
              <LanguageToggle />
            </div>
            
            <Button variant="ghost" size="icon" onClick={() => navigate("/favorites")} className="hidden sm:flex">
              <Heart className="h-5 w-5" />
            </Button>
            
            {/* Notification Bell */}
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
            
            {isAdmin && (
              <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
                <Link to="/admin">
                  <Shield className="h-5 w-5" />
                </Link>
              </Button>
            )}
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
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
                  <DropdownMenuItem className="sm:hidden" asChild>
                    <Link to="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      {t("dashboard.adminMenu")}
                    </Link>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem className="sm:hidden" onClick={() => navigate("/favorites")}>
                  <Heart className="mr-2 h-4 w-4" />
                  {t("navigation.favorites")}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="md:hidden" />
                
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("dashboard.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
