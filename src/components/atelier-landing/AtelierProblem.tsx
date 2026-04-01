import { motion } from "framer-motion";

export const AtelierProblem = () => {
  return (
    <section className="min-h-[36vh] flex items-center justify-center px-6 bg-[#FAF8F5]">
      <motion.div
        className="max-w-2xl text-center space-y-6"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <p className="font-korean text-xl md:text-2xl text-foreground leading-relaxed">
          우리는 예배를 준비하지만
        </p>
        <p className="font-korean text-xl md:text-2xl text-foreground leading-relaxed">
          삶과는 연결되지 않습니다
        </p>
      </motion.div>
    </section>
  );
};
