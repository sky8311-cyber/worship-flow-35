import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { smoothScrollTo } from "@/lib/smoothScroll";
import { Music2, Youtube, FileText, ChevronRight } from "lucide-react";

const mockSongs = [
  {
    title: "나의 하나님",
    key: "G",
    tags: ["인도", "기쁨"],
  },
  {
    title: "주님의 마음",
    key: "F",
    tags: ["회개", "경배"],
  },
  {
    title: "선포합니다",
    key: "E",
    tags: ["선포", "응답"],
  },
];

export const LandingHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Animated background blobs */}
      <motion.div
        className="absolute top-20 -left-20 sm:left-10 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl"
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
        className="absolute bottom-20 -right-20 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-accent/10 rounded-full blur-3xl"
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

      <div className="container mx-auto px-4 py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="text-center lg:text-left">
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight" 
              style={{ wordBreak: "keep-all" }}
            >
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                예배 공동체를 위한
              </span>
              <br />
              <span className="text-foreground">통합 플랫폼</span>
            </h1>
            
            <p 
              className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 leading-relaxed" 
              style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
            >
              K-Worship은 찬양 송리스트(콘티), 곡 라이브러리, 워십리더 커뮤니티를 한 곳에서 관리하고 나눌 수 있는 예배 준비 올인원 앱입니다.
            </p>

            <p 
              className="text-sm md:text-base lg:text-lg text-muted-foreground/80 mb-10 leading-relaxed" 
              style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
            >
              사용했던 곡과 악보, 예배 흐름을 저장하고, 다른 예배 인도자와 팀원들과 자연스럽게 공유해 보세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                onClick={() => smoothScrollTo("beta-cta")} 
                className="text-base px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                베타 가입하기
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => smoothScrollTo("how-it-works")} 
                className="text-base px-8 py-6"
              >
                어떻게 돕나요?
              </Button>
            </div>
          </motion.div>

          {/* Right content - Real worship set preview */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-card border border-border rounded-lg shadow-lg p-4 md:p-5">
              {/* Set header */}
              <div className="mb-4 pb-4 border-b border-border">
                <div className="flex items-start gap-3">
                  {/* Calendar date box - matching dashboard style */}
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
                    <span className="text-xs font-medium">Nov</span>
                    <span className="text-lg font-bold">17</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-semibold">주일 2부 예배</h3>
                    <p className="text-xs text-muted-foreground">서울한빛교회</p>
                  </div>
                </div>
              </div>

              {/* Song list */}
              <div className="space-y-2">
                {mockSongs.map((song, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3 p-2 bg-muted/30 rounded hover:bg-muted/50 transition-colors"
                  >
                    {/* Thumbnail - matching dashboard 16:12 aspect ratio */}
                    <div className="w-16 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded overflow-hidden shrink-0 flex items-center justify-center">
                      <Music2 className="w-5 h-5 text-primary/60" />
                    </div>
                    
                    {/* Song info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{song.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">Key: {song.key}</span>
                        {song.tags.slice(0, 2).map((tag, tagIndex) => (
                          <span key={tagIndex}>#{tag}</span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Resource icons - matching dashboard colors */}
                    <div className="flex gap-1.5">
                      <Youtube className="w-4 h-4 text-red-500" />
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Set footer */}
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>예배인도자: 홍길동</span>
                  <span className="flex items-center gap-1">
                    <span>팀원 7명</span>
                    <span>•</span>
                    <span>공유됨</span>
                  </span>
                </div>
              </div>

              {/* Expandable hint */}
              <div className="mt-3 text-center">
                <span className="text-xs text-primary cursor-pointer hover:underline inline-flex items-center gap-1">
                  전체 보기 
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
