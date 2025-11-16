import { Library, Filter, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, viewportOptions } from "@/lib/animations";

export const LandingHowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: Library,
      title: "Build your K-Worship Library",
      description: "Add songs with Korean/English titles, keys, tags, and K-Spirit notes.",
    },
    {
      number: 2,
      icon: Filter,
      title: "Shape your set with data",
      description: "Filter by key, theme, or energy. See last used dates and build a flow that fits the message.",
    },
    {
      number: 3,
      icon: Share2,
      title: "Share with your team",
      description: "Share a clean view with charts, keys, and YouTube links so everyone is aligned.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-accent/5">
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
          <h2 className="text-4xl md:text-5xl font-bold mb-6">From database to worship flow.</h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />

            <div className="space-y-12">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  variants={staggerItem}
                  className={`flex flex-col md:flex-row items-center gap-8 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <div className={`inline-block p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 ${index % 2 === 0 ? "md:ml-auto" : "md:mr-auto"}`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <step.icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </div>

                  {/* Step Number Badge */}
                  <div className="relative z-10 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">
                    {step.number}
                  </div>

                  {/* Spacer for alignment */}
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
