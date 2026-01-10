import { motion, AnimatePresence, Variants } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

interface FeatureCaptionProps {
  titleKo: string;
  titleEn: string;
  subtitleKo: string;
  subtitleEn: string;
  highlighted?: boolean;
  isVisible: boolean;
}

// Safe animation variant without clipPath (iOS Safari compatible)
const safeTextReveal: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const }
  }
};

export const FeatureCaption = ({ 
  titleKo, 
  titleEn, 
  subtitleKo, 
  subtitleEn, 
  highlighted = false,
  isVisible 
}: FeatureCaptionProps) => {
  const { language } = useTranslation();
  const title = language === "ko" ? titleKo : titleEn;
  const subtitle = language === "ko" ? subtitleKo : subtitleEn;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={title}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: { 
                duration: 0.5, 
                ease: [0.35, 0.35, 0, 1],
                staggerChildren: 0.1
              }
            }
          }}
          className="text-center space-y-2"
        >
          <motion.h2 
            className={`text-xl md:text-2xl lg:text-3xl font-bold leading-tight ${
              highlighted 
                ? "bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent" 
                : "text-foreground"
            }`}
            variants={safeTextReveal}
          >
            {title}
            {highlighted && <span className="ml-2">✨</span>}
          </motion.h2>
          <motion.p 
            className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-sm md:max-w-md mx-auto"
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: { delay: 0.1, duration: 0.4 }
              }
            }}
          >
            {subtitle}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
