import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Palette, Building2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorshipRoom, useWorshipRoomById } from "@/hooks/useWorshipRoom";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { SEOHead } from "@/components/seo/SEOHead";
import { StudioHeader } from "@/components/worship-studio/StudioHeader";
import { StudioSidePanel } from "@/components/worship-studio/StudioSidePanel";
import { StudioMainPanel, type PageNavInfo } from "@/components/worship-studio/StudioMainPanel";
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
  const [pageNavInfo, setPageNavInfo] = useState<PageNavInfo | null>(null);
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
        featureName="Worship Atelier"
        featureNameKo="워십 아틀리에"
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
              onOpenSettings={() => setShowSettings(true)}
              onAddNeighbor={!isOwnStudio ? onAddNeighbor : undefined}
              neighborStatus={!isOwnStudio ? neighborStatus : undefined}
              onPageNavInfo={setPageNavInfo}
            />
          </div>

          {/* Floating page navigation bar - hide when mobile sheet is open */}
          {!mobileAptOpen && pageNavInfo && (
            <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[55] flex items-center gap-3 rounded-full bg-[hsl(var(--background))]/90 backdrop-blur-sm border border-border shadow-sm px-5 py-1 h-10 min-w-[280px]">
              <span className="text-xs font-mono text-muted-foreground">{pageNavInfo.pageIndicator}</span>
              {isOwnStudio && (
                <button
                  onClick={pageNavInfo.handleAddPage}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(var(--muted))]/60 hover:bg-[hsl(var(--muted))] text-foreground text-[11px] font-medium transition-colors whitespace-nowrap"
                >
                  <Plus className="h-3 w-3" />
                  {language === "ko" ? "새 페이지" : "New Page"}
                </button>
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => pageNavInfo.navigatePage("left")}
                  disabled={!pageNavInfo.canGoPrev}
                  className="p-1.5 rounded-md hover:bg-accent transition disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4 text-foreground" />
                </button>
                <button
                  onClick={() => pageNavInfo.navigatePage("right")}
                  disabled={!pageNavInfo.canGoNext}
                  className="p-1.5 rounded-md hover:bg-accent transition disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight className="h-4 w-4 text-foreground" />
                </button>
              </div>
            </div>
          )}

          {isMobile && !mobileAptOpen && (
            <button
              onClick={() => setMobileAptOpen(true)}
              className="fixed bottom-2 left-0 z-[55] h-10 w-14 bg-[#b8902a] text-white flex items-center justify-center hover:bg-[#a07d24] transition-colors rounded-r-xl"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <Building2 size={20} />
            </button>
          )}

          {isMobile && (
            <Sheet open={mobileAptOpen} onOpenChange={setMobileAptOpen}>
              <SheetContent side="bottom" className="h-[93dvh] max-h-[93dvh] p-0 rounded-t-2xl overflow-hidden flex flex-col [&>button:last-child]:top-2 [&>button:last-child]:right-3">
                <SheetHeader className="sr-only">
                  <SheetTitle>Worship Atelier</SheetTitle>
                </SheetHeader>
                <div
                  className="flex-shrink-0 flex justify-center pt-3 pb-1 cursor-grab"
                  onTouchStart={(e) => {
                    (e.currentTarget as any)._touchStartY = e.touches[0].clientY;
                  }}
                  onTouchEnd={(e) => {
                    const startY = (e.currentTarget as any)._touchStartY;
                    if (startY != null) {
                      const delta = e.changedTouches[0].clientY - startY;
                      if (delta > 80) setMobileAptOpen(false);
                    }
                    (e.currentTarget as any)._touchStartY = null;
                  }}
                >
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
                <div className="flex-1 min-h-0 overflow-hidden pb-[env(safe-area-inset-bottom,0px)]">
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
