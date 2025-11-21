import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingIntro } from "@/components/landing/LandingIntro";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingCommunity } from "@/components/landing/LandingCommunity";
import { LandingWaitlist } from "@/components/landing/LandingWaitlist";
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <LandingHero />
      <LandingIntro />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingCommunity />
      <LandingWaitlist />
      <LandingFAQ />
      <LandingFooter />
    </div>
  );
};

export default Landing;
