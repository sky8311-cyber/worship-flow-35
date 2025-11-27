import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeInUp, viewportOptions } from "@/lib/animations";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";

export const LandingBetaCTA = () => {
  const { t } = useTranslation();

  return (
    <section id="beta-cta" className="py-32 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={fadeInUp}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Beta badge */}
          <div className="flex justify-center mb-6">
            <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 text-sm">
              {t("landing.betaCta.badge")}
            </Badge>
          </div>

          {/* Headline */}
          <h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight" 
            style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
          >
            {t("landing.betaCta.title")}
          </h2>

          {/* Subtext */}
          <p 
            className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto" 
            style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
          >
            {t("landing.betaCta.description")}
          </p>

          {/* CTA button */}
          <Button 
            asChild 
            size="lg" 
            className="text-base px-12 py-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          >
            <Link to="/signup">
              {t("landing.betaCta.ctaButton")}
            </Link>
          </Button>

          {/* Supporting text */}
          <p className="text-xs md:text-sm text-muted-foreground mt-6">
            {t("landing.betaCta.hasAccount")}{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              {t("landing.betaCta.login")}
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
