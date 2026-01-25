import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Share2, Lock, Users, Globe, Crown } from "lucide-react";
import { FriendRequestButton } from "./FriendRequestButton";
import { RoomCustomizeDialog } from "./RoomCustomizeDialog";
import { ShareReferralDialog } from "@/components/ShareReferralDialog";
import type { WorshipRoom } from "@/hooks/useWorshipRoom";

interface RoomHeaderProps {
  room: WorshipRoom;
  isOwnRoom?: boolean;
}

const visibilityIcons = {
  private: Lock,
  friends: Users,
  public: Globe,
};

const visibilityColors = {
  private: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  friends: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  public: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export function RoomHeader({ room, isOwnRoom = false }: RoomHeaderProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  
  const VisibilityIcon = visibilityIcons[room.visibility];
  const isAmbassador = room.owner?.is_ambassador;
  
  return (
    <>
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-16 w-16 ring-2 ring-primary/20">
            <AvatarImage src={room.owner?.avatar_url || undefined} />
            <AvatarFallback className="text-lg">
              {room.owner?.full_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            {/* Name and Ambassador Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold truncate">
                {room.owner?.full_name || t("common.deletedUser")}
              </h1>
              {isAmbassador && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  <Crown className="h-3 w-3 mr-1" />
                  {t("rooms.ambassador")}
                </Badge>
              )}
            </div>
            
            {/* Visibility Badge */}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={visibilityColors[room.visibility]}>
                <VisibilityIcon className="h-3 w-3 mr-1" />
                {t(`rooms.visibility.${room.visibility}`)}
              </Badge>
              
              {room.bgm_song && (
                <span className="text-sm text-muted-foreground">
                  🎵 {room.bgm_song.title}
                </span>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isOwnRoom ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCustomizeOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {t("rooms.customize")}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {t("rooms.share")}
                </Button>
              </>
            ) : (
              <>
                <FriendRequestButton targetUserId={room.owner_user_id} />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {isOwnRoom && (
        <RoomCustomizeDialog 
          room={room}
          open={customizeOpen}
          onOpenChange={setCustomizeOpen}
        />
      )}
      
      <ShareReferralDialog 
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </>
  );
}
