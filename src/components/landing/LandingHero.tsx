import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { smoothScrollTo } from "@/lib/smoothScroll";
import { Music2, Youtube, FileText } from "lucide-react";
const mockSongs = [{
  title: "나의 하나님",
  key: "G",
  tags: ["인도", "기쁨"]
}, {
  title: "주님의 마음",
  key: "F",
  tags: ["회개", "경배"]
}, {
  title: "선포합니다",
  key: "E",
  tags: ["선포", "응답"]
}];
export const LandingHero = () => {
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background blobs */}
      <motion.div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.5, 0.3]
    }} transition={{
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut"
    }} />
      <motion.div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" animate={{
      scale: [1.2, 1, 1.2],
      opacity: [0.5, 0.3, 0.5]
    }} transition={{
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut"
    }} />

      <div className="container mx-auto px-4 py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="text-center lg:text-left">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              
              <br />
              <span className="text-foreground">예배팀 통합 플랫폼</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-6 leading-relaxed">
              K-Worship은 찬양 송리스트(콘티), 곡 라이브러리, 워십리더 커뮤니티를
              한 곳에서 관리하고 나눌 수 있는 예배 준비 올인원 앱입니다.
            </p>

            <p className="text-base md:text-lg text-muted-foreground/80 mb-10">
              사용했던 곡과 악보, 예배 흐름을 저장하고,
              다른 예배 인도자와 팀원들과 자연스럽게 공유해 보세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" onClick={() => smoothScrollTo("waitlist")} className="text-base px-8 py-6">
                얼리 액세스 신청하기
              </Button>
              <Button size="lg" variant="outline" onClick={() => smoothScrollTo("how-it-works")} className="text-base px-8 py-6">
                어떻게 돕나요?
              </Button>
            </div>
          </motion.div>

          {/* Right content - App mockup */}
          <motion.div initial={{
          opacity: 0,
          x: 50
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.8,
          delay: 0.2
        }} className="relative">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl shadow-2xl p-8">
              <div className="mb-6 pb-6 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-semibold">주일 2부 예배</h3>
                  <span className="text-sm text-muted-foreground">2025.11.17</span>
                </div>
                <p className="text-sm text-muted-foreground">예배공동체: 서울한빛교회</p>
              </div>

              <div className="space-y-4">
                {mockSongs.map((song, index) => <div key={index} className="group p-5 bg-background border border-border rounded-xl hover:shadow-md hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-lg">{song.title}</span>
                      <span className="text-sm font-mono bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                        {song.key}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex gap-2">
                        {song.tags.map((tag, tagIndex) => <span key={tagIndex} className="text-xs bg-secondary/20 text-secondary px-3 py-1 rounded-full">
                            {tag}
                          </span>)}
                      </div>
                    </div>
                    <div className="flex gap-3 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <Youtube className="w-4 h-4" />
                      <Music2 className="w-4 h-4" />
                    </div>
                  </div>)}
              </div>

              <div className="mt-6 pt-6 border-t border-border text-sm text-muted-foreground flex items-center justify-between">
                <span>예배인도자: 홍길동</span>
                <span>팀원 7명 / 공유됨</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>;
};