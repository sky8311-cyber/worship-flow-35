import { Database, FileMusic, ListMusic, Users, UserPlus, Download } from "lucide-react";
import { motion } from "framer-motion";
import { revealCard, revealStaggerContainer, revealViewportOptions, revealText } from "@/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";

export const LandingFeatures = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Database,
      title: t("landing.features.items.library.title"),
      description: t("landing.features.items.library.description"),
      subtitle: t("landing.features.items.library.subtitle"),
    },
    {
      icon: FileMusic,
      title: t("landing.features.items.reference.title"),
      description: t("landing.features.items.reference.description"),
      subtitle: t("landing.features.items.reference.subtitle"),
    },
    {
      icon: ListMusic,
      title: t("landing.features.items.setBuilder.title"),
      description: t("landing.features.items.setBuilder.description"),
      subtitle: t("landing.features.items.setBuilder.subtitle"),
    },
    {
      icon: Users,
      title: t("landing.features.items.community.title"),
      description: t("landing.features.items.community.description"),
      subtitle: t("landing.features.items.community.subtitle"),
    },
    {
      icon: UserPlus,
      title: t("landing.features.items.team.title"),
      description: t("landing.features.items.team.description"),
      subtitle: t("landing.features.items.team.subtitle"),
    },
    {
      icon: Download,
      title: t("landing.features.items.export.title"),
      description: t("landing.features.items.export.description"),
      subtitle: t("landing.features.items.export.subtitle"),
    },
  ];

  return (
    <section id="features" className="py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewportOptions}
          variants={revealText}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {t("landing.features.title")}
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewportOptions}
          variants={revealStaggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={revealCard}
              className="group p-8 bg-card border border-border rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                <feature.icon className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ wordBreak: "keep-all" }}>
                {feature.title}
              </h3>
              <p
                className="text-muted-foreground leading-relaxed mb-3"
                style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
              >
                {feature.description}
              </p>
              {feature.subtitle && (
                <p
                  className="text-sm text-primary/80 italic border-l-2 border-primary/30 pl-4"
                  style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
                >
                  {feature.subtitle}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
