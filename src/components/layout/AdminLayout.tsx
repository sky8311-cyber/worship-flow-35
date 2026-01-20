import { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { BottomTabNavigation } from "./BottomTabNavigation";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { playerState } = useMusicPlayer();

  const getBottomPadding = () => {
    if (playerState === 'mini') {
      return 'max(13rem, calc(10rem + env(safe-area-inset-bottom)))';
    }
    return 'max(9rem, calc(6rem + env(safe-area-inset-bottom)))';
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-soft">
      <AdminNav />
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
