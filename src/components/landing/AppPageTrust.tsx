import { motion } from "framer-motion";
import { Users, Heart, Music } from "lucide-react";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";

export const AppPageTrust = () => {
  const stats = [
    {
      icon: Users,
      value: "500+",
      label: "Worship Leaders",
    },
    {
      icon: Music,
      value: "10,000+",
      label: "Sets Created",
    },
    {
      icon: Heart,
      value: "50+",
      label: "Communities",
    },
  ];

  return (
    <section className="py-16 md:py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-4xl mx-auto"
        >
          {/* Stats row */}
          <motion.div
            variants={staggerItem}
            className="grid grid-cols-3 gap-4 md:gap-8 mb-12"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="text-center p-4 md:p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors"
              >
                <stat.icon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonial */}
          <motion.div
            variants={fadeInUp}
            className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-br from-primary/5 via-card to-purple-500/5 border border-border/50 backdrop-blur-sm"
          >
            {/* Quote mark */}
            <div className="absolute -top-4 left-8 text-6xl text-primary/20 font-serif">
              "
            </div>
            
            <blockquote className="text-lg md:text-xl text-foreground/90 italic mb-4 pt-4">
              KWorship has completely transformed how our team prepares for Sunday services. What used to take hours now takes minutes.
            </blockquote>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-semibold">
                J
              </div>
              <div>
                <div className="font-medium text-foreground">
                  Joshua Kim
                </div>
                <div className="text-sm text-muted-foreground">
                  Worship Leader, Grace Community Church
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
