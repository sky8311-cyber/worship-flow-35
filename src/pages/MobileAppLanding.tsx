import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Globe, Smartphone } from "lucide-react";
import { toast } from "sonner";

const MobileAppLanding = () => {
  const { t } = useTranslation();

  const handleComingSoon = () => {
    toast.info(t("mobileApp.comingSoonMessage"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="mb-6">
        <img 
          src="/lovable-uploads/b1ee6a34-3724-490b-be02-b22f5ca7e839.png" 
          alt="K-Worship Logo" 
          className="h-20 w-auto"
        />
      </div>

      {/* Title & Tagline */}
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-center">
        {t("mobileApp.title")}
      </h1>
      <p className="text-lg md:text-xl text-primary font-medium mb-4 text-center">
        {t("mobileApp.tagline")}
      </p>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        {t("mobileApp.description")}
      </p>

      {/* App Preview Placeholder */}
      <div className="w-full max-w-xs bg-card border border-border rounded-3xl p-4 mb-8 shadow-lg">
        <div className="aspect-[9/16] bg-muted rounded-2xl flex items-center justify-center">
          <Smartphone className="w-16 h-16 text-muted-foreground/50" />
        </div>
      </div>

      {/* App Store Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs mb-6">
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full gap-3 h-14 text-base"
          onClick={handleComingSoon}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground">{t("mobileApp.comingSoon")}</span>
            <span className="font-semibold">{t("mobileApp.downloadIos")}</span>
          </div>
        </Button>

        <Button 
          variant="outline" 
          size="lg" 
          className="w-full gap-3 h-14 text-base"
          onClick={handleComingSoon}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
          </svg>
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground">{t("mobileApp.comingSoon")}</span>
            <span className="font-semibold">{t("mobileApp.downloadAndroid")}</span>
          </div>
        </Button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 w-full max-w-xs mb-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground">{t("mobileApp.orDivider")}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Web Version Button */}
      <Link to="/" className="w-full max-w-xs">
        <Button variant="default" size="lg" className="w-full gap-2 h-12">
          <Globe className="w-5 h-5" />
          {t("mobileApp.webVersion")}
        </Button>
      </Link>
    </div>
  );
};

export default MobileAppLanding;
