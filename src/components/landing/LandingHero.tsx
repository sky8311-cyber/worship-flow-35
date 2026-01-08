import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { revealText, revealCard, revealStaggerContainer, revealViewportOptions } from "@/lib/animations";
import { smoothScrollTo } from "@/lib/smoothScroll";
import { Play, Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export const LandingHero = () => {
  const { t } = useTranslation();

  const badges = [
    t("landing.hero.badges.allInOne"),
    t("landing.hero.badges.officialLaunch"),
    t("landing.hero.badges.multiCommunity"),
    t("landing.hero.badges.bilingual"),
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Animated background blobs */}
      <motion.div
        className="absolute top-20 -left-20 sm:left-10 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 -right-20 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-accent/10 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={revealStaggerContainer}
          className="max-w-5xl mx-auto text-center"
        >
          {/* Badge row */}
          <motion.div 
            variants={revealText}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {badges.map((badge, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-full border border-primary/20"
              >
                <Sparkles className="w-3 h-3" />
                {badge}
              </span>
            ))}
          </motion.div>

          {/* Main headline */}
          <motion.h1 
            variants={revealText}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight" 
            style={{ wordBreak: "keep-all" }}
          >
            <span className="text-foreground">
              {t("landing.hero.headline")}
            </span>
          </motion.h1>
          
          {/* Sub badges */}
          <motion.p 
            variants={revealText}
            className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed" 
            style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
          >
            {t("landing.hero.subheadline")}
          </motion.p>

          {/* Tagline */}
          <motion.p 
            variants={revealText}
            className="text-base md:text-lg text-muted-foreground/80 mb-10 max-w-2xl mx-auto" 
            style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
          >
            {t("landing.hero.tagline")}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={revealText} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              onClick={() => smoothScrollTo("cta")} 
              className="text-base px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
            >
              {t("landing.hero.ctaButton")}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => smoothScrollTo("features")} 
              className="text-base px-8 py-6"
            >
              {t("landing.hero.learnMore")}
            </Button>
          </motion.div>

          {/* Video Placeholder */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={revealViewportOptions}
            variants={revealCard}
            className="relative max-w-4xl mx-auto"
          >
            <div className="relative aspect-video bg-gradient-to-br from-muted/50 to-muted rounded-2xl border border-border overflow-hidden shadow-2xl group cursor-pointer hover:border-primary/30 transition-all">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground ml-1" />
                </div>
              </div>

              {/* Video placeholder text */}
              <div className="absolute bottom-6 left-6 right-6 text-left">
                <p className="text-sm text-muted-foreground mb-1">{t("landing.hero.videoLabel")}</p>
                <p className="text-lg font-semibold text-foreground">{t("landing.hero.videoTitle")}</p>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
