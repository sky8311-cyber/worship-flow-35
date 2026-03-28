import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Palette } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorshipRoom, useWorshipRoomById } from "@/hooks/useWorshipRoom";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { SEOHead } from "@/components/seo/SEOHead";
import { StudioHeader } from "@/components/worship-studio/StudioHeader";
import { CollapsibleSidebar } from "@/components/worship-studio/CollapsibleSidebar";
import { StudioMainPanel } from "@/components/worship-studio/StudioMainPanel";
import { StoryBar } from "@/components/worship-studio/StoryBar";
import { StudioSettingsDialog } from "@/components/worship-studio/StudioSettingsDialog";
import { ShareReferralDialog } from "@/components/ShareReferralDialog";
import { FeatureComingSoon } from "@/components/common/FeatureComingSoon";

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
  
  // Gate: show coming soon if disabled
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
  
  // Dialog states
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  
  // Sidebar collapsed state (default: collapsed)
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  
  // Get user's own studio
  const { room: myStudio, isLoading: myStudioLoading } = useWorshipRoom(user?.id);
  
  // Track selected studio for viewing others
  const [selectedStudioId, setSelectedStudioId] = useState<string | null>(roomId || null);
  
  // Sync URL roomId to selected studio
  useEffect(() => {
    if (roomId) {
      setSelectedStudioId(roomId);
    }
  }, [roomId]);
  
  // Fetch selected studio if different from own
  const { room: selectedStudio } = useWorshipRoomById(
    selectedStudioId && selectedStudioId !== myStudio?.id ? selectedStudioId : undefined
  );
  
  // Current studio being viewed (for BGM bar)
  const currentStudio = selectedStudioId 
    ? (selectedStudioId === myStudio?.id ? myStudio : selectedStudio)
    : myStudio;
  
  // BGM info extraction
  const bgmVideoId = currentStudio?.bgm_song?.youtube_url 
    ? extractVideoId(currentStudio.bgm_song.youtube_url)
    : null;
  
  const handleBack = () => {
    navigate('/dashboard');
  };
  
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
      {/* Paper grain texture */}
      <div className="absolute inset-0 pointer-events-none bg-noise opacity-[0.025] z-0" />
      <SEOHead 
        title={t("studio.title")} 
        description={t("studio.description")} 
      />
      
      {/* Header with avatar dropdown + mini BGM */}
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
      
      {/* Story Bar */}
      <StoryBar 
        onStudioSelect={handleStudioSelect}
        myStudioId={myStudio?.id}
      />
      
      {/* Main content area */}
      <div className="flex-1 h-0 overflow-hidden flex">
        {/* Desktop: Show collapsible sidebar */}
        {!isMobile && (
          <CollapsibleSidebar
            isExpanded={sidebarExpanded}
            onExpandedChange={setSidebarExpanded}
            onStudioSelect={handleStudioSelect}
            onMyStudioSelect={handleMyStudioSelect}
            selectedStudioId={selectedStudioId}
            myStudioId={myStudio?.id}
          />
        )}
        
        {/* Main panel with tabs */}
        <StudioMainPanel
          myStudioId={myStudio?.id}
          selectedStudioId={selectedStudioId}
          onStudioSelect={handleStudioSelect}
        />
      </div>
      
      {/* BGM moved to header mini player */}
      
      {/* Settings Dialog */}
      {myStudio && (
        <StudioSettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          room={myStudio}
        />
      )}
      
      {/* Share Dialog */}
      <ShareReferralDialog
        open={showShare}
        onOpenChange={setShowShare}
      />
    </div>
  );
}
