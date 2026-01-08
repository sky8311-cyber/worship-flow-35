import { Clock, Archive, Link2, Focus } from "lucide-react";
import { motion } from "framer-motion";
import { revealCard, revealStaggerContainer, revealViewportOptions, revealText } from "@/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";

export const LandingIntro = () => {
  const { t } = useTranslation();

  const valueProps = [
    {
      icon: Clock,
      title: t("landing.value.items.time.title"),
      description: t("landing.value.items.time.description"),
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Archive,
      title: t("landing.value.items.collect.title"),
      description: t("landing.value.items.collect.description"),
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Link2,
      title: t("landing.value.items.connect.title"),
      description: t("landing.value.items.connect.description"),
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Focus,
      title: t("landing.value.items.focus.title"),
      description: t("landing.value.items.focus.description"),
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <section id="intro" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewportOptions}
          variants={revealText}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight" style={{ wordBreak: "keep-all" }}>
            {t("landing.value.headline")}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground" style={{ wordBreak: "keep-all" }}>
            {t("landing.value.subheadline")}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewportOptions}
          variants={revealStaggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
        >
          {valueProps.map((prop, index) => (
            <motion.div
              key={index}
              variants={revealCard}
              className="group relative p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-2"
            >
              <div className={`w-14 h-14 rounded-xl ${prop.bgColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <prop.icon className={`w-7 h-7 ${prop.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-3" style={{ wordBreak: "keep-all" }}>
                {prop.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed" style={{ wordBreak: "keep-all" }}>
                {prop.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
