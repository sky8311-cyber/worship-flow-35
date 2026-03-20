import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileDropdownMenu } from "@/components/worship-studio/ProfileDropdownMenu";
import { InstituteBottomNav } from "@/components/institute/InstituteBottomNav";
import { useAppSettings } from "@/hooks/useAppSettings";
import instituteLogo from "@/assets/kworship-institute-logo.png";

interface InstituteLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function InstituteLayout({ children, pageTitle }: InstituteLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isInstituteEnabled, isLoading } = useAppSettings();

  if (!isLoading && !isInstituteEnabled) {
    return <Navigate to="/dashboard" replace />;
  }

  const isMain = location.pathname === "/institute";
  const showBottomNav = true;

  return (
    <div className="inst-root">
      {/* Header */}
      <header
        className="flex items-center px-3 py-4 border-b flex-shrink-0"
        style={{ background: '#ffffff', borderColor: '#e8e6e0' }}
      >
        <div className="w-10 flex items-center">
          {!isMain && (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex-1 flex justify-center items-center">
          {isMain ? (
            <img
              src={instituteLogo}
              alt="K-Worship Institute"
              style={{ height: 128, width: 'auto' }}
            />
          ) : (
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>
              {pageTitle || '인스티튜트'}
            </span>
          )}
        </div>

        <div className="w-10 flex justify-end">
          <ProfileDropdownMenu onExit={() => navigate('/')} />
        </div>
      </header>

      {/* Content */}
      <main className="inst-content">{children}</main>

      {/* Bottom Navigation — main page only */}
      {showBottomNav && <InstituteBottomNav />}
    </div>
  );
}
