import { useMemo, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, GraduationCap, BookOpen, Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const isIOS = () => {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
};

const tabs = [
  { key: "home", label: "홈", icon: Home, path: "/dashboard", match: "/dashboard" },
  { key: "dashboard", label: "대시보드", icon: GraduationCap, path: "/institute", match: "/institute", exact: true },
  { key: "courses", label: "과목", icon: BookOpen, path: "/institute/courses", match: "/institute/courses" },
  { key: "ai-coach", label: "AI 코치", icon: Sparkles, path: "/institute/ai-coach", match: "/institute/ai-coach" },
  { key: "info", label: "소개", icon: Info, path: "/institute/about", match: "/institute/about" },
];

export const InstituteBottomNav = () => {
  const location = useLocation();
  const isiOSDevice = useMemo(() => isIOS(), []);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        const isInsideOverlay = target.closest('[role="dialog"]') ||
          target.closest("[data-vaul-drawer]") ||
          target.closest("[data-radix-portal]");
        if (!isInsideOverlay) setKeyboardVisible(true);
      }
    };
    const handleFocusOut = () => setKeyboardVisible(false);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  if (keyboardVisible) return null;

  const navClassName = cn(
    "fixed inset-x-0 bottom-0 z-50 border-t border-border/50",
    isiOSDevice ? "bg-card" : "bg-card/95 backdrop-blur-sm"
  );

  const isActive = (tab: typeof tabs[number]) => {
    if (tab.key === "dashboard") {
      return location.pathname === "/institute" && !location.hash;
    }
    if (tab.key === "courses") {
      return location.pathname === "/institute/courses";
    }
    return location.pathname.startsWith(tab.match);
  };

  return (
    <nav
      className={navClassName}
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        transform: "translate3d(0, 0, 0)",
        WebkitTransform: "translate3d(0, 0, 0)",
      }}
    >
      <div className="grid grid-cols-5 h-14">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.key}
              to={tab.path}
              className="flex items-center justify-center py-1"
            >
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-full transition-all px-3 py-1.5",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
