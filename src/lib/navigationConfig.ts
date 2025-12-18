import { Home, Calendar, Music, Users, MessageCircle, LucideIcon } from "lucide-react";

export interface NavigationTab {
  to: string;
  icon: LucideIcon;
  labelKey: string;
  match: (path: string) => boolean;
}

export const navigationTabs: NavigationTab[] = [
  {
    to: "/dashboard",
    icon: Home,
    labelKey: "navigation.home",
    match: (path: string) => path === "/dashboard",
  },
  {
    to: "/worship-sets?continue=true",
    icon: Calendar,
    labelKey: "navigation.worshipSets",
    match: (path: string) => path.includes("/worship-sets") || path.includes("/set-builder"),
  },
  {
    to: "/songs",
    icon: Music,
    labelKey: "navigation.songs",
    match: (path: string) => path === "/songs" || path === "/favorites",
  },
  {
    to: "/community/search",
    icon: Users,
    labelKey: "navigation.community",
    match: (path: string) => path.includes("/community"),
  },
];

export const chatTab = {
  icon: MessageCircle,
  labelKey: "navigation.feed",
};
