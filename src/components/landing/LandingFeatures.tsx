import { Database, FileText, ListOrdered, Users } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, viewportOptions } from "@/lib/animations";

export const LandingFeatures = () => {
  const features = [
    {
      icon: Database,
      title: "송 데이터베이스 (곡 라이브러리)",
      description: "곡 제목, 키, 언어, 태그, 분위기, 사용했던 예배와 메시지까지 한 번에 정리합니다.",
      subtitle: "새로운 워십리더가 와도, 교회의 예배 역사와 흐름을 그대로 이어갈 수 있습니다.",
    },
    {
      icon: ListOrdered,
      title: "예배 세트 (콘티) 제작",
      description: "날짜와 예배를 선택하고, 드래그 앤 드롭으로 곡을 배치하면서 흐름을 설계합니다.",
      subtitle: "예: '인도 – 회개 – 선포 – 응답 – 파송' 같은 구조를 시각적으로 설계.",
    },
    {
      icon: FileText,
      title: "팀과의 공유",
      description: "한 링크로 팀원에게 세트를 공유하면, 곡 순서, 키, 악보, 유튜브 링크를 누구나 같은 화면에서 볼 수 있습니다.",
      subtitle: null,
    },
    {
      icon: Users,
      title: "워십리더 간 공유와 계보",
      description: "같은 교회 안에서, 혹은 다른 사역지에서도 쌓인 콘티와 곡 데이터베이스를 나누어 참고할 수 있습니다.",
      subtitle: "한 사람의 감각에 머무르지 않고, 세대와 세대를 잇는 예배 자료실을 만드는 것이 목표입니다.",
    },
  ];

  return (
    <section id="features" className="py-24">
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
          <h2 className="text-4xl md:text-5xl font-bold mb-6">K-Worship이 해주는 일</h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="group p-8 bg-card border border-border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-14 h-14 rounded-lg bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">{feature.description}</p>
              {feature.subtitle && (
                <p className="text-sm text-primary/70 italic mt-3">{feature.subtitle}</p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
