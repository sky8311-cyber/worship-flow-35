import { Heart, Database, GitBranch } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem, viewportOptions } from "@/lib/animations";

export const LandingVision = () => {
  const pillars = [
    {
      icon: Heart,
      title: "K-Spirit Heart",
      description: "Honor the depth and intensity of Korean worship, wherever your church is.",
    },
    {
      icon: Database,
      title: "Database Brain",
      description: "Use structured data—keys, tags, usage history—to make better set decisions.",
    },
    {
      icon: GitBranch,
      title: "Flow & Order",
      description: "Design a spiritual journey, not just a playlist.",
    },
  ];

  return (
    <section id="vision" className="py-24 bg-accent/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">More than a song list.</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            K-Worship helps worship leaders carry K-Spirit—the Korean worship DNA of depth,
            passion, and prayerful flow—while using data and structure to track keys, themes,
            language, and energy. Avoid repeating the same songs every week and intentionally
            shape the flow of your service.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8"
        >
          {pillars.map((pillar, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="group p-8 bg-card border border-border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <pillar.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{pillar.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{pillar.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
