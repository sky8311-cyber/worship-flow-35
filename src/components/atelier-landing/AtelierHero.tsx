import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AtelierArchLogo } from "./AtelierArchLogo";
import { TypewriterText } from "./TypewriterText";
import { useAuth } from "@/contexts/AuthContext";

export const AtelierHero = () => {
  const [showCTA, setShowCTA] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const typewriterLines = [
    {
      text: "Worship Atelier는",
      className: "font-korean text-2xl md:text-4xl text-foreground tracking-wide",
    },
    {
      text: "예배를 삶의 흐름으로",
      className: "font-korean text-2xl md:text-4xl text-foreground tracking-wide",
    },
    {
      text: "연결합니다",
      className: "font-korean text-xl md:text-3xl text-muted-foreground tracking-wide mt-1",
    },
  ];

  const handleCTA = () => {
    if (user) {
      navigate("/atelier");
    } else {
      navigate("/signup");
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#FAF8F5] relative">
      {/* Large arch logo with drawing animation */}
      <div className="w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 mb-8">
        <AtelierArchLogo onArchComplete={() => {}} />
      </div>

      {/* Typewriter text */}
      <div className="text-center">
        <TypewriterText
          lines={typewriterLines}
          speed={55}
          delayBetweenLines={350}
          startDelay={300}
          onComplete={() => {
            setTimeout(() => setShowCTA(true), 800);
          }}
        />
      </div>

      {/* CTA fade-in after typewriter completes */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={showCTA ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mt-10"
        style={{ visibility: showCTA ? "visible" : "hidden" }}
      >
        <button
          onClick={handleCTA}
          className="px-8 py-3.5 bg-[#1F1F1F] text-[#FAF8F5] font-korean text-lg tracking-wider rounded-none hover:bg-[#333] transition-colors duration-300"
        >
          내 공간 만들기
        </button>
        <p className="text-center text-sm text-muted-foreground mt-3 font-serif">
          Start Your Studio
        </p>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8"
        initial={{ opacity: 0 }}
        animate={showCTA ? { opacity: 1 } : {}}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="w-[1px] h-10 bg-[#CCC] mx-auto animate-pulse" />
      </motion.div>
    </section>
  );
};
