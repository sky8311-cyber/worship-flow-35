import { motion } from "framer-motion";
import { Palette, Layers, Heart } from "lucide-react";

const steps = [
  {
    icon: Palette,
    ko: "나만의 공간을 만들고",
    en: "Make it yours",
    desc: "BGM, 테마, 블록으로 나만의 예배 아틀리에를 꾸밉니다",
  },
  {
    icon: Layers,
    ko: "예배 여정을 기록하고",
    en: "Build your flow",
    desc: "찬양, 말씀, 묵상을 블록으로 담아 예배의 흐름을 만듭니다",
  },
  {
    icon: Heart,
    ko: "이웃과 잇습니다",
    en: "Connect with neighbors",
    desc: "예배하는 이웃의 아틀리에를 방문하고 함께 연결됩니다",
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
