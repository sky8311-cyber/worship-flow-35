import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, ListChecks, Building2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { HeaderLogo } from "@/components/layout/HeaderLogo";

export const AdminNav = () => {
  const location = useLocation();
  const { t } = useTranslation();
  
  const links = [
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
      to: "/admin/waitlist",
      label: t("admin.nav.waitlist"),
      icon: ListChecks,
    },
    {
      to: "/admin/communities",
      label: t("admin.nav.communities"),
      icon: Building2,
    },
  ];
  
  return (
    <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 py-4">
          <HeaderLogo />
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("admin.nav.backToDashboard")}
          </Link>
          
          <div className="flex-1 flex items-center gap-1">
            {links.map((link) => {
              const isActive = location.pathname === link.to;
              const Icon = link.icon;
              
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
