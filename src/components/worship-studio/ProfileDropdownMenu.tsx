import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Settings, 
  Share2, 
  Music, 
  Eye, 
  HelpCircle, 
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileDropdownMenuProps {
  onSettings?: () => void;
  onShare?: () => void;
  onBGM?: () => void;
  onVisibility?: () => void;
  onHelp?: () => void;
  onExit?: () => void;
  className?: string;
}

export function ProfileDropdownMenu({
  onSettings,
  onShare,
  onBGM,
  onVisibility,
  onHelp,
  onExit,
  className,
}: ProfileDropdownMenuProps) {
  const { user, profile } = useAuth();
  const { language } = useTranslation();
  
  const avatarUrl = profile?.avatar_url;
  const fullName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = fullName.charAt(0).toUpperCase();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={cn(
            "flex items-center gap-1.5 rounded-full hover:bg-muted/50 p-1 pr-2 transition-colors",
            className
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-sm bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {onSettings && (
          <DropdownMenuItem onClick={onSettings}>
            <Settings className="mr-2 h-4 w-4" />
            {language === "ko" ? "스튜디오 설정" : "Studio Settings"}
          </DropdownMenuItem>
        )}
        
        {onShare && (
          <DropdownMenuItem onClick={onShare}>
            <Share2 className="mr-2 h-4 w-4" />
            {language === "ko" ? "링크 공유" : "Share Link"}
          </DropdownMenuItem>
        )}
        
        {onBGM && (
          <DropdownMenuItem onClick={onBGM}>
            <Music className="mr-2 h-4 w-4" />
            {language === "ko" ? "BGM 설정" : "BGM Settings"}
          </DropdownMenuItem>
        )}
        
        {onVisibility && (
          <DropdownMenuItem onClick={onVisibility}>
            <Eye className="mr-2 h-4 w-4" />
            {language === "ko" ? "공개 설정" : "Visibility"}
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {onHelp && (
          <DropdownMenuItem onClick={onHelp}>
            <HelpCircle className="mr-2 h-4 w-4" />
            {language === "ko" ? "도움말" : "Help"}
          </DropdownMenuItem>
        )}
        
        {onExit && (
          <DropdownMenuItem onClick={onExit}>
            <LogOut className="mr-2 h-4 w-4" />
            {language === "ko" ? "나가기" : "Exit"}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
