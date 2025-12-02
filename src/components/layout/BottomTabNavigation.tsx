import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Music, Users, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export const BottomTabNavigation = () => {
  const location = useLocation();
  const { t } = useTranslation();
  
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
    {
      to: "/dashboard",
      icon: MoreHorizontal,
      label: t("navigation.more"),
      match: () => false,
      onClick: true,
    },
  ];
  
  return (
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
      </div>
    </nav>
  );
};
