import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { revealOnScroll, revealViewportOptions } from "@/lib/animations";

export const LandingCTA = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          {...revealOnScroll}
          viewport={revealViewportOptions}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Gradient Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight bg-gradient-primary bg-clip-text text-transparent">
            {t("landing.cta.title")}
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            {t("landing.cta.description")}
          </p>
          
          {/* CTA Button */}
          <Button asChild size="lg" className="mb-4">
            <Link to="/signup">{t("landing.cta.ctaButton")}</Link>
          </Button>
          
          {/* Login Link */}
          <p className="text-muted-foreground">
            {t("landing.cta.hasAccount")}{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              {t("landing.nav.login")}
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
