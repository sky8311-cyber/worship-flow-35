import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft } from "lucide-react";
import instituteLogo from "@/assets/kworship-institute-logo.png";

interface InstituteLayoutProps {
  children: React.ReactNode;
  backTo?: string;
  backLabel?: string;
}

export function InstituteLayout({ children, backTo, backLabel }: InstituteLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const isMain = location.pathname === "/institute";

  return (
    <div className="inst-root">
      {/* Header */}
      <header className="inst-header">
        <div className="flex items-center gap-2">
          {!isMain && backTo ? (
            <button
              onClick={() => navigate(backTo)}
              className="flex items-center gap-1"
              style={{ color: "var(--inst-ink3)", fontSize: 12 }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{backLabel || "뒤로"}</span>
            </button>
          ) : (
            <div className="flex flex-col">
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "var(--inst-gold)",
                }}
              >
                K-Worship
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "var(--inst-ink)",
                  letterSpacing: -0.3,
                }}
              >
                Institute
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => navigate("/settings")}
          className="flex-shrink-0"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: "1px solid var(--inst-border)",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: "1px solid var(--inst-border)",
                background: "var(--inst-surface2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--inst-ink3)",
              }}
            >
              {profile?.full_name?.[0] || "?"}
            </div>
          )}
        </button>
      </header>

      {/* Content */}
      <main className="inst-content">{children}</main>
    </div>
  );
}
