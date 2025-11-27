import { Users, Database, Network } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, viewportOptions } from "@/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";

export const LandingIntro = () => {
  const { t } = useTranslation();

  const pillars = [
    {
      icon: Users,
      title: t("landing.intro.pillars.community.title"),
      description: t("landing.intro.pillars.community.description"),
    },
    {
      icon: Database,
      title: t("landing.intro.pillars.library.title"),
      description: t("landing.intro.pillars.library.description"),
    },
    {
      icon: Network,
      title: t("landing.intro.pillars.network.title"),
      description: t("landing.intro.pillars.network.description"),
    },
  ];

  return (
    <section id="intro" className="py-32 bg-accent/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={{
            hidden: {
              opacity: 0,
              y: 30
            },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.6
              }
            }
          }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            {t("landing.intro.title1")}
            <br />
            {t("landing.intro.title2")}
          </h2>
          <div className="text-lg md:text-xl text-muted-foreground leading-relaxed space-y-4">
            <p>
              {t("landing.intro.description1")}
              <br />
              {t("landing.intro.description1b")}
            </p>
            <p>
              {t("landing.intro.description2")}
              <br />
              {t("landing.intro.description2b")}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {pillars.map((pillar, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="group p-8 bg-card border border-border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                <pillar.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{pillar.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{pillar.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
