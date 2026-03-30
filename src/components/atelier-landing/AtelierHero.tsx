import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AtelierArchLogo } from "./AtelierArchLogo";
import { useAuth } from "@/contexts/AuthContext";

export const AtelierHero = () => {
  // Phase 1: 예배를, Phase 2: 삶의 흐름으로, Phase 3: 아치+연결합니다, Phase 4: CTA
  const [phase, setPhase] = useState(0);
  const [connectChars, setConnectChars] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const connectText = "연결합니다";

  // Phase transitions
  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === 1) {
      const t = setTimeout(() => setPhase(2), 600);
      return () => clearTimeout(t);
    }
    if (phase === 2) {
      const t = setTimeout(() => setPhase(3), 600);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Phase 3: Typewriter for "연결합니다"
  useEffect(() => {
    if (phase < 3) return;
    if (connectChars >= connectText.length) {
      const t = setTimeout(() => setShowCTA(true), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setConnectChars((c) => c + 1), 80);
    return () => clearTimeout(t);
  }, [phase, connectChars]);

  const handleCTA = () => {
    if (user) {
      navigate("/atelier");
    } else {
      navigate("/signup");
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#FAF8F5] relative">
      {/* Arch symbol */}
      <div className="w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64">
        <AtelierArchLogo
          startDrawing={phase >= 3}
          delay={0}
          className="w-full h-full"
          onArchComplete={() => {}}
        />
      </div>

      {/* Text block below arch */}
      <div className="flex flex-col items-center mt-2">
        {/* 예배를 삶의 흐름으로 — single line */}
        <div className="flex items-baseline gap-1">
          <motion.span
            className="font-korean text-xl md:text-3xl text-foreground tracking-wide"
            initial={{ opacity: 0, y: -4 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            예배를
          </motion.span>
          <motion.span
            className="font-korean text-xl md:text-3xl text-foreground tracking-wide"
            initial={{ opacity: 0, y: -4 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            삶의 흐름으로
          </motion.span>
        </div>

        {/* 연결합니다 */}
        <div className="h-10 mt-1 text-center">
          {phase >= 3 && (
            <span className="font-korean text-xl md:text-3xl text-muted-foreground tracking-wide">
              {connectText.slice(0, connectChars)}
              <span
                className="inline-block w-[2px] h-[1em] ml-0.5 align-middle"
                style={{
                  backgroundColor: "#1F1F1F",
                  animation: "blink 1s step-end infinite",
                }}
              />
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={showCTA ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mt-8"
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

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </section>
  );
};
