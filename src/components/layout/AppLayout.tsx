import { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomTabNavigation } from "./BottomTabNavigation";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

interface AppLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  backPath?: string;
  breadcrumb?: React.ReactNode;
  fullHeight?: boolean;
}

export const AppLayout = ({ children, showBackButton, backPath, breadcrumb, fullHeight }: AppLayoutProps) => {
  const { playerState } = useMusicPlayer();

  // Add extra bottom padding when mini player is visible
  const getBottomPadding = () => {
    if (playerState === 'mini') {
      return 'max(13rem, calc(10rem + env(safe-area-inset-bottom, 0px)))';
    }
    return 'max(9rem, calc(6rem + env(safe-area-inset-bottom, 0px)))';
  };

  if (fullHeight) {
    return (
      <div className="h-[100dvh] flex flex-col bg-gradient-soft">
        <AppHeader showBackButton={showBackButton} backPath={backPath} breadcrumb={breadcrumb} />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
        <BottomTabNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-soft">
      <AppHeader showBackButton={showBackButton} backPath={backPath} breadcrumb={breadcrumb} />
      
      {/* Main content with bottom padding for mobile nav + safe area + mini player */}
      <main 
        className="pb-36 lg:pb-8"
        style={{ paddingBottom: getBottomPadding() }}
      >
        {children}
      </main>
      
      <BottomTabNavigation />
    </div>
  );
};
