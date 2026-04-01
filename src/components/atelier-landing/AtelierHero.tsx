import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AtelierArchLogo } from "./AtelierArchLogo";
import { useAuth } from "@/contexts/AuthContext";

export const AtelierHero = () => {
  // Phases: 0=init, 1=예배를, 2=arch drawing, 3=삶으로 typewriter, 4=연결합니다. typewriter, 5=star, 6=CTA, 7=subtitle
  const [phase, setPhase] = useState(0);
  const [lifeChars, setLifeChars] = useState(0);
  const [connectChars, setConnectChars] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const lifeText = "삶으로";
  const connectText = "연결합니다.";

  // Phase 0 → 1: "예배를" fade in
  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 400);
    return () => clearTimeout(t);
  }, []);

  // Phase 1 → 2: start arch drawing after "예배를" appears
  useEffect(() => {
    if (phase !== 1) return;
    const t = setTimeout(() => setPhase(2), 600);
    return () => clearTimeout(t);
  }, [phase]);

  // Phase 3: typewriter for "삶으로"
  useEffect(() => {
    if (phase !== 3) return;
    if (lifeChars >= lifeText.length) {
      const t = setTimeout(() => setPhase(4), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLifeChars((c) => c + 1), 90);
    return () => clearTimeout(t);
  }, [phase, lifeChars]);

  // Phase 4: typewriter for "연결합니다."
  useEffect(() => {
    if (phase !== 4) return;
    if (connectChars >= connectText.length) {
      const t = setTimeout(() => setPhase(5), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setConnectChars((c) => c + 1), 80);
    return () => clearTimeout(t);
  }, [phase, connectChars]);

  // Phase 5 → 6: after star, show CTA
  useEffect(() => {
    if (phase !== 5) return;
    const t = setTimeout(() => setPhase(6), 600);
    return () => clearTimeout(t);
  }, [phase]);

  // Phase 6 → 7: after button, show subtitle
  useEffect(() => {
    if (phase !== 6) return;
    const t = setTimeout(() => setPhase(7), 300);
    return () => clearTimeout(t);
  }, [phase]);

  const handleArchComplete = () => {
    // Arch inner path done → start "삶으로" typewriter
    if (phase === 2) setPhase(3);
  };

  const handleCTA = () => {
    if (user) {
      navigate("/atelier");
    } else {
      navigate("/signup");
    }
  };

  const showCTA = phase >= 6;

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#FAF8F5] relative">
      {/* Arch symbol */}
      <div className="w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64">
        <AtelierArchLogo
          startDrawing={phase >= 2}
          showStar={phase >= 5}
          delay={0}
          className="w-full h-full"
          onArchComplete={handleArchComplete}
        />
      </div>

      {/* Text block below arch */}
      <div className="flex flex-col items-center mt-2">
        {/* 예배를 삶으로 — inline row */}
        <div className="h-10 flex flex-row items-baseline justify-center gap-1">
          <motion.span
            className="font-korean text-xl md:text-3xl text-foreground tracking-wide"
            initial={{ opacity: 0, y: -4 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            예배를
          </motion.span>
          {phase >= 3 && (
            <span className="font-korean text-xl md:text-3xl text-foreground tracking-wide">
              {lifeText.slice(0, lifeChars)}
              {phase === 3 && (
                <span
                  className="inline-block w-[2px] h-[1em] ml-0.5 align-middle"
                  style={{
                    backgroundColor: "#1F1F1F",
                    animation: "blink 1s step-end infinite",
                  }}
                />
              )}
            </span>
          )}
        </div>

        {/* 연결합니다. — typewriter */}
        <div className="h-10 text-center">
          {phase >= 4 && (
            <span className="font-korean text-xl md:text-3xl text-muted-foreground tracking-wide">
              {connectText.slice(0, connectChars)}
              {phase === 4 && (
                <span
                  className="inline-block w-[2px] h-[1em] ml-0.5 align-middle"
                  style={{
                    backgroundColor: "#1F1F1F",
                    animation: "blink 1s step-end infinite",
                  }}
                />
              )}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={showCTA ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mt-8 flex flex-col items-center"
        style={{ visibility: showCTA ? "visible" : "hidden" }}
      >
        <motion.p
          className="text-sm text-muted-foreground font-serif italic tracking-[0.2em] mb-3"
          initial={{ opacity: 0 }}
          animate={phase >= 7 ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          Start Your Atelier
        </motion.p>
        <button
          onClick={handleCTA}
          className="px-8 py-3.5 bg-[#1F1F1F] text-[#FAF8F5] font-korean text-lg tracking-wider rounded-none hover:bg-[#333] transition-colors duration-300"
        >
          내 공간 만들기
        </button>
      </motion.div>

      {/* Atelier description */}
      <motion.div
        className="max-w-sm text-center font-korean mt-6 px-4 space-y-3"
        initial={{ opacity: 0 }}
        animate={phase >= 7 ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
      >
        <p className="text-xs text-muted-foreground leading-relaxed">
          아틀리에에서 예술가는 완성품만 만들지 않습니다.
          <br />
          그 공간에서 아이디어는 자라고,
          <br />
          과정은 쌓이며,
          <br />
          삶 자체가 작품이 됩니다.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Worship Atelier는 그런 공간입니다.
          <br />
          예배를 준비하는 곳이 아니라, 예배로 살아가는 여정을 함께하는 곳.
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
