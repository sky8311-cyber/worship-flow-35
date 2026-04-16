import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const AtelierNav = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav role="navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-top ${
        scrolled
          ? "bg-[#FAF8F5]/90 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo text - keep serif */}
        <Link to="/atelier-welcome" className="font-serif text-base tracking-[0.15em] text-foreground">
          WORSHIP ATELIER
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              to="/atelier"
              className="text-sm font-korean text-[#B8902A] hover:text-[#96750F] transition-colors"
            >
              내 아틀리에
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-korean text-muted-foreground hover:text-foreground transition-colors"
              >
                로그인
              </Link>
              <Link
                to="/signup"
                className="text-sm font-korean px-4 py-1.5 bg-[#1F1F1F] text-[#FAF8F5] hover:bg-[#333] transition-colors"
              >
                시작하기
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
