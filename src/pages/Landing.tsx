import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FullScreenLoader } from "@/components/layout/FullScreenLoader";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHeroSimple } from "@/components/landing/LandingHeroSimple";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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
      <LandingNav />
      
      {/* Main content */}
      <div className="relative z-10 bg-background">
        <LandingHeroSimple />
        <LandingCTA />
      </div>
      
      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default Landing;
