import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell } from "lucide-react";
import { ProfileDropdownMenu } from "./ProfileDropdownMenu";

interface StudioHeaderProps {
  onBack: () => void;
  onSettings?: () => void;
  onShare?: () => void;
  onBGM?: () => void;
  onVisibility?: () => void;
  onNotifications?: () => void;
}

export function StudioHeader({ 
  onBack, 
  onSettings, 
  onShare,
  onBGM,
  onVisibility,
  onNotifications,
}: StudioHeaderProps) {
  const { language } = useTranslation();
  
  const title = language === "ko" ? "예배공작소" : "Worship Studio";
  
  return (
    <header className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      </div>
      
      <div className="flex items-center gap-1">
        {onNotifications && (
          <Button variant="ghost" size="icon" onClick={onNotifications} className="h-9 w-9">
            <Bell className="h-5 w-5" />
          </Button>
        )}
        
        <ProfileDropdownMenu
          onSettings={onSettings}
          onShare={onShare}
          onBGM={onBGM}
          onVisibility={onVisibility}
          onExit={onBack}
        />
      </div>
    </header>
  );
}
