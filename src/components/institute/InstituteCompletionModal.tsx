interface Props {
  open: boolean;
  onClose: () => void;
  courseName: string;
  hasCert: boolean;
  language: string;
}

export function InstituteCompletionModal({ open, onClose, courseName, hasCert, language }: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(245,244,240,0.9)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--inst-surface)",
          border: "1px solid var(--inst-gold-bdr)",
          borderRadius: 20,
          padding: "36px 28px",
          textAlign: "center",
          maxWidth: 320,
          width: "100%",
          boxShadow: "0 20px 60px rgba(184,144,42,0.15)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top gold bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            borderRadius: "20px 20px 0 0",
            background: "linear-gradient(90deg, var(--inst-gold), var(--inst-gold-lt))",
          }}
        />

        <div style={{ fontSize: 44, marginBottom: 16 }}>🎓</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--inst-ink)" }}>
          {language === "ko" ? "수강 완료!" : "Course Complete!"}
        </h2>
        <div style={{ color: "var(--inst-gold)", fontSize: 14, fontWeight: 700, margin: "8px 0" }}>
          {courseName}
        </div>
        <div style={{ color: "var(--inst-ink3)", fontSize: 12 }}>
          {new Date().toLocaleDateString(language === "ko" ? "ko-KR" : "en-US")}
        </div>

        {hasCert && (
          <div
            style={{
              background: "var(--inst-gold-bg)",
              borderRadius: 10,
              padding: "12px 16px",
              margin: "16px 0",
              color: "var(--inst-ink2)",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            {language === "ko"
              ? "K-Worship Certified 배지 발급은 해당 자격증의 모든 과정을 완료한 후 신청할 수 있습니다."
              : "K-Worship Certified badge can be requested after completing all courses in the certification."}
          </div>
        )}

        <button className="inst-btn-gold" style={{ marginTop: 16, padding: "12px 28px", width: "auto" }} onClick={onClose}>
          {language === "ko" ? "확인" : "OK"}
        </button>
      </div>
    </div>
  );
}
