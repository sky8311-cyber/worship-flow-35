import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AtelierNav } from "@/components/atelier-landing/AtelierNav";
import { AtelierHero } from "@/components/atelier-landing/AtelierHero";
import { AtelierProblem } from "@/components/atelier-landing/AtelierProblem";
import { AtelierSolution } from "@/components/atelier-landing/AtelierSolution";
import { AtelierExperience } from "@/components/atelier-landing/AtelierExperience";
import { AtelierCTA } from "@/components/atelier-landing/AtelierCTA";

const AtelierWelcome = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <AtelierNav />
      <AtelierHero />
      <AtelierProblem />
      <AtelierSolution />
      <AtelierExperience />
      <AtelierCTA />

      {/* Minimal footer */}
      <footer className="py-8 px-6 bg-[#FAF8F5] border-t border-[#E8E4DE]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#AAA] font-serif">
          <span>© {new Date().getFullYear()} Worship Atelier by K-Worship</span>
          <div className="flex gap-6">
            <a href="/legal" className="hover:text-[#666] transition-colors">이용약관</a>
            <a href="/legal" className="hover:text-[#666] transition-colors">개인정보처리방침</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AtelierWelcome;
