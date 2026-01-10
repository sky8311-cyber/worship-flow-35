import { useRef, useMemo } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { PhoneMockupAnimated, ScreenWrapper } from "./PhoneMockupAnimated";
import { DesktopMockupAnimated } from "./DesktopMockupAnimated";
import { FeatureCaption } from "./FeatureCaption";
import { screens, DesktopDashboardScreen } from "./MockupScreenContent";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";

export const ScrollFeatureSection = () => {
  const { t, language } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [showDesktop, setShowDesktop] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Spring config for smooth animations
  const springConfig = { stiffness: 100, damping: 30, mass: 1 };

  // Phone transformations
  const phoneScale = useTransform(scrollYProgress, 
    [0, 0.15, 0.25, 0.55, 0.7], 
    [1, 1, 1.4, 1.4, 0.7]
  );
  const smoothPhoneScale = useSpring(phoneScale, springConfig);

  const phoneX = useTransform(scrollYProgress,
    [0.55, 0.7],
    ["0%", "-40%"]
  );
  const smoothPhoneX = useSpring(phoneX, springConfig);

  const phoneOpacity = useTransform(scrollYProgress,
    [0.7, 0.85],
    [1, 0]
  );

  // Desktop transformations
  const desktopOpacity = useTransform(scrollYProgress,
    [0.55, 0.7],
    [0, 1]
  );
  const smoothDesktopOpacity = useSpring(desktopOpacity, springConfig);

  const desktopScale = useTransform(scrollYProgress,
    [0.55, 0.7],
    [0.8, 1]
  );
  const smoothDesktopScale = useSpring(desktopScale, springConfig);

  const desktopX = useTransform(scrollYProgress,
    [0.55, 0.7],
    ["20%", "0%"]
  );
  const smoothDesktopX = useSpring(desktopX, springConfig);

  // CTA transformations
  const ctaOpacity = useTransform(scrollYProgress,
    [0.8, 0.9],
    [0, 1]
  );
  const smoothCtaOpacity = useSpring(ctaOpacity, springConfig);

  const ctaY = useTransform(scrollYProgress,
    [0.8, 0.9],
    [50, 0]
  );
  const smoothCtaY = useSpring(ctaY, springConfig);

  // Caption visibility based on scroll
  const captionProgress = useTransform(scrollYProgress, [0, 0.7], [0, 1]);

  // Update screen index based on scroll
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.15) {
      setCurrentScreenIndex(0);
    } else if (latest < 0.30) {
      setCurrentScreenIndex(1);
    } else if (latest < 0.45) {
      setCurrentScreenIndex(2);
    } else if (latest < 0.60) {
      setCurrentScreenIndex(3);
    }
    
    setShowDesktop(latest > 0.55);
    setShowCTA(latest > 0.8);
  });

  const handleComingSoon = () => {
    toast.info(t("mobileApp.comingSoonMessage"));
  };

  const currentScreen = screens[currentScreenIndex];
  const CurrentScreenComponent = currentScreen.component;

  return (
    <div ref={containerRef} className="relative h-[500vh]">
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        
        {/* Animated background blobs */}
        <motion.div
          className="absolute top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Device Mockups Container - hide when CTA visible to prevent overlap */}
        {!showCTA && (
          <div className="relative z-10 flex items-center justify-center gap-4 md:gap-8">
            {/* Phone Mockup */}
            <PhoneMockupAnimated 
              style={{ 
                scale: smoothPhoneScale, 
                x: smoothPhoneX,
                opacity: phoneOpacity
              }}
            >
              <ScreenWrapper screenKey={currentScreenIndex}>
                <CurrentScreenComponent />
              </ScreenWrapper>
            </PhoneMockupAnimated>

            {/* Desktop Mockup - visible on all devices */}
            {showDesktop && (
              <DesktopMockupAnimated
                style={{
                  opacity: smoothDesktopOpacity,
                  scale: smoothDesktopScale,
                  x: smoothDesktopX
                }}
                className="scale-[0.55] md:scale-100 -ml-8 md:ml-0"
              >
                <DesktopDashboardScreen />
              </DesktopMockupAnimated>
            )}
          </div>
        )}

        {/* Feature Caption - increased spacing from mockup */}
        <div className="absolute bottom-16 md:bottom-28 left-0 right-0 px-4">
          <FeatureCaption
            titleKo={currentScreen.titleKo}
            titleEn={currentScreen.titleEn}
            subtitleKo={currentScreen.subtitleKo}
            subtitleEn={currentScreen.subtitleEn}
            highlighted={currentScreen.highlighted}
            isVisible={!showCTA}
          />
        </div>

        {/* Device indicator text */}
        {showDesktop && !showCTA && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-24 text-sm text-muted-foreground"
          >
            {language === "ko" ? "모든 디바이스에서 사용 가능" : "Available on all devices"}
          </motion.p>
        )}

        {/* CTA Section */}
        {showCTA && (
          <motion.div
            style={{ opacity: smoothCtaOpacity, y: smoothCtaY }}
            className="absolute bottom-16 md:bottom-24 left-0 right-0 px-4 flex flex-col items-center gap-4"
          >
            <h2 className="text-xl md:text-2xl font-bold text-center">
              {language === "ko" ? "지금 시작하세요" : "Get Started Today"}
            </h2>
            
            {/* Store Buttons - unified grid layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
              {/* App Store Button with Coming Soon badge */}
              <Button 
                size="lg" 
                className="relative w-full gap-2 h-14 rounded-full text-base font-semibold bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                onClick={handleComingSoon}
              >
                <span className="absolute -top-2 -right-1 px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full shadow-sm">
                  Coming Soon
                </span>
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span>{t("mobileApp.downloadIos")}</span>
              </Button>

              {/* Play Store Button with Coming Soon badge */}
              <Button 
                size="lg" 
                className="relative w-full gap-2 h-14 rounded-full text-base font-semibold bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                onClick={handleComingSoon}
              >
                <span className="absolute -top-2 -right-1 px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full shadow-sm">
                  Coming Soon
                </span>
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <span>{t("mobileApp.downloadAndroid")}</span>
              </Button>
            </div>

            {/* Web Version Button - identical styling */}
            <Link to="/app" className="w-full max-w-md">
              <Button 
                size="lg" 
                className="w-full gap-2 h-14 rounded-full text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg"
              >
                <Globe className="w-5 h-5 shrink-0" />
                {t("mobileApp.webVersion")}
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Scroll indicator (only at top) */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 1 }}
          style={{ 
            opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0])
          }}
        >
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
      </div>
    </div>
  );
};
