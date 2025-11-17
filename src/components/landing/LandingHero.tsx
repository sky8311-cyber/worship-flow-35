import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { smoothScrollTo } from "@/lib/smoothScroll";

const mockSongs = [
  { title: "브리지 찬양", key: "G", tags: ["인도", "기쁨"] },
  { title: "회개의 찬양", key: "F", tags: ["회개", "기도"] },
  { title: "메시지 응답", key: "E", tags: ["헌신", "선포"] },
];

export const LandingHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Animated background blobs */}
      <motion.div
        className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center lg:text-left"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              예배의 흐름을 짜는 찬양 콘티,
              <br />
              함께 기록하고 나누는 한국형 워십 도구
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-4 leading-relaxed">
              K-Worship은 예배의 메시지와 흐름을 살리는 찬양 세트(송리스트)를 데이터베이스로 쌓아서,
              워십리더와 팀원, 그리고 다른 찬양 인도자들과 함께 나눌 수 있게 돕는 예배 콘티 플랫폼입니다.
            </p>

            <p className="text-base text-muted-foreground/80 mb-8 italic">
              한 주 한 주 흘려보내던 찬양 콘티를, 이제는 기록하고 공유되는 '예배의 자산'으로 남겨 보세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" onClick={() => smoothScrollTo("waitlist")}>
                얼리 액세스 신청하기
              </Button>
              <Button size="lg" variant="outline" onClick={() => smoothScrollTo("how-it-works")}>
                어떻게 돕나요?
              </Button>
            </div>
          </motion.div>

          {/* Right content - App mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">주일 2부 예배</h3>
                <span className="text-sm text-muted-foreground">2025.11.17</span>
              </div>
              
              <div className="mb-4 p-3 bg-accent/20 rounded-lg">
                <p className="text-sm text-muted-foreground">메시지: 로마서 8장</p>
                <p className="text-sm text-muted-foreground">예배 흐름: 인도 → 회개 → 선포 → 응답</p>
              </div>

              <div className="space-y-3">
                {mockSongs.map((song, index) => (
                  <div
                    key={index}
                    className="p-4 bg-background border border-border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{song.title}</span>
                      <span className="text-sm font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                        Key: {song.key}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {song.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full"
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
