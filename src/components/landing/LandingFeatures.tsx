import { Database, FileMusic, ListMusic, Users, UserPlus, Download } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, viewportOptions } from "@/lib/animations";
export const LandingFeatures = () => {
  const features = [{
    icon: Database,
    title: "곡 라이브러리(데이터베이스)",
    description: "예배에서 사용한 곡을 저장하고, 키, 태그, 메시지, 사용했던 예배까지 기록합니다.",
    subtitle: "한 곡이 어느 예배에서 어떻게 쓰였는지를 나중에 다시 볼 수 있습니다."
  }, {
    icon: FileMusic,
    title: "레퍼런스 곡 & 악보 저장",
    description: "각 곡마다 YouTube 레퍼런스 링크와 악보 파일(이미지/PDF)을 함께 저장해 둡니다.",
    subtitle: "새 콘티를 만들 때, 이미 연결된 악보와 링크를 그대로 가져올 수 있습니다."
  }, {
    icon: ListMusic,
    title: "워십세트(콘티) 제작",
    description: "곡 라이브러리에서 곡을 골라 드래그 앤 드롭으로 워십세트를 구성하고, 송폼과 특이사항을 기록합니다.",
    subtitle: "예: \"브릿지 2번 반복 / 후렴 잔잔하게 / 파송곡은 회중 찬양\""
  }, {
    icon: Users,
    title: "워십리더 커뮤니티 열람",
    description: "내가 어떤 곡을 워십세트에 추가할 때, 그 곡을 사용했던 다른 워십리더의 콘티를 바로 열람할 수 있습니다.",
    subtitle: "같은 곡을 어떤 흐름 속에서 썼는지 서로 참고하고 배울 수 있습니다."
  }, {
    icon: UserPlus,
    title: "예배공동체 생성 & 팀 초대",
    description: "워십리더는 예배공동체를 만들고, 팀원들을 초대해 세트와 공지사항을 함께 나눕니다.",
    subtitle: "커뮤니티 소식을 공유하고, 예배 준비를 팀 단위로 정렬할 수 있습니다."
  }, {
    icon: Download,
    title: "PDF 일괄 내보내기",
    description: "워십세트가 완성되면, 각 곡의 악보에 저장한 송폼·특이사항을 포함해 한 번에 PDF로 내보낼 수 있습니다.",
    subtitle: "PDF를 바로 카톡으로 보내거나, 인쇄해서 리허설에 사용할 수 있습니다."
  }];
  return <section id="features" className="py-32">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOptions} variants={{
        hidden: {
          opacity: 0,
          y: 30
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.6
          }
        }
      }} className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            예배 준비를 한 흐름으로
묶어 주는 기능들
          </h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={viewportOptions} variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => <motion.div key={index} variants={staggerItem} className="group p-8 bg-card border border-border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105">
              <div className="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary/20 group-hover:scale-110 transition-all">
                <feature.icon className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">{feature.description}</p>
              {feature.subtitle && <p className="text-sm text-primary/70 italic border-l-2 border-primary/30 pl-4">
                  {feature.subtitle}
                </p>}
            </motion.div>)}
        </motion.div>
      </div>
    </section>;
};