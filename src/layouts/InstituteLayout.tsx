import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileDropdownMenu } from "@/components/worship-studio/ProfileDropdownMenu";

interface InstituteLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function InstituteLayout({ children, pageTitle }: InstituteLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isMain = location.pathname === "/institute";

  return (
    <div className="inst-root">
      {/* Header — Studio pattern */}
      <header
        className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0"
        style={{ background: '#ffffff', borderColor: '#e8e6e0' }}
      >
        {/* Left */}
        {isMain ? (
          <div className="flex items-center gap-2">
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#b8902a' }}>
                K-Worship
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.3px', color: '#1a1a1a' }}>
                Institute
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>
              {pageTitle || '인스티튜트'}
            </span>
          </div>
        )}

        {/* Right — ProfileDropdownMenu */}
        <ProfileDropdownMenu
          onExit={() => navigate('/')}
        />
      </header>

      {/* Content */}
      <main className="inst-content">{children}</main>
    </div>
  );
}
