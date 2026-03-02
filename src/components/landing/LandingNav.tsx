import { Link, useLocation } from "react-router-dom";
import { Globe, Home, LogIn, UserPlus } from "lucide-react";
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

export const LandingNav = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const isAppPage = location.pathname === "/app";

  // Full header with logo and enhanced buttons for /app page
  if (isAppPage) {
    return (
      <header className="sticky z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Home + Logo */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/">
                  <Home className="h-4 w-4" />
                </Link>
              </Button>
              
              {/* Logo */}
              <Link to="/app" className="flex items-center">
                <img 
                  src="/kworship-icon.png" 
                  alt="KWorship" 
                  className="h-8 w-8"
                />
              </Link>
            </div>

            {/* Right side - Auth buttons + Language */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="gap-2">
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  <span>{t("auth.login")}</span>
                </Link>
              </Button>
              
              <Button 
                asChild 
                className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-md shadow-primary/20"
              >
                <Link to="/signup">
                  <UserPlus className="h-4 w-4" />
                  <span>{t("auth.signUp")}</span>
                </Link>
              </Button>
              
              <LanguageToggle />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Minimal floating header for landing page (/)
  return (
    <TooltipProvider delayDuration={300}>
      <header className="fixed left-0 right-0 z-50 pointer-events-none safe-top">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-end h-16 md:h-20 gap-1.5">
            
            {/* Quick Access Icons Container */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-border/40 shadow-md pointer-events-auto">
              {/* App Store - Coming Soon */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="relative h-8 w-8 rounded-full hover:bg-muted text-foreground"
                    onClick={() => toast("Coming Soon", { 
                      description: "iOS app is coming soon!" 
                    })}
                  >
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>App Store (Coming Soon)</p>
                </TooltipContent>
              </Tooltip>

              {/* Play Store - Coming Soon */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="relative h-8 w-8 rounded-full hover:bg-muted text-foreground"
                    onClick={() => toast("Coming Soon", { 
                      description: "Android app is coming soon!" 
                    })}
                  >
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Play Store (Coming Soon)</p>
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
                  <p>Open Web App</p>
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
