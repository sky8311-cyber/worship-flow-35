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
      size: "large",
    },
    {
      icon: FileMusic,
      title: t("landing.features.items.reference.title"),
      description: t("landing.features.items.reference.description"),
      size: "normal",
    },
    {
      icon: ListMusic,
      title: t("landing.features.items.setBuilder.title"),
      description: t("landing.features.items.setBuilder.description"),
      size: "normal",
    },
    {
      icon: Users,
      title: t("landing.features.items.community.title"),
      description: t("landing.features.items.community.description"),
      size: "large",
    },
    {
      icon: UserPlus,
      title: t("landing.features.items.team.title"),
      description: t("landing.features.items.team.description"),
      size: "normal",
    },
    {
      icon: Download,
      title: t("landing.features.items.export.title"),
      description: t("landing.features.items.export.description"),
      size: "normal",
    },
  ];

  return (
    <section id="features" className="py-24 md:py-32 bg-muted/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewportOptions}
          variants={revealText}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6" style={{ wordBreak: "keep-all" }}>
            {t("landing.features.title")}
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewportOptions}
          variants={revealStaggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={revealCard}
              className={`group relative p-6 md:p-8 bg-card border border-border rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 ${
                feature.size === "large" ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3" style={{ wordBreak: "keep-all" }}>
                {feature.title}
              </h3>
              <p
                className="text-muted-foreground text-sm leading-relaxed"
                style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
