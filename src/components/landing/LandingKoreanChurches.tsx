import { motion } from "framer-motion";
import { fadeInUp, viewportOptions } from "@/lib/animations";
import { Globe, Languages, Tag } from "lucide-react";

export const LandingKoreanChurches = () => {
  return (
    <section id="korean-churches" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">K-Spirit for every context.</h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOptions}
            variants={fadeInUp}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <p className="text-lg">Designed for Korean, bilingual, and global churches.</p>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Languages className="w-5 h-5 text-primary" />
                </div>
                <p className="text-lg">Mix Korean and English songs in one database.</p>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <p className="text-lg">Tag songs by language, season, and K-Spirit themes.</p>
              </div>
            </div>

            <p className="text-sm text-primary/70 italic pt-4">
              이민교회, 다국적 공동체, 온라인 예배까지 한 흐름으로.
            </p>
          </motion.div>

          {/* Right Content - Mock Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOptions}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-card border border-border rounded-xl shadow-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h3 className="text-lg font-semibold">Mixed Language Set</h3>
                <span className="text-xs text-muted-foreground">Bilingual Service</span>
              </div>

              <div className="space-y-3">
                {mockBilingualSongs.map((song, index) => (
                  <div
                    key={index}
                    className="p-3 bg-accent/10 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{song.title}</p>
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {song.language}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {song.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const mockBilingualSongs = [
  { title: "주 이름 높이며", language: "Korean", tags: ["K-Spirit high", "Opening"] },
  { title: "Way Maker", language: "English", tags: ["Prayer", "Mid-tempo"] },
  { title: "은혜", language: "Korean", tags: ["K-Spirit", "Soft ending"] },
  { title: "How Great Thou Art", language: "English", tags: ["Hymn", "Classic"] },
];
