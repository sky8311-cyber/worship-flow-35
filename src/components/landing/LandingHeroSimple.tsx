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
  const { t, language } = useTranslation();

  const features = [
    { 
      icon: Music, 
      title: t("auth.loginPage.features.library.title"),
      description: t("auth.loginPage.features.library.description")
    },
    { 
      icon: FileText, 
      title: t("auth.loginPage.features.setBuilder.title"),
      description: t("auth.loginPage.features.setBuilder.description")
    },
    { 
      icon: Users, 
      title: t("auth.loginPage.features.community.title"),
      description: t("auth.loginPage.features.community.description")
    },
  ];

  return (
    <section className="pt-28 pb-16 md:pt-32 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="max-w-xl">
          {/* Gradient Headline + Badge */}
          <motion.div
            {...fadeInUp}
            className="flex flex-wrap items-center gap-3 mb-4"
          >
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
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
            className="text-2xl md:text-3xl font-bold text-foreground mb-4"
          >
            {t("auth.loginPage.subheadline")}
          </motion.h2>

          {/* Description */}
          <motion.p
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground mb-8"
          >
            {t("auth.loginPage.description")}
          </motion.p>

          {/* Feature Cards with Icons and Descriptions */}
          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-5"
          >
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap gap-3 mt-8"
          >
            <Button asChild>
              <Link to="/signup">
                {language === "ko" ? "무료로 시작하기" : "Get started free"}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/demo">
                {language === "ko" ? "🎵 데모 써보기" : "🎵 Try Demo"}
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
