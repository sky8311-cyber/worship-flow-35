import { Button } from "@/components/ui/button";
import { smoothScrollTo } from "@/lib/smoothScroll";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { Music, Tag, Calendar } from "lucide-react";

export const LandingHero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                K-Spirit powered,
              </span>
              <br />
              data-shaped worship sets.
            </h1>

            <h2 className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              K-Worship helps you design worship flows with Korean worship DNA,
              built on a smart song database with keys, charts, tags, and history.
            </h2>

            <p className="text-sm text-muted-foreground italic">
              감동만이 아니라, 데이터로 준비하는 예배 세트.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => smoothScrollTo("waitlist")}
                className="text-base"
              >
                Join the early access list
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => smoothScrollTo("how-it-works")}
              >
                See how it works
              </Button>
            </div>
          </motion.div>

          {/* Right Content - App Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <h3 className="text-xl font-semibold">Sunday 11 AM Service</h3>
                  <p className="text-sm text-muted-foreground">March 17, 2024</p>
                </div>
                <div className="text-sm text-muted-foreground">7 songs</div>
              </div>

              <div className="space-y-3">
                {mockSongs.map((song, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {song.titleKr}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Music className="w-3 h-3" />
                        <span className="font-mono">{song.key}</span>
                      </div>
                      {song.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-4 text-xs text-muted-foreground border-t border-border">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Last used · 3 weeks ago</span>
                </div>
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Used 12 times this year</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const mockSongs = [
  { title: "Praise the Name of Jesus", titleKr: "주 이름 높이며", key: "G", tags: ["K-Spirit"] },
  { title: "Spirit Move", titleKr: "성령이여 임하소서", key: "A", tags: ["Prayer"] },
  { title: "Here I Am to Worship", titleKr: "경배하러 왔습니다", key: "D", tags: ["Worship"] },
  { title: "Way Maker", titleKr: "길 만드시는 분", key: "C", tags: ["High energy"] },
];
