import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Palette, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorshipRoom, useWorshipRoomById } from "@/hooks/useWorshipRoom";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { SEOHead } from "@/components/seo/SEOHead";
import { StudioHeader } from "@/components/worship-studio/StudioHeader";
import { StudioSidePanel } from "@/components/worship-studio/StudioSidePanel";
import { StudioMainPanel } from "@/components/worship-studio/StudioMainPanel";
import { StudioSettingsDialog } from "@/components/worship-studio/StudioSettingsDialog";
import { ShareReferralDialog } from "@/components/ShareReferralDialog";
import { FeatureComingSoon } from "@/components/common/FeatureComingSoon";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function extractVideoId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

export default function WorshipStudio() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { isStudioEnabled, isLoading: settingsLoading } = useAppSettings();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [mobileAptOpen, setMobileAptOpen] = useState(false);
  const { room: myStudio } = useWorshipRoom(user?.id);
  const [selectedStudioId, setSelectedStudioId] = useState<string | null>(roomId || null);
  
  useEffect(() => {
    if (roomId) setSelectedStudioId(roomId);
  }, [roomId]);
  
  const { room: selectedStudio } = useWorshipRoomById(
    selectedStudioId && selectedStudioId !== myStudio?.id ? selectedStudioId : undefined
  );

  if (!settingsLoading && !isStudioEnabled) {
    return (
      <FeatureComingSoon
        featureName="Worship Studio"
        featureNameKo="예배공작소"
        description="A creative space for worship leaders to share and collaborate. Coming soon!"
        descriptionKo="예배 인도자를 위한 크리에이티브 공간이 곧 열립니다!"
        icon={Palette}
      />
    );
  }
  
  const currentStudio = selectedStudioId 
    ? (selectedStudioId === myStudio?.id ? myStudio : selectedStudio)
    : myStudio;
  
  const bgmVideoId = currentStudio?.bgm_song?.youtube_url 
    ? extractVideoId(currentStudio.bgm_song.youtube_url)
    : null;
  
  const handleBack = () => navigate('/dashboard');
  
  const handleStudioSelect = (studioId: string) => {
    setSelectedStudioId(studioId);
    window.history.replaceState(null, '', `/studio/${studioId}`);
  };
  
  const handleMyStudioSelect = () => {
    setSelectedStudioId(null);
    window.history.replaceState(null, '', '/studio');
  };

  return (
    <div className="fixed inset-0 bg-[#faf7f2] dark:bg-background z-50 flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none bg-noise opacity-[0.025] z-0" />
      <SEOHead title={t("studio.title")} description={t("studio.description")} />
      
      <StudioHeader 
        onBack={handleBack}
        onSettings={() => setShowSettings(true)}
        onShare={() => setShowShare(true)}
        bgmSongTitle={currentStudio?.bgm_song?.title}
        bgmSongArtist={currentStudio?.bgm_song?.artist}
        bgmVideoId={bgmVideoId}
        bgmRoomId={currentStudio?.id}
        bgmOwnerName={currentStudio?.owner?.full_name}
      />
      
      {/* Main content: Side panel + Canvas */}
      <div className="flex-1 h-0 overflow-hidden flex">
        {!isMobile && (
          <StudioSidePanel
            myStudioId={myStudio?.id}
            onStudioSelect={handleStudioSelect}
            onMyStudioSelect={handleMyStudioSelect}
          />
        )}
        
        <StudioMainPanel
          myStudioId={myStudio?.id}
          selectedStudioId={selectedStudioId}
          onStudioSelect={handleStudioSelect}
        />
      </div>
      
      {myStudio && (
        <StudioSettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          room={myStudio}
        />
      )}
      
      <ShareReferralDialog open={showShare} onOpenChange={setShowShare} />
    </div>
  );
}
