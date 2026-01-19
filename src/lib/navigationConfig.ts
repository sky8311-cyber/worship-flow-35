import { Home, Calendar, Music, DoorOpen, MessageCircle, LucideIcon } from "lucide-react";

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
    to: "/rooms",
    icon: DoorOpen,
    labelKey: "navigation.rooms",
    match: (path: string) => path.includes("/rooms"),
  },
];

export const chatTab = {
  icon: MessageCircle,
  labelKey: "navigation.chat",
};
