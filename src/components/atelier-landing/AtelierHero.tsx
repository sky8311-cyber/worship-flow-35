import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AtelierArchLogo } from "./AtelierArchLogo";
import { useAuth } from "@/contexts/AuthContext";

export const AtelierHero = () => {
  const [phase, setPhase] = useState(0);
  const [dots, setDots] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [connectChars, setConnectChars] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const connectText = "연결합니다";

  // Phase 1: Start title fade-in immediately
  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 300);
    return () => clearTimeout(t);
  }, []);

  // Phase 1: Typewriter dots after title appears
  useEffect(() => {
    if (phase < 1) return;
    const timers: NodeJS.Timeout[] = [];
    // dots appear at 0.6s, 0.9s, 1.2s after phase 1
    [600, 900, 1200].forEach((ms, i) => {
      timers.push(setTimeout(() => setDots(i + 1), ms));
    });
    // Move to phase 2 after dots
    timers.push(setTimeout(() => setPhase(2), 1500));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // Phase 2 → 3 → 4
  useEffect(() => {
    if (phase === 2) {
      const t = setTimeout(() => setPhase(3), 500);
      return () => clearTimeout(t);
    }
    if (phase === 3) {
      const t = setTimeout(() => setPhase(4), 500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Phase 4: Typewriter for "연결합니다"
  useEffect(() => {
    if (phase < 4) return;
    if (connectChars >= connectText.length) {
      // Show CTA after typewriter completes
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
      {/* 1. Title: "Worship Atelier는..." */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: 8 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <span className="font-serif text-2xl md:text-4xl tracking-wider text-foreground">
          Worship Atelier
        </span>
        <span className="font-korean text-2xl md:text-4xl text-foreground">는</span>
        <span className="font-korean text-2xl md:text-4xl text-muted-foreground ml-0.5">
          {".".repeat(dots)}
        </span>
        {/* Blinking cursor on last dot */}
        {phase >= 1 && phase < 4 && (
          <span
            className="inline-block w-[2px] h-[1em] ml-0.5 align-middle"
            style={{
              backgroundColor: "#1F1F1F",
              animation: "blink 1s step-end infinite",
            }}
          />
        )}
      </motion.div>

      {/* 2. Arch symbol + side text container */}
      <div className="relative w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 mb-4">
        {/* Arch draws at phase 4 */}
        <AtelierArchLogo
          delay={phase >= 4 ? 0 : 999}
          className="w-full h-full"
          onArchComplete={() => {}}
        />

        {/* "예배를" — left below arch */}
        <motion.div
          className="absolute -left-16 md:-left-24 bottom-0 translate-y-full"
          initial={{ opacity: 0, y: -4 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="font-korean text-xl md:text-3xl text-foreground tracking-wide">
            예배를
          </span>
        </motion.div>

        {/* "삶의 흐름으로" — right below arch */}
        <motion.div
          className="absolute -right-20 md:-right-32 bottom-0 translate-y-full"
          initial={{ opacity: 0, y: -4 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="font-korean text-xl md:text-3xl text-foreground tracking-wide">
            삶의 흐름으로
          </span>
        </motion.div>
      </div>

      {/* 3. "연결합니다" — typewriter below arch */}
      <div className="mt-10 text-center h-10">
        {phase >= 4 && (
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

      {/* 4. CTA */}
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
