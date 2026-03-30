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
        <div className="w-12 h-[1px] bg-[#B8902A] mx-auto my-4" />
        <p className="font-korean text-lg md:text-xl text-muted-foreground leading-relaxed">
          주일엔 뜨겁게 예배하고,
          <br />
          월요일엔 다시 각자의 일상으로 흩어집니다.
        </p>
      </motion.div>
    </section>
  );
};
