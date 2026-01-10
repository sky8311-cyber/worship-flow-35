import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FullScreenLoader } from "@/components/layout/FullScreenLoader";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHeroSimple } from "@/components/landing/LandingHeroSimple";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { AppPageHero } from "@/components/landing/AppPageHero";

const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAppPage = location.pathname === "/app" || location.pathname === "/online";

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <FullScreenLoader label="Loading…" />;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {!isAppPage && <LandingNav />}
      
      {/* Main content */}
      <div className="relative z-10 bg-background">
        {isAppPage ? (
          <AppPageHero />
        ) : (
          <>
            <LandingHeroSimple />
            <LandingCTA />
          </>
        )}
      </div>
    </div>
  );
};

export default Landing;
