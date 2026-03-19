import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileDropdownMenu } from "@/components/worship-studio/ProfileDropdownMenu";
import instituteLogo from "@/assets/kworship-institute-logo.png";

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
      {/* Header — 3-column flex for centered logo */}
      <header
        className="flex items-center px-3 py-2 border-b flex-shrink-0"
        style={{ background: '#ffffff', borderColor: '#e8e6e0' }}
      >
        {/* Left */}
        <div className="w-10 flex items-center">
          {!isMain && (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Center — Logo or page title */}
        <div className="flex-1 flex justify-center items-center">
          {isMain ? (
            <img
              src={instituteLogo}
              alt="K-Worship Institute"
              style={{ height: 32, width: 'auto' }}
            />
          ) : (
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>
              {pageTitle || '인스티튜트'}
            </span>
          )}
        </div>

        {/* Right — ProfileDropdownMenu */}
        <div className="w-10 flex justify-end">
          <ProfileDropdownMenu onExit={() => navigate('/')} />
        </div>
      </header>

      {/* Content */}
      <main className="inst-content">{children}</main>
    </div>
  );
}
