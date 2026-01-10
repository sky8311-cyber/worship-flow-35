import { Link } from "react-router-dom";
import { Home, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";

const Index = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Home */}
            <Button variant="ghost" asChild className="gap-2">
              <Link to="/">
                <Home className="h-4 w-4" />
                <span>{t("common.home")}</span>
              </Link>
            </Button>

            {/* Right side - Auth buttons + Language */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="gap-2">
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  <span>{t("auth.login")}</span>
                </Link>
              </Button>
              
              <Button variant="default" asChild className="gap-2">
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

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">Welcome to KWorship</h1>
          <p className="text-xl text-muted-foreground">Start building your amazing worship sets!</p>
        </div>
      </main>
    </div>
  );
};

export default Index;
