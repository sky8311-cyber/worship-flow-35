import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { revealText, revealViewportOptions } from "@/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";
import { Users, Church, Music } from "lucide-react";

const AnimatedCounter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration });
    return controls.stop;
  }, [value, duration, count]);

  return <motion.span>{rounded}</motion.span>;
};

export const LandingTrustBar = () => {
  const { t } = useTranslation();

  const stats = [
    {
      icon: Users,
      value: 150,
      suffix: "+",
      label: t("landing.trust.leaders"),
    },
    {
      icon: Church,
      value: 45,
      suffix: "+",
      label: t("landing.trust.communities"),
    },
    {
      icon: Music,
      value: 2500,
      suffix: "+",
      label: t("landing.trust.songs"),
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewportOptions}
          variants={revealText}
          className="text-center mb-8"
        >
          <p className="text-sm md:text-base text-muted-foreground font-medium uppercase tracking-wider">
            {t("landing.trust.title")}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewportOptions}
          variants={revealText}
          className="flex flex-wrap justify-center gap-8 md:gap-16"
        >
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  <AnimatedCounter value={stat.value} />
                  {stat.suffix}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
