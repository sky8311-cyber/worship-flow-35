import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FullScreenLoader } from "@/components/layout/FullScreenLoader";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHeroSimple } from "@/components/landing/LandingHeroSimple";
import { LandingNews } from "@/components/landing/LandingNews";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { AppPageHero } from "@/components/landing/AppPageHero";
import { SEOHead } from "@/components/seo/SEOHead";

const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAppPage = location.pathname === "/app";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!loading && user && !params.has("preview")) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate, location.search]);

  if (loading) {
    return <FullScreenLoader label="Loading…" />;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title="K-Worship - All-in-One Worship Team Platform"
        titleKo="K-Worship - 예배팀을 위한 콘티 제작 및 찬양팀 관리 플랫폼"
        description="K-Worship is an all-in-one worship team management platform for worship preparation, setlist creation, and team collaboration."
        descriptionKo="K-Worship은 예배 인도자와 찬양팀을 위한 콘티 제작, 예배 자료 관리, 팀 협업 플랫폼입니다. 예배 준비, 콘티 제작, 팀 협업을 위한 플랫폼입니다."
        keywords="K-Worship, worship setlist, worship team management, CCM, church music"
        keywordsKo="K-Worship, 케이워십, 예배콘티, 찬양인도, 예배인도, 찬양팀관리, 워십세트, 주일예배, CCM"
        canonicalPath="/"
      />
      {!isAppPage && <LandingNav />}
      
      {/* Main content */}
      <div className="relative z-10 bg-background">
        {isAppPage ? (
          <AppPageHero />
        ) : (
          <>
            <LandingHeroSimple />
            <LandingNews />
            <LandingFAQ />
            <LandingCTA />
          </>
        )}
      </div>
    </div>
  );
};

export default Landing;
