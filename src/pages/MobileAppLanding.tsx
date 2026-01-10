import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FullScreenLoader } from "@/components/layout/FullScreenLoader";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import logo from "@/assets/kworship-logo-mobile.png";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { ScrollFeatureSection } from "@/components/landing/ScrollFeatureSection";
import { useTranslation } from "@/hooks/useTranslation";

const MobileAppLanding = () => {
  const { t, language } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <FullScreenLoader label="Loading…" />;
  }

  return (
    <>
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
