import { motion } from "framer-motion";
import { fadeInUp, viewportOptions } from "@/lib/animations";
import { UserCheck, Users, Share } from "lucide-react";

export const LandingTeam = () => {
  const benefits = [
    {
      icon: UserCheck,
      title: "워십리더를 위해",
      description: "매주 새로 고민하는 것이 아니라, 쌓여 있는 예배 데이터를 바탕으로 더 깊이 있는 콘티를 준비할 수 있습니다.",
    },
    {
      icon: Users,
      title: "팀원들을 위해",
      description: "팀원들은 같은 세트 화면에서 곡 순서, 키, 악보, 참고 음원을 한 번에 볼 수 있어 혼란이 줄어듭니다.",
    },
    {
      icon: Share,
      title: "다른 찬양 인도자를 위해",
      description: "사역이 바뀌거나, 새로운 리더가 세워질 때 교회에 쌓인 예배의 흐름을 그대로 이어갈 수 있습니다.",
    },
  ];

  return (
    <section id="team" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            워십리더 혼자 짊어지던 부담을,
            <br />
            팀과 나눌 수 있도록
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left - Benefits */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOptions}
            variants={fadeInUp}
            className="space-y-8"
          >
            {benefits.map((benefit, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Right - Mock UI */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOptions}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
              <div className="mb-4 pb-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">워십리더 뷰</h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">편집 가능</span>
                </div>
                <p className="text-xs text-muted-foreground">전체 세트 구성 및 메시지 편집</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="p-3 bg-background rounded-lg border border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span>주 이름 높이며</span>
                    <span className="font-mono text-xs">Key: G</span>
                  </div>
                </div>
                <div className="p-3 bg-background rounded-lg border border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span>주님의 마음</span>
                    <span className="font-mono text-xs">Key: F</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">팀원 뷰</h3>
                  <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">보기 전용</span>
                </div>
                <p className="text-xs text-muted-foreground">세트 순서, 키, 악보, 링크만 확인</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
