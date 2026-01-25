import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Users, Bell } from "lucide-react";

interface StudioHeaderProps {
  onBack: () => void;
  onSettings?: () => void;
  onFriends?: () => void;
  onNotifications?: () => void;
}

export function StudioHeader({ 
  onBack, 
  onSettings, 
  onFriends, 
  onNotifications 
}: StudioHeaderProps) {
  const { language } = useTranslation();
  
  const title = language === "ko" ? "예배공작소" : "Worship Studio";
  const tagline = language === "ko" 
    ? "예배는 삶입니다. 공작소는 그 삶이 쌓이는 곳입니다." 
    : "Worship is a life. The Studio is where it accumulates.";
  
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">{tagline}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {onFriends && (
          <Button variant="ghost" size="icon" onClick={onFriends} className="h-9 w-9">
            <Users className="h-5 w-5" />
          </Button>
        )}
        {onNotifications && (
          <Button variant="ghost" size="icon" onClick={onNotifications} className="h-9 w-9">
            <Bell className="h-5 w-5" />
          </Button>
        )}
        {onSettings && (
          <Button variant="ghost" size="icon" onClick={onSettings} className="h-9 w-9">
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}
