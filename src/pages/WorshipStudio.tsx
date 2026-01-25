import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorshipRoom, useWorshipRoomById } from "@/hooks/useWorshipRoom";
import { useTranslation } from "@/hooks/useTranslation";
import { SEOHead } from "@/components/seo/SEOHead";
import { StudioHeader } from "@/components/worship-studio/StudioHeader";
import { StudioSidebar } from "@/components/worship-studio/StudioSidebar";
import { StudioMainPanel } from "@/components/worship-studio/StudioMainPanel";
import { StudioBGMBar } from "@/components/worship-studio/StudioBGMBar";
import { StudioSettingsDialog } from "@/components/worship-studio/StudioSettingsDialog";

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
  
  // Settings dialog state
  const [showSettings, setShowSettings] = useState(false);
  
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
    // Update URL without full navigation
    window.history.replaceState(null, '', `/rooms/${studioId}`);
  };
  
  const handleClearSelection = () => {
    setSelectedStudioId(null);
    window.history.replaceState(null, '', '/rooms');
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
      <SEOHead 
        title={t("studio.title")} 
        description={t("studio.description")} 
      />
      
      {/* Header with back button */}
      <StudioHeader 
        onBack={handleBack}
        onSettings={() => setShowSettings(true)}
      />
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Desktop: Show sidebar */}
        {!isMobile && (
          <StudioSidebar 
            onStudioSelect={handleStudioSelect}
            selectedStudioId={selectedStudioId}
          />
        )}
        
        {/* Main panel with tabs */}
        <StudioMainPanel
          myStudioId={myStudio?.id}
          selectedStudioId={selectedStudioId}
          onStudioSelect={handleStudioSelect}
        />
      </div>
      
      {/* BGM Bar - shows when viewing a studio with BGM */}
      {bgmVideoId && currentStudio?.bgm_song && (
        <StudioBGMBar
          songTitle={currentStudio.bgm_song.title}
          songArtist={currentStudio.bgm_song.artist}
          videoId={bgmVideoId}
          roomId={currentStudio.id}
          ownerName={currentStudio.owner?.full_name || undefined}
        />
      )}
      
      {/* Settings Dialog */}
      {myStudio && (
        <StudioSettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          room={myStudio}
        />
      )}
    </div>
  );
}
