import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import logoMobile from "@/assets/kworship-logo-mobile.png";
import logoDesktop from "@/assets/kworship-logo-desktop.png";

// Centralized app store URLs - update here when ready
const APP_STORE_URL: string | null = null;
const PLAY_STORE_URL: string | null = null;

interface PublicPageHeaderProps {
  showLogo?: boolean;
}

export const PublicPageHeader = ({ showLogo = true }: PublicPageHeaderProps) => {
  const { language } = useTranslation();

  const handleAppStoreClick = () => {
    if (APP_STORE_URL) {
      window.open(APP_STORE_URL, "_blank");
    } else {
      toast(language === "ko" ? "출시 예정" : "Coming Soon", {
        description: language === "ko" ? "iOS 앱이 곧 출시됩니다!" : "iOS app is coming soon!",
      });
    }
  };

  const handlePlayStoreClick = () => {
    if (PLAY_STORE_URL) {
      window.open(PLAY_STORE_URL, "_blank");
    } else {
      toast(language === "ko" ? "출시 예정" : "Coming Soon", {
        description: language === "ko" ? "Android 앱이 곧 출시됩니다!" : "Android app is coming soon!",
      });
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="sticky z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b safe-top">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            {showLogo && (
              <Link to="/" className="flex-shrink-0">
                <img src={logoMobile} alt="K-Worship" className="h-10 md:hidden" />
                <img src={logoDesktop} alt="K-Worship" className="hidden md:block h-12" />
              </Link>
            )}

            {/* Right: Floating Icon Bar */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-border/40 shadow-sm ml-auto">
              {/* App Store - Coming Soon */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 rounded-full hover:bg-muted text-foreground"
                    onClick={handleAppStoreClick}
                  >
                    {!APP_STORE_URL && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    )}
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>App Store {!APP_STORE_URL && "(Coming Soon)"}</p>
                </TooltipContent>
              </Tooltip>

              {/* Play Store - Coming Soon */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 rounded-full hover:bg-muted text-foreground"
                    onClick={handlePlayStoreClick}
                  >
                    {!PLAY_STORE_URL && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    )}
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Play Store {!PLAY_STORE_URL && "(Coming Soon)"}</p>
                </TooltipContent>
              </Tooltip>

              {/* Web App */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted text-foreground"
                    asChild
                  >
                    <Link to="/app">
                      <Globe className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{language === "ko" ? "웹앱 열기" : "Open Web App"}</p>
                </TooltipContent>
              </Tooltip>

              {/* Language Toggle */}
              <LanguageToggle />
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};
