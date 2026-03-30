import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AtelierArchLogo } from "./AtelierArchLogo";
import { useAuth } from "@/contexts/AuthContext";

const TYPEWRITER_SPEED = 90;

export const AtelierHero = () => {
  // Phase: 0=init, 1=typing예배를, 2=arch drawing, 3=arch done, 4=typing삶의흐름으로, 5=typing연결합니다, 6=merge+CTA
  const [phase, setPhase] = useState(0);
  const [chars1, setChars1] = useState(0); // 예배를
  const [chars2, setChars2] = useState(0); // 삶의 흐름으로
  const [chars3, setChars3] = useState(0); // 연결합니다
  const { user } = useAuth();
  const navigate = useNavigate();

  const text1 = "예배를";
  const text2 = "삶의 흐름으로";
  const text3 = "연결합니다";

  // Start phase 1 after mount
  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 400);
    return () => clearTimeout(t);
  }, []);

  // Phase 1: typewriter "예배를"
  useEffect(() => {
    if (phase !== 1) return;
    if (chars1 >= text1.length) {
      const t = setTimeout(() => setPhase(2), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setChars1((c) => c + 1), TYPEWRITER_SPEED);
    return () => clearTimeout(t);
  }, [phase, chars1]);

  // Phase 2→3: arch draws, onArchComplete triggers phase 4
  const handleArchComplete = useCallback(() => {
    setTimeout(() => setPhase(4), 200);
  }, []);

  // Phase 4: typewriter "삶의 흐름으로"
  useEffect(() => {
    if (phase !== 4) return;
    if (chars2 >= text2.length) {
      const t = setTimeout(() => setPhase(5), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setChars2((c) => c + 1), TYPEWRITER_SPEED);
    return () => clearTimeout(t);
  }, [phase, chars2]);

  // Phase 5: typewriter "연결합니다"
  useEffect(() => {
    if (phase !== 5) return;
    if (chars3 >= text3.length) {
      const t = setTimeout(() => setPhase(6), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setChars3((c) => c + 1), TYPEWRITER_SPEED);
    return () => clearTimeout(t);
  }, [phase, chars3]);

  const handleCTA = () => {
    navigate(user ? "/atelier" : "/signup");
  };

  const isMerged = phase >= 6;

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#FAF8F5] relative">
      {/* Arch + text container */}
      <div className="relative w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64">
        <AtelierArchLogo
          startDrawing={phase >= 2}
          delay={0}
          className="w-full h-full"
          onArchComplete={handleArchComplete}
        />

        {/* "예배를" — left leg bottom */}
        {phase >= 1 && (
          <motion.span
            className="absolute font-korean text-lg md:text-2xl text-foreground tracking-wide whitespace-nowrap"
            style={{ bottom: -4, left: 0 }}
            animate={
              isMerged
                ? { x: "0%", opacity: 1 }
                : { x: 0, opacity: 1 }
            }
            initial={{ opacity: 1 }}
          >
            {text1.slice(0, chars1)}
            {phase < 2 && (
              <span
                className="inline-block w-[2px] h-[1em] ml-0.5 align-middle bg-foreground"
                style={{ animation: "blink 1s step-end infinite" }}
              />
            )}
          </motion.span>
        )}

        {/* "삶의 흐름으로" — right leg bottom */}
        {phase >= 4 && (
          <motion.span
            className="absolute font-korean text-lg md:text-2xl text-foreground tracking-wide whitespace-nowrap"
            style={{ bottom: -4, right: 0 }}
            initial={{ opacity: 1 }}
          >
            {text2.slice(0, chars2)}
            {phase >= 4 && phase < 5 && (
              <span
                className="inline-block w-[2px] h-[1em] ml-0.5 align-middle bg-foreground"
                style={{ animation: "blink 1s step-end infinite" }}
              />
            )}
          </motion.span>
        )}
      </div>

      {/* Merged text line — appears in phase 6, replaces the absolute texts */}
      <motion.div
        className="flex items-baseline gap-1.5 mt-2"
        initial={{ opacity: 0 }}
        animate={isMerged ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <span className="font-korean text-lg md:text-2xl text-foreground tracking-wide">
          {text1}
        </span>
        <span className="font-korean text-lg md:text-2xl text-foreground tracking-wide">
          {text2}
        </span>
      </motion.div>

      {/* 연결합니다 */}
      <div className="h-9 mt-1 text-center">
        {phase >= 5 && (
          <span className="font-korean text-lg md:text-2xl text-muted-foreground tracking-wide">
            {text3.slice(0, chars3)}
            {phase < 6 && (
              <span
                className="inline-block w-[2px] h-[1em] ml-0.5 align-middle bg-foreground"
                style={{ animation: "blink 1s step-end infinite" }}
              />
            )}
          </span>
        )}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={isMerged ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="mt-8"
        style={{ visibility: isMerged ? "visible" : "hidden" }}
      >
        <button
          onClick={handleCTA}
          className="px-8 py-3.5 bg-foreground text-background font-korean text-lg tracking-wider rounded-none hover:bg-[#333] transition-colors duration-300"
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
        animate={isMerged ? { opacity: 1 } : {}}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className="w-[1px] h-10 bg-muted-foreground/40 mx-auto animate-pulse" />
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
