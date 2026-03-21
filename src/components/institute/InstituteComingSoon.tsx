import { useNavigate } from "react-router-dom";
import { GraduationCap, Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import instituteLogo from "@/assets/kworship-institute-logo.png";

export function InstituteComingSoon() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isKo = language === "ko";

  return (
    <div className="flex flex-col min-h-[calc(100dvh-56px)]" style={{ background: "var(--inst-bg)", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif" }}>
      {/* Header */}
      <header
        className="flex items-center justify-center px-3 py-4 border-b flex-shrink-0"
        style={{ background: "var(--inst-surface)", borderColor: "var(--inst-border)" }}
      >
        <img
          src={instituteLogo}
          alt="K-Worship Institute"
          style={{ height: 128, width: "auto" }}
        />
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--inst-gold-bg)" }}
        >
          <GraduationCap
            className="w-10 h-10"
            style={{ color: "var(--inst-gold)" }}
          />
        </div>

        <div className="space-y-2 max-w-sm">
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--inst-ink)" }}
          >
            {isKo ? "K-Worship 인스티튜트" : "K-Worship Institute"}
          </h1>
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--inst-ink2)" }}
          >
            {isKo
              ? "예배 인도자를 위한 온라인 자격증 과정이 곧 시작됩니다!"
              : "Online certification courses for worship leaders are coming soon."}
          </p>
        </div>

        <div className="inst-badge-certified">
          <Sparkles className="w-3 h-3" />
          {isKo ? "준비 중" : "Coming Soon"}
        </div>

        <button
          className="inst-btn-outline mt-4"
          onClick={() => navigate("/dashboard")}
        >
          {isKo ? "홈으로 돌아가기" : "Back to Home"}
        </button>
      </main>
    </div>
  );
}
