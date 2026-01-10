import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer, staggerItem, scaleIn } from "@/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";

export const AppPageHero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />

      {/* Content */}
      <motion.div
        className="container mx-auto px-4 text-center max-w-md"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={staggerItem} className="mb-8">
          <img
            src="/kworship-icon.png"
            alt="KWorship"
            className="w-16 h-16 mx-auto"
          />
        </motion.div>

        {/* Tagline */}
        <motion.h1
          variants={fadeInUp}
          className="text-2xl sm:text-3xl font-semibold text-foreground mb-8"
        >
          {t("appPage.tagline")}
        </motion.h1>

        {/* CTA Button */}
        <motion.div variants={scaleIn} className="mb-4">
          <Button
            asChild
            size="lg"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            <Link to="/signup">
              {t("appPage.createAccount")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Login link */}
        <motion.p
          variants={fadeInUp}
          className="text-sm text-muted-foreground"
        >
          {t("appPage.alreadyHaveAccount")}{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            {t("appPage.logIn")}
          </Link>
        </motion.p>

        {/* Helper text */}
        <motion.p
          variants={fadeInUp}
          className="mt-8 text-xs text-muted-foreground/70"
        >
          {t("appPage.noCreditCard")}
        </motion.p>
      </motion.div>
    </section>
  );
};
