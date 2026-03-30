import { motion } from "framer-motion";

const rows = [
  { left: "삶", arrow: "→", right: "예배로", en: "Life → Worship" },
  { left: "공간", arrow: "→", right: "창작", en: "Space → Creation" },
  { left: "과정", arrow: "→", right: "흐름", en: "Process → Flow" },
];

export const AtelierSolution = () => {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6 bg-[#F5F2ED]">
      <div className="max-w-2xl text-center space-y-10">
        <motion.p
          className="font-serif text-lg md:text-xl text-[#666666]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          Worship Atelier는
          <br />
          예배를 삶의 흐름으로 연결합니다
        </motion.p>

        <div className="space-y-6">
          {rows.map((row, i) => (
            <motion.div
              key={i}
              className="flex items-center justify-center gap-4 md:gap-6"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
            >
              <span className="font-serif text-2xl md:text-3xl text-[#1F1F1F] tracking-widest">
                {row.left}
              </span>
              <span className="text-[#B8902A] text-xl md:text-2xl">→</span>
              <span className="font-serif text-2xl md:text-3xl text-[#B8902A] tracking-widest font-medium">
                {row.right}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
