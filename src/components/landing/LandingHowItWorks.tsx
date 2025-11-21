import { Users, Database, ListMusic, Download } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, viewportOptions } from "@/lib/animations";

export const LandingHowItWorks = () => {
  const steps = [
    {
      number: "1",
      icon: Users,
      title: "예배공동체 만들기 & 팀 초대",
      description: "워십리더가 교회 예배공동체를 생성하고, 찬양팀원과 예배 담당자를 초대합니다.",
    },
    {
      number: "2",
      icon: Database,
      title: "곡 라이브러리 구축",
      description: "자주 사용하는 곡을 등록하고, 레퍼런스 YouTube 링크와 악보를 함께 저장합니다. 이전에 사용했던 콘티도 불러와 연결할 수 있습니다.",
    },
    {
      number: "3",
      icon: ListMusic,
      title: "워십세트(콘티) 제작 & 커뮤니티 참고",
      description: "이번 주 예배 세트를 만들면서, 같은 곡을 사용했던 다른 워십리더들의 콘티를 열람해 참고합니다. 메시지와 분위기에 맞게 곡 순서와 송폼을 다듬습니다.",
    },
    {
      number: "4",
      icon: Download,
      title: "PDF로 내보내기 & 공유",
      description: "완성된 세트를 PDF로 일괄 내보내 카톡으로 팀원에게 보내거나, 인쇄해서 리허설에 사용합니다.",
    },
  ];

  return (
    <section id="how-it-works" className="py-32 bg-accent/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
          }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            한 주 예배 준비,
            <br />
            이렇게 달라집니다.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={staggerContainer}
          className="relative max-w-5xl mx-auto"
        >
          {/* Mobile/Tablet: Vertical Timeline */}
          <div className="lg:hidden space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="relative pl-12"
              >
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border -translate-x-1/2" />
                )}
                
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                  {/* Step number badge */}
                  <div className="absolute left-0 top-8 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-lg">
                    {step.number}
                  </div>

                  <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-6">
                    <step.icon className="w-7 h-7 text-secondary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop: Horizontal Timeline */}
          <div className="hidden lg:block">
            {/* Connection line */}
            <div className="absolute top-20 left-0 right-0 h-0.5 bg-border" />

            <div className="grid grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  variants={staggerItem}
                  className="relative"
                >
                  <div className="bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                    {/* Step number badge */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-lg z-10">
                      {step.number}
                    </div>

                    <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-6 mt-4">
                      <step.icon className="w-7 h-7 text-secondary" />
                    </div>

                    <h3 className="text-lg font-semibold mb-4 text-center">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed text-center">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
