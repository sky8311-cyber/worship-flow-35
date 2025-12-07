import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Building2, ArrowLeft, UserPlus, Church } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { HeaderLogo } from "@/components/layout/HeaderLogo";
import { useAppSettings } from "@/hooks/useAppSettings";

export const AdminNav = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { isChurchMenuVisible, isLoading } = useAppSettings();
  
  const baseLinks = [
    {
      to: "/admin",
      label: t("admin.nav.dashboard"),
      icon: LayoutDashboard,
    },
    {
      to: "/admin/users",
      label: t("admin.nav.users"),
      icon: Users,
    },
    {
      to: "/admin/communities",
      label: t("admin.nav.communities"),
      icon: Building2,
    },
  ];

  // Conditionally add Church Accounts link
  const churchAccountLink = {
    to: "/admin/church-accounts",
    label: t("admin.nav.churchAccounts"),
    icon: Church,
  };

  const applicationsLink = {
    to: "/admin/applications",
    label: t("admin.applications.title"),
    icon: UserPlus,
  };

  const links = (!isLoading && isChurchMenuVisible) 
    ? [...baseLinks, churchAccountLink, applicationsLink]
    : [...baseLinks, applicationsLink];
  
  return (
    <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 sm:gap-4 py-4">
          <div className="flex-shrink-0">
            <HeaderLogo />
          </div>
          
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t("admin.nav.backToDashboard")}</span>
          </Link>
          
          {/* Horizontal scroll container for mobile */}
          <div className="flex-1 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-1 min-w-max">
              {links.map((link) => {
                const isActive = location.pathname === link.to;
                const Icon = link.icon;
                
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden md:inline">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
