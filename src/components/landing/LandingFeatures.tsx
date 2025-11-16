import { Database, FileText, ListOrdered, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, viewportOptions } from "@/lib/animations";

export const LandingFeatures = () => {
  const features = [
    {
      icon: Database,
      title: "Song Database",
      description: "Store your worship songs with keys, language, tempo, themes, and usage history.",
      microcopy: "K곡, 영어곡, 찬송가까지 한 곳에.",
    },
    {
      icon: FileText,
      title: "Score & Chart Uploads",
      description: "Upload score images or files so your team always sees the right version.",
      microcopy: null,
    },
    {
      icon: ListOrdered,
      title: "K-Spirit Set Builder",
      description: "Build K-Spirit worship flows with drag-and-drop sets, key adjustments, and notes like 'soak prayer' or 'call to repentance.'",
      microcopy: null,
    },
    {
      icon: Clock,
      title: "Usage & History",
      description: "See when each song was last used and how often, so you can rotate songs with wisdom.",
      microcopy: null,
    },
  ];

  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
          }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Built on a worship song database.</h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="group p-8 bg-card border border-border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-14 h-14 rounded-lg bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">{feature.description}</p>
              {feature.microcopy && (
                <p className="text-sm text-primary/70 italic">{feature.microcopy}</p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
