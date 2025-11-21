import { Users, Database, Network } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, viewportOptions } from "@/lib/animations";

export const LandingIntro = () => {
  const pillars = [
    {
      icon: Users,
      title: "예배공동체 중심",
      description: "워십리더가 예배 공동체를 생성하고, 팀원을 초대해 함께 준비합니다.",
    },
    {
      icon: Database,
      title: "곡 라이브러리 + 워십세트",
      description: "사용했던 곡, 악보, 메시지 연결까지 곡 데이터베이스로 쌓아 갑니다.",
    },
    {
      icon: Network,
      title: "워십리더 커뮤니티",
      description: "서로의 찬양 콘티를 열람하고, 같은 곡을 어떻게 사용했는지 참고할 수 있습니다.",
    },
  ];

  return (
    <section id="intro" className="py-32 bg-accent/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
          }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            예배를 만드는 찬양 콘티,
            <br />
            더 이상 흘려보내지 마세요.
          </h2>
          <div className="text-lg md:text-xl text-muted-foreground leading-relaxed space-y-4">
            <p>
              예배에서 찬양 송리스트는 단순한 순서가 아니라,
              회중이 하나님께 나아가는 길을 여는 '영적인 흐름'입니다.
            </p>
            <p>
              K-Worship은 그 흐름을 데이터베이스로 기록하고,
              예배 인도자와 팀, 그리고 다른 워십리더들과 함께 나눌 수 있게 돕는 통합 플랫폼입니다.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {pillars.map((pillar, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="group p-8 bg-card border border-border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                <pillar.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{pillar.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{pillar.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
