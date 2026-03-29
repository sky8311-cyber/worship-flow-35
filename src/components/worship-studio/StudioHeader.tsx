import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { ProfileDropdownMenu } from "./ProfileDropdownMenu";
import worshipAtelierLogo from "@/assets/worship-atelier-logo.png";

interface StudioHeaderProps {
  onBack: () => void;
  onShare?: () => void;
  onNotifications?: () => void;
}

export function StudioHeader({ 
  onBack, 
  onShare,
  onNotifications,
}: StudioHeaderProps) {
  return (
    <header className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <img 
          src={worshipAtelierLogo} 
          alt="Worship Atelier" 
          className="h-7 object-contain"
        />
      </div>
      
      <div className="flex items-center gap-1">
        {onNotifications && (
          <Button variant="ghost" size="icon" onClick={onNotifications} className="h-9 w-9">
            <Bell className="h-5 w-5" />
          </Button>
        )}
        
        <ProfileDropdownMenu
          onShare={onShare}
          onExit={onBack}
        />
      </div>
    </header>
  );
}
