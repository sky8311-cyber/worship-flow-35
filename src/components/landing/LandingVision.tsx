import { Heart, Database, GitBranch } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem, viewportOptions } from "@/lib/animations";

export const LandingVision = () => {
  const pillars = [
    {
      icon: Heart,
      title: "예배의 흐름",
      description: "메시지, 기도, 찬양이 하나의 흐름으로 이어지도록 돕는 콘티 설계",
    },
    {
      icon: Database,
      title: "함께 나누는 콘티",
      description: "워십리더와 팀원이 같은 화면을 보고 같은 마음으로 준비",
    },
    {
      icon: GitBranch,
      title: "쌓이는 예배 데이터",
      description: "어떤 곡을 언제, 어떤 메시지와 함께 사용했는지 기록하고 돌아보기",
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
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            찬양 송리스트는 예배의 '순서'가 아니라 예배의 '길'입니다.
          </h2>
          <div className="text-lg text-muted-foreground leading-relaxed space-y-4">
            <p>
              예배에서 찬양 콘티는 단순한 곡 목록이 아니라,
              회중이 하나님 앞에 나아가도록 인도하는 영적인 길입니다.
              그러나 많은 워십리더들이 매주 그 길을 혼자 고민하고,
              세트가 끝나면 콘티는 사라져 버립니다.
            </p>
            <p>
              K-Worship은 예배의 흐름, 메시지, 찬양 세트를 데이터베이스로 남기고,
              다른 워십리더와 팀과 함께 나누도록 돕는 도구입니다.
              한국 교회의 살아 있는 예배 영성을 기록하고, 다음 세대로 이어 주는 플랫폼을 꿈꿉니다.
            </p>
          </div>
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
