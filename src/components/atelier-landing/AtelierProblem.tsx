import { motion } from "framer-motion";

export const AtelierProblem = () => {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6 bg-[#FAF8F5]">
      <motion.div
        className="max-w-2xl text-center space-y-6"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <p className="font-serif text-xl md:text-2xl text-[#1F1F1F] leading-relaxed">
          우리는 예배를 준비하지만
        </p>
        <p className="font-serif text-xl md:text-2xl text-[#1F1F1F] leading-relaxed">
          삶과는 연결되지 않습니다
        </p>
        <div className="w-12 h-[1px] bg-[#B8902A] mx-auto my-8" />
        <p className="font-serif text-lg md:text-xl text-[#666666] leading-relaxed">
          예배는 따로 있고, 삶은 따로 있습니다
        </p>
      </motion.div>
    </section>
  );
};
