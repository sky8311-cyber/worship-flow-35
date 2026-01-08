import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FullScreenLoader } from "@/components/layout/FullScreenLoader";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingTrustBar } from "@/components/landing/LandingTrustBar";
import { LandingIntro } from "@/components/landing/LandingIntro";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
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
      
      {/* Main content - stacks above the footer */}
      <div className="relative z-10 bg-background">
        <LandingHero />
        <LandingTrustBar />
        <LandingIntro />
        <LandingFeatures />
        <LandingTestimonials />
        <LandingCTA />
        <LandingFAQ />
      </div>
      
      {/* Footer - sticky at bottom, revealed as content scrolls up */}
      <LandingFooter />
    </div>
  );
};

export default Landing;
