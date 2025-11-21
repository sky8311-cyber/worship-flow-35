import { motion } from "framer-motion";
import { fadeInUp, viewportOptions } from "@/lib/animations";
import { Music2, Calendar, MapPin } from "lucide-react";
export const LandingCommunity = () => {
  const exampleSets = [{
    leader: "홍길동",
    title: "주일 2부 예배",
    date: "2025.11.10",
    church: "서울한빛교회"
  }, {
    leader: "김철수",
    title: "청년예배",
    date: "2025.11.03",
    church: "부산사랑교회"
  }, {
    leader: "이영희",
    title: "새벽예배",
    date: "2025.10.28",
    church: "인천소망교회"
  }];
  return <section id="community" className="py-32">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOptions} variants={fadeInUp} className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            혼자 짜던 콘티에서,
함께 나누는 콘티로
            <br />
            함께 나누는 콘티로
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left - Text */}
          <motion.div initial={{
          opacity: 0,
          x: -50
        }} whileInView={{
          opacity: 1,
          x: 0
        }} viewport={viewportOptions} transition={{
          duration: 0.8
        }} className="space-y-6">
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              K-Worship의 워십리더 커뮤니티에서는 
서로의  찬양 콘티를 공유하고, 같은 곡이 다른 예배에서 어떻게 사용됐는지 볼 수 있습니다.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              교회와 사역지가 달라도, 한국 예배의 살아 있는 영성을  
서로 나누고 이어갈 수 있습니다.
            </p>
          </motion.div>

          {/* Right - UI Mockup */}
          <motion.div initial={{
          opacity: 0,
          x: 50
        }} whileInView={{
          opacity: 1,
          x: 0
        }} viewport={viewportOptions} transition={{
          duration: 0.8
        }} className="relative">
            <div className="grid grid-cols-1 gap-4">
              {/* Song Detail Panel */}
              <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
                <div className="flex items-start gap-4 mb-4 pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Music2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">주 이름 높이며</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Hillsong</span>
                      <span>•</span>
                      <span className="font-mono">Key: G</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <p className="text-sm font-medium text-muted-foreground">이 곡을 사용한 예배세트</p>
                  <p className="text-xs text-muted-foreground/70">다른 워십리더들의 콘티 참고</p>
                </div>

                <div className="space-y-3">
                  {exampleSets.map((set, index) => <div key={index} className="group p-4 bg-background border border-border rounded-xl hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{set.leader}</span>
                        <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                          {set.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{set.date}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{set.church}</span>
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>;
};