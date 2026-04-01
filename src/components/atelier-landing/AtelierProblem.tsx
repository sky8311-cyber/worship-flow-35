import { motion } from "framer-motion";

export const AtelierProblem = () => {
  return (
    <section className="min-h-[36vh] flex flex-col items-center justify-center px-6 bg-[#FAF8F5] relative">
      <motion.div
        className="max-w-2xl text-center space-y-2"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <p className="font-korean text-xl md:text-2xl text-foreground leading-relaxed">
          예배는 많지만,
        </p>
        <p className="font-korean text-xl md:text-2xl text-foreground leading-relaxed">
          그 리듬은 삶으로 이어지고 있나요?
        </p>
      </motion.div>

      <motion.div
        className="absolute bottom-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="w-[1px] h-10 bg-[#CCC] mx-auto animate-pulse" />
      </motion.div>
    </section>
  );
};
