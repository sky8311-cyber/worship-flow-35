import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import { FullScreenLoader } from "@/components/layout/FullScreenLoader";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import logo from "@/assets/kworship-logo-mobile.png";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { ScrollFeatureSection } from "@/components/landing/ScrollFeatureSection";
import { useTranslation } from "@/hooks/useTranslation";
import { SEOHead } from "@/components/seo/SEOHead";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MobileAppLanding = () => {
  const { t, language } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) navigate("/dashboard", { replace: true });
    else navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  if (loading) {
    return <FullScreenLoader label="Loading…" />;
  }

  return (
    <>
      <SEOHead
        title="K-Worship - Worship Team Management Platform"
        titleKo="K-Worship - 예배팀을 위한 통합 플랫폼"
        description="All-in-one worship team management platform. Song library, setlist creation, real-time team collaboration, and sheet music sharing."
        descriptionKo="예배팀을 위한 통합 관리 플랫폼. 곡 라이브러리, 콘티 제작, 실시간 팀 협업, 악보 공유를 한곳에서."
        keywords="K-Worship, worship, church, setlist, worship leader, praise, CCM, sheet music, team collaboration"
        keywordsKo="K-Worship, 케이워십, 예배, 찬양, 워십, 콘티, 세트리스트, 찬양팀, 예배 인도자, 교회, 악보"
        canonicalPath="/"
      />
      <LandingNav />
      {/* Hero Section with Logo */}
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
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex flex-col items-center max-w-md w-full text-center"
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
            className="text-3xl md:text-4xl font-bold mb-2"
          >
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("mobileApp.title")}
            </span>
          </motion.h1>
          <motion.p 
            variants={staggerItem}
            className="text-lg md:text-xl font-medium mb-3 bg-gradient-to-r from-primary/80 to-accent/80 bg-clip-text text-transparent"
          >
            {t("mobileApp.tagline")}
          </motion.p>
          <motion.p 
            variants={staggerItem}
            className="text-muted-foreground max-w-sm mb-12"
          >
            {t("mobileApp.description")}
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            variants={staggerItem}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-sm text-muted-foreground">
              {language === "ko" ? "스크롤하여 더 보기" : "Scroll to explore"}
            </span>
            <motion.div
              className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-1.5 h-3 bg-muted-foreground/50 rounded-full mt-2"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
          </motion.div>

          {/* Access Buttons */}
          <motion.div
            variants={staggerItem}
            className="flex flex-col sm:flex-row items-center gap-3 mt-6 w-full"
          >
            <Button
              variant="outline"
              className="gap-2 opacity-70 w-full sm:w-auto"
              onClick={() => toast.info(t("mobileApp.comingSoonMessage"))}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              iOS App
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 text-white rounded-full leading-none">
                Coming Soon
              </span>
            </Button>

            <Button
              variant="outline"
              className="gap-2 opacity-70 w-full sm:w-auto"
              onClick={() => toast.info(t("mobileApp.comingSoonMessage"))}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              Android
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 text-white rounded-full leading-none">
                Coming Soon
              </span>
            </Button>

            <Button
              className="gap-2 w-full sm:w-auto"
              onClick={() => navigate("/login")}
            >
              <Globe className="w-4 h-4" />
              {language === "ko" ? "Web App 시작하기" : "Open Web App"}
            </Button>
          </motion.div>
        </motion.div>
        </motion.div>
      </div>

      {/* Scroll-driven Feature Section */}
      <ScrollFeatureSection />
      
      <LandingFooter />
    </>
  );
};

export default MobileAppLanding;
