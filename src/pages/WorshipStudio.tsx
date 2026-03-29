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
import { NeighborActionHandler } from "@/components/worship-studio/NeighborActionHandler";
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
  const { user, isAdmin } = useAuth();
  const { t, language } = useTranslation();
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

  if (!settingsLoading && !isStudioEnabled && !isAdmin) {
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

  const isOwnStudio = !selectedStudioId || selectedStudioId === myStudio?.id;
  const studioOwnerUserId = currentStudio?.owner_user_id;
  const studioOwnerName = currentStudio?.owner?.full_name || null;
  
  const bgmVideoId = currentStudio?.bgm_song?.youtube_url 
    ? extractVideoId(currentStudio.bgm_song.youtube_url)
    : null;
  
  const handleBack = () => navigate('/dashboard');
  
  const handleStudioSelect = (studioId: string) => {
    setSelectedStudioId(studioId);
    setMobileAptOpen(false);
    window.history.replaceState(null, '', `/studio/${studioId}`);
  };
  
  const handleMyStudioSelect = () => {
    setSelectedStudioId(null);
    setMobileAptOpen(false);
    window.history.replaceState(null, '', '/studio');
  };

  return (
    <NeighborActionHandler
      targetUserId={!isOwnStudio ? studioOwnerUserId : undefined}
      targetName={studioOwnerName || undefined}
    >
      {({ status: neighborStatus, onAction: onAddNeighbor }) => (
        <div className="fixed inset-0 bg-[#faf7f2] dark:bg-background z-50 flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-noise opacity-[0.025] z-0" />
          <SEOHead title={t("studio.title")} description={t("studio.description")} />
          
          <StudioHeader 
            onBack={handleBack}
            onShare={() => setShowShare(true)}
          />
          
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
              bgmSongTitle={currentStudio?.bgm_song?.title || null}
              bgmSongArtist={currentStudio?.bgm_song?.artist || null}
              bgmVideoId={bgmVideoId || null}
              bgmRoomId={currentStudio?.id || null}
              bgmOwnerName={currentStudio?.owner?.full_name || null}
              marqueeText={currentStudio?.marquee_text}
              marqueeTextColor={currentStudio?.marquee_text_color}
              marqueeBgColor={currentStudio?.marquee_bg_color}
              marqueeSpeed={currentStudio?.marquee_speed}
              onOpenSettings={() => setShowSettings(true)}
              onAddNeighbor={!isOwnStudio ? onAddNeighbor : undefined}
              neighborStatus={!isOwnStudio ? neighborStatus : undefined}
            />
          </div>

          {isMobile && (
            <button
              onClick={() => setMobileAptOpen(true)}
              className="fixed bottom-20 left-4 z-40 w-12 h-12 rounded-full bg-[#b8902a] text-white shadow-lg flex items-center justify-center hover:bg-[#a07d24] transition-colors"
            >
              <Building2 size={22} />
            </button>
          )}

          {isMobile && (
            <Sheet open={mobileAptOpen} onOpenChange={setMobileAptOpen}>
              <SheetContent side="bottom" className="h-[75vh] p-0 rounded-t-2xl overflow-hidden">
                <SheetHeader className="sr-only">
                  <SheetTitle>K-Worship Studio</SheetTitle>
                </SheetHeader>
                <div className="h-full overflow-hidden">
                  <StudioSidePanel
                    myStudioId={myStudio?.id}
                    onStudioSelect={handleStudioSelect}
                    onMyStudioSelect={handleMyStudioSelect}
                    mode="mobile"
                  />
                </div>
              </SheetContent>
            </Sheet>
          )}
          
          {myStudio && (
            <StudioSettingsDialog
              open={showSettings}
              onOpenChange={setShowSettings}
              room={myStudio}
            />
          )}
          
          <ShareReferralDialog open={showShare} onOpenChange={setShowShare} />
        </div>
      )}
    </NeighborActionHandler>
  );
}
