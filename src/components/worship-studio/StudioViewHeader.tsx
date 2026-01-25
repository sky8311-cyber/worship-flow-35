import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Share2, Lock, Users, Globe, Crown } from "lucide-react";
import { FriendRequestButton } from "@/components/worship-rooms/FriendRequestButton";
import { StudioSettingsDialog } from "./StudioSettingsDialog";
import { ShareReferralDialog } from "@/components/ShareReferralDialog";
import type { WorshipRoom } from "@/hooks/useWorshipRoom";

interface StudioViewHeaderProps {
  room: WorshipRoom;
  isOwnRoom?: boolean;
}

const visibilityIcons = {
  private: Lock,
  friends: Users,
  public: Globe,
};

const visibilityColors = {
  private: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  friends: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  public: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

export function StudioViewHeader({ room, isOwnRoom = false }: StudioViewHeaderProps) {
  const { t, language } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  
  const VisibilityIcon = visibilityIcons[room.visibility];
  const isAmbassador = room.owner?.is_ambassador;
  
  // Theme config for background
  const themeConfig = room.theme_config as { backgroundColor?: string; wallpaper?: string } | null;
  const backgroundColor = themeConfig?.backgroundColor || "hsl(var(--muted))";
  
  return (
    <>
      {/* Cover/Header Area */}
      <div 
        className="relative h-32 sm:h-40"
        style={{ backgroundColor }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end gap-4">
            {/* Avatar */}
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-background">
              <AvatarImage src={room.owner?.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {room.owner?.full_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold truncate">
                  {room.owner?.full_name || (language === "ko" ? "알 수 없음" : "Unknown")}
                </h1>
                {isAmbassador && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                    <Crown className="h-3 w-3 mr-1" />
                    {language === "ko" ? "앰버서더" : "Ambassador"}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={visibilityColors[room.visibility]}>
                  <VisibilityIcon className="h-3 w-3 mr-1" />
                  {language === "ko" 
                    ? { private: "비공개", friends: "친구 공개", public: "전체 공개" }[room.visibility]
                    : { private: "Private", friends: "Friends", public: "Public" }[room.visibility]}
                </Badge>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 pb-1">
              {isOwnRoom ? (
                <>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setSettingsOpen(true)}
                    className="h-9"
                  >
                    <Settings className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{language === "ko" ? "설정" : "Settings"}</span>
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setShareOpen(true)}
                    className="h-9"
                  >
                    <Share2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{language === "ko" ? "공유" : "Share"}</span>
                  </Button>
                </>
              ) : (
                <>
                  <FriendRequestButton targetUserId={room.owner_user_id} />
                  <Button 
                    variant="secondary" 
                    size="icon"
                    onClick={() => setShareOpen(true)}
                    className="h-9 w-9"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {isOwnRoom && (
        <StudioSettingsDialog 
          room={room}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      )}
      
      <ShareReferralDialog 
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </>
  );
}
