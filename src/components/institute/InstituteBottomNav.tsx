import { useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, Award, User } from "lucide-react";

const tabs = [
  { key: "home", icon: Home, label: "홈", path: "/institute" },
  { key: "courses", icon: BookOpen, label: "과목", path: "/institute" },
  { key: "certs", icon: Award, label: "자격증", path: "/institute" },
  { key: "my", icon: User, label: "마이", path: "/institute" },
];

export function InstituteBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Only "home" is currently a real distinct route
  const activeKey = location.pathname === "/institute" ? "home" : "home";

  return (
    <nav
      style={{
        background: "#ffffff",
        borderTop: "1px solid #e8e6e0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        height: "56px",
        flexShrink: 0,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 12px",
              position: "relative",
            }}
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2.2 : 1.6}
              style={{ color: isActive ? "#b8902a" : "#9a9890" }}
            />
            <span
              style={{
                fontSize: "10px",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#b8902a" : "#9a9890",
              }}
            >
              {tab.label}
            </span>
            {/* Gold dot indicator */}
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  bottom: "2px",
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "#b8902a",
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
