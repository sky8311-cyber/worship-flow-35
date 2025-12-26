import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Globe, Music, Calendar, Users, Heart, Home, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import logo from "@/assets/kworship-logo-mobile.png";

const MobileAppLanding = () => {
  const { t } = useTranslation();

  const handleComingSoon = () => {
    toast.info(t("mobileApp.comingSoonMessage"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated background blobs */}
      <motion.div
        className="absolute top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 -right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl"
        animate={{
          rotate: [0, 360],
        }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating decorative icons */}
      <motion.div
        className="absolute top-24 right-8 md:right-20"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Music className="w-6 h-6 text-primary/30" />
      </motion.div>
      <motion.div
        className="absolute top-40 left-8 md:left-20"
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Heart className="w-5 h-5 text-accent/30" />
      </motion.div>
      <motion.div
        className="absolute bottom-32 right-12"
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Calendar className="w-5 h-5 text-primary/25" />
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center max-w-md w-full"
      >
        {/* Logo */}
        <motion.div variants={staggerItem} className="mb-6">
          <img 
            src={logo} 
            alt="K-Worship Logo" 
            className="h-16 md:h-20 w-auto drop-shadow-lg"
          />
        </motion.div>

        {/* Title & Tagline */}
        <motion.h1 
          variants={staggerItem}
          className="text-3xl md:text-4xl font-bold mb-2 text-center"
        >
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("mobileApp.title")}
          </span>
        </motion.h1>
        <motion.p 
          variants={staggerItem}
          className="text-lg md:text-xl font-medium mb-3 text-center bg-gradient-to-r from-primary/80 to-accent/80 bg-clip-text text-transparent"
        >
          {t("mobileApp.tagline")}
        </motion.p>
        <motion.p 
          variants={staggerItem}
          className="text-muted-foreground text-center max-w-sm mb-8"
        >
          {t("mobileApp.description")}
        </motion.p>

        {/* iPhone Mockup */}
        <motion.div 
          variants={staggerItem}
          className="relative mb-8"
        >
          {/* Phone Frame */}
          <div className="relative w-56 md:w-64 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
            {/* Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-black rounded-full z-20" />
            
            {/* Screen */}
            <div className="w-full aspect-[9/19] bg-background rounded-[2rem] overflow-hidden relative">
              {/* Status bar */}
              <div className="h-8 bg-card/50 flex items-center justify-between px-6 pt-1">
                <span className="text-[10px] font-medium text-foreground/70">9:41</span>
                <div className="flex gap-1">
                  <div className="w-3 h-2 border border-foreground/50 rounded-sm">
                    <div className="w-2 h-1 bg-foreground/50 rounded-sm m-[1px]" />
                  </div>
                </div>
              </div>
              
              {/* App Content Mockup */}
              <div className="p-3 space-y-2">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <img src={logo} alt="K-Worship" className="h-5 w-auto" />
                </div>
                
                {/* Worship Set Cards */}
                <motion.div 
                  className="bg-card p-2.5 rounded-xl border border-border/50 shadow-sm"
                  animate={{ opacity: [0.9, 1, 0.9] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Music className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-foreground">주일예배</p>
                      <p className="text-[9px] text-muted-foreground">3곡 · 1월 26일</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                </motion.div>
                
                <div className="bg-card p-2.5 rounded-xl border border-border/50 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-foreground">수요예배</p>
                      <p className="text-[9px] text-muted-foreground">2곡 · 1월 29일</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-2.5 rounded-xl border border-border/50 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-foreground">청년예배</p>
                      <p className="text-[9px] text-muted-foreground">4곡 · 2월 2일</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Navigation Mock - matches actual app */}
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-card/80 backdrop-blur-sm border-t border-border/30 flex items-center justify-around px-3">
                <div className="flex flex-col items-center">
                  <Home className="w-3 h-3 text-primary" />
                </div>
                <div className="flex flex-col items-center">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-center">
                  <Music className="w-3 h-3 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-center">
                  <Users className="w-3 h-3 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-center">
                  <MessageCircle className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Phone Shadow */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/15 blur-xl rounded-full" />
        </motion.div>

        {/* App Store Buttons */}
        <motion.div 
          variants={staggerItem}
          className="flex flex-col gap-3 w-full max-w-xs mb-6"
        >
          <Button 
            size="lg" 
            className="w-full gap-3 h-14 text-base bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            onClick={handleComingSoon}
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="flex flex-col items-start">
              <span className="text-[10px] opacity-70">{t("mobileApp.comingSoon")}</span>
              <span className="font-semibold">{t("mobileApp.downloadIos")}</span>
            </div>
          </Button>

          <Button 
            variant="outline" 
            size="lg" 
            className="w-full gap-3 h-14 text-base border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/50 hover:bg-primary/5"
            onClick={handleComingSoon}
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
            </svg>
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-muted-foreground">{t("mobileApp.comingSoon")}</span>
              <span className="font-semibold">{t("mobileApp.downloadAndroid")}</span>
            </div>
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div 
          variants={staggerItem}
          className="flex items-center gap-4 w-full max-w-xs mb-6"
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-sm text-muted-foreground">{t("mobileApp.orDivider")}</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </motion.div>

        {/* Web Version Button */}
        <motion.div variants={staggerItem} className="w-full max-w-xs">
          <Link to="/" className="block">
            <Button 
              size="lg" 
              className="w-full gap-2 h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-lg"
            >
              <Globe className="w-5 h-5" />
              {t("mobileApp.webVersion")}
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MobileAppLanding;
