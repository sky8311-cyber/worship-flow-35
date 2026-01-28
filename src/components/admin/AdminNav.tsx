import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Building2, UserPlus, Church, LayoutList, Sprout, Mail, Layers, History, BookOpen, MoreHorizontal, Headset, Sparkles, Palette, Newspaper, BarChart3, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAdminSupportUnreadCount } from "@/hooks/useSupportChat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const AdminNav = () => {
  const location = useLocation();
  const { t, language } = useTranslation();
  const { isChurchMenuVisible, isLoading } = useAppSettings();
  const supportUnread = useAdminSupportUnreadCount();
  
  // Fetch pending enrichment count
  const { data: enrichmentCount } = useQuery({
    queryKey: ["pending-enrichments-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("song_enrichment_suggestions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      return count || 0;
    },
  });
  
  // Primary links (always visible in header)
  const primaryLinks = [
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
    {
      to: "/admin/crm",
      label: "CRM",
      icon: LayoutList,
    },
    {
      to: "/admin/support",
      label: language === "ko" ? "고객지원" : "Support",
      icon: Headset,
      badge: supportUnread > 0 ? supportUnread : undefined,
    },
  ];

  // Secondary links (in "More" dropdown)
  const secondaryLinks = [
    {
      to: "/admin/analytics",
      label: language === "ko" ? "분석" : "Analytics",
      icon: BarChart3,
    },
    {
      to: "/admin/membership-products",
      label: language === "ko" ? "멤버십 상품" : "Membership",
      icon: CreditCard,
    },
    {
      to: "/admin/song-enrichment",
      label: language === "ko" ? "AI 곡 추천" : "AI Enrichment",
      icon: Sparkles,
      badge: enrichmentCount && enrichmentCount > 0 ? enrichmentCount : undefined,
    },
    {
      to: "/admin/applications",
      label: t("admin.applications.title"),
      icon: UserPlus,
    },
    // Conditionally add Worship Community Accounts link
    ...(!isLoading && isChurchMenuVisible ? [{
      to: "/admin/church-accounts",
      label: language === "ko" ? "공동체 계정" : "Community Accounts",
      icon: Church,
    }] : []),
    {
      to: "/admin/topics",
      label: language === "ko" ? "주제 관리" : "Topics",
      icon: LayoutList,
    },
    {
      to: "/admin/rewards",
      label: "Rewards",
      icon: Sprout,
    },
    {
      to: "/admin/email",
      label: "Email",
      icon: Mail,
    },
    {
      to: "/admin/features",
      label: language === "ko" ? "티어 기능" : "Features",
      icon: Layers,
    },
    {
      to: "/admin/history",
      label: language === "ko" ? "히스토리" : "History",
      icon: History,
    },
    {
      to: "/admin/tier-guide",
      label: language === "ko" ? "티어 가이드" : "Tier Guide",
      icon: BookOpen,
    },
    {
      to: "/admin/studio",
      label: language === "ko" ? "예배공작소" : "Studio",
      icon: Palette,
    },
    {
      to: "/admin/news",
      label: language === "ko" ? "뉴스" : "News",
      icon: Newspaper,
    },
  ];

  // Check if a path is active (exact match for /admin, prefix match for others)
  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  // Check if any secondary link is active (for More dropdown highlight)
  const isSecondaryActive = secondaryLinks.some(link => isActive(link.to));
  
  return (
    <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between gap-2 py-3">
          {/* Primary Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            {primaryLinks.map((link) => {
              const active = isActive(link.to);
              const Icon = link.icon;
              const badgeValue = 'badge' in link ? link.badge : undefined;
              
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap relative",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="hidden sm:inline">{link.label}</span>
                  {badgeValue !== undefined && badgeValue > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs"
                    >
                      {badgeValue}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {/* More Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={isSecondaryActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex items-center gap-1.5 px-2.5 sm:px-3 py-2 h-auto text-xs sm:text-sm font-medium",
                  isSecondaryActive && "bg-primary text-primary-foreground"
                )}
              >
                <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">
                  {language === "ko" ? "더보기" : "More"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px] bg-popover z-50">
              {secondaryLinks.map((link) => {
                const active = isActive(link.to);
                const Icon = link.icon;
                
                return (
                  <DropdownMenuItem key={link.to} asChild className={cn(active && "bg-accent")}>
                    <Link to={link.to} className="flex items-center gap-2 cursor-pointer">
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};
