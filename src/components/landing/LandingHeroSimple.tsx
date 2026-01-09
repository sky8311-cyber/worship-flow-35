import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Music, FileText, Users } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export const LandingHeroSimple = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Music, title: t("auth.loginPage.features.library.title") },
    { icon: FileText, title: t("auth.loginPage.features.setBuilder.title") },
    { icon: Users, title: t("auth.loginPage.features.community.title") },
  ];

  return (
    <section className="pt-28 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge + Gradient Headline */}
          <motion.div
            {...fadeInUp}
            className="flex flex-wrap items-center justify-center gap-3 mb-6"
          >
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {t("auth.loginPage.headline")}
            </h1>
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {t("auth.loginPage.badge")}
            </Badge>
          </motion.div>

          {/* Main Headline */}
          <motion.h2
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6"
          >
            {t("auth.loginPage.subheadline")}
          </motion.h2>

          {/* Description */}
          <motion.p
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            {t("auth.loginPage.description")}
          </motion.p>

          {/* Features */}
          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10"
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-card/50 rounded-full border border-border/50"
              >
                <feature.icon className="h-5 w-5 text-primary" />
                <span className="text-sm md:text-base text-foreground">{feature.title}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/signup">{t("landing.nav.signup")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/login">{t("landing.nav.login")}</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
