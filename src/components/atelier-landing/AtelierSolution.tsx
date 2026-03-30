import { motion } from "framer-motion";

const rows = [
  { left: "삶", arrow: "→", right: "예배로", en: "Life → Worship" },
  { left: "기록", arrow: "→", right: "창작으로", en: "Record → Creation" },
  { left: "준비", arrow: "→", right: "흐름으로", en: "Prep → Flow" },
];

export const AtelierSolution = () => {
  return (
    <section className="min-h-[42vh] flex items-center justify-center px-6 bg-[#F5F2ED]">
      <div className="max-w-2xl text-center space-y-6">
        <motion.p
          className="font-korean text-lg md:text-xl text-muted-foreground"
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
              <span className="font-korean text-2xl md:text-3xl text-foreground tracking-widest">
                {row.left}
              </span>
              <span className="text-[#B8902A] text-xl md:text-2xl">→</span>
              <span className="font-korean text-2xl md:text-3xl text-[#B8902A] tracking-widest font-medium">
                {row.right}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
