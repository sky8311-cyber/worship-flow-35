import { Database, Workflow, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, viewportOptions } from "@/lib/animations";

export const LandingHowItWorks = () => {
  const steps = [
    {
      number: "1",
      icon: Database,
      title: "곡과 예배 데이터 쌓기",
      description: "교회에서 자주 사용하는 곡들을 등록하고, 키, 태그(회개, 선포, 감사 등), 어떤 예배에서 어떻게 사용했는지 기록합니다.",
    },
    {
      number: "2",
      icon: Workflow,
      title: "이번 주 예배 흐름 설계하기",
      description: "이번 주 말씀 본문과 예배 분위기를 생각하며, 데이터베이스에서 곡을 골라 세트로 배치합니다. 이전에 사용했던 콘티도 불러와 재구성할 수 있습니다.",
    },
    {
      number: "3",
      icon: Share2,
      title: "팀과 나누고, 예배 후 되돌아보기",
      description: "팀원에게 링크를 보내 함께 준비하고, 예배 후에는 어떤 곡과 흐름이 좋았는지 메모하며 다음을 준비합니다.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-accent/5">
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
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            한 주 예배 준비에 K-Worship이 함께 하는 방법
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={staggerContainer}
          className="relative"
        >
          {/* Connection line for desktop */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-border" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="relative"
              >
                <div className="bg-card border border-border rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
                  {/* Step number badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-lg z-10">
                    {step.number}
                  </div>

                  <div className="w-14 h-14 rounded-lg bg-secondary/10 flex items-center justify-center mx-auto mb-6 mt-4">
                    <step.icon className="w-7 h-7 text-secondary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-4 text-center">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-center">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
