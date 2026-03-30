import { motion } from "framer-motion";
import { Palette, Layers, Heart } from "lucide-react";

const steps = [
  {
    icon: Palette,
    ko: "분위기를 만들고",
    en: "Create your mood",
    desc: "BGM, 테마, 컬러로 예배의 분위기를 디자인합니다",
  },
  {
    icon: Layers,
    ko: "흐름을 세우고",
    en: "Build your flow",
    desc: "블록과 공간으로 예배의 흐름을 구성합니다",
  },
  {
    icon: Heart,
    ko: "삶을 드립니다",
    en: "Offer your life",
    desc: "나누고 기록하며 삶 전체를 예배로 드립니다",
  },
];

export const AtelierExperience = () => {
  return (
    <section className="py-24 md:py-32 px-6 bg-[#FAF8F5]">
      <div className="max-w-4xl mx-auto">
        <motion.p
          className="font-serif text-center text-sm md:text-base text-[#B8902A] tracking-[0.3em] uppercase mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Experience
        </motion.p>

        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full border border-[#B8902A]/30 flex items-center justify-center">
                  <step.icon className="w-6 h-6 text-[#B8902A]" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="font-korean text-xl md:text-2xl text-foreground">
                {step.ko}
              </h3>
              <p className="text-sm text-[#B8902A] tracking-wider font-serif">
                {step.en}
              </p>
              <p className="font-korean text-sm text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
