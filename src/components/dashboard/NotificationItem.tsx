import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { parseLocalDate } from "@/lib/countdownHelper";
import { Cake, Music, Calendar, Users, Sparkles, Crown, ArrowDown, XCircle } from "lucide-react";
import { AvatarWithLevel } from "@/components/seeds/AvatarWithLevel";
import { useState, useEffect } from "react";
import { LevelUpDialog } from "@/components/seeds/LevelUpDialog";
import { useTranslation } from "@/hooks/useTranslation";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [showLevelUpDialog, setShowLevelUpDialog] = useState(false);

  const isLevelUp = notification.type === "level_up";
  const isCollaboratorInvited = notification.type === "collaborator_invited";
  const isRolePromotion = ["promoted_to_owner", "promoted_to_community_leader", "promoted_to_worship_leader"].includes(notification.type);
  const isRoleDemotion = notification.type === "demoted_to_member";
  const isNewWorshipLeaderApplication = notification.type === "new_worship_leader_application";
  const isWorshipLeaderRejected = notification.type === "worship_leader_rejected";

  useEffect(() => {
    if (isLevelUp && !notification.is_read) {
      setShowLevelUpDialog(true);
    }
  }, [isLevelUp, notification.is_read]);

  const formatBirthDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    if (language === "ko") {
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    }
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }

    // Level up opens dialog instead of navigating
    if (isLevelUp) {
      setShowLevelUpDialog(true);
      return;
    }

    // Navigate to related content
    if (notification.related_type === "post" && notification.related_id) {
      navigate("/dashboard");
    } else if (notification.related_type === "community" && notification.related_id) {
      navigate(`/community/${notification.related_id}`);
    } else if (notification.related_type === "song" && notification.related_id) {
      navigate("/songs");
    } else if (notification.related_type === "worship_set" && notification.related_id) {
      navigate(`/band-view/${notification.related_id}`);
    } else if (notification.related_type === "service_set" && notification.related_id) {
      // For collaborator invitations - navigate to set builder
      navigate(`/set-builder/${notification.related_id}`);
    } else if (notification.related_type === "calendar_event" && notification.related_id) {
      navigate("/dashboard");
    } else if (notification.related_type === "member" && notification.related_id) {
      navigate("/admin/users");
    } else if (notification.related_type === "profile" && notification.related_id && notification.type === "birthday") {
      navigate("/dashboard");
    } else if (notification.related_type === "join_request" && notification.metadata?.community_id) {
      navigate(`/community/${notification.metadata.community_id}`);
    } else if (notification.related_type === "seeds") {
      navigate("/seeds");
    } else if (notification.related_type === "role") {
      // For worship leader promotion - navigate to dashboard
      navigate("/dashboard");
    } else if (notification.related_type === "worship_leader_application") {
      // Navigate to admin applications page
      navigate("/admin/applications");
    }
  };

  const actorAvatar = notification.metadata?.actor_avatar;
  const actorName = notification.metadata?.actor_name || notification.metadata?.promoter_name || null;
  const actorUserId = notification.metadata?.actor_id;
  const timeAgo = formatDistanceToNow(parseLocalDate(notification.created_at), { addSuffix: true });
  const displayName = actorName || (language === "ko" ? "시스템" : "System");
  const isBirthday = notification.type === "birthday";
  const isWorshipSet = notification.type === "new_worship_set";
  const isCalendarEvent = notification.type === "new_calendar_event";
  const isNewSong = notification.type === "new_song";
  const isJoinRequest = notification.type === "join_request";
  const isJoinApproved = notification.type === "join_approved";
  const isJoinRejected = notification.type === "join_rejected";
  const isCollaboratorInvite = notification.type === "collaborator_invited";

  return (
    <>
      <div
        onClick={handleClick}
        className={`flex items-start gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors ${
          !notification.is_read ? "bg-primary/5" : ""
        }`}
      >
        {!notification.is_read && (
          <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
        )}
        {isBirthday ? (
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            <Cake className="h-5 w-5 text-primary" />
          </div>
        ) : isWorshipSet ? (
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            <Music className="h-5 w-5 text-primary" />
          </div>
        ) : isCalendarEvent ? (
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
        ) : isNewSong ? (
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            <Music className="h-5 w-5 text-primary" />
          </div>
        ) : isJoinRequest || isJoinApproved || isJoinRejected ? (
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
        ) : isCollaboratorInvite ? (
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
        ) : isRolePromotion ? (
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
            <Crown className="h-5 w-5 text-white" />
          </div>
        ) : isNewWorshipLeaderApplication ? (
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Crown className="h-5 w-5 text-white" />
          </div>
        ) : isRoleDemotion ? (
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-muted flex items-center justify-center">
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : isWorshipLeaderRejected ? (
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-destructive" />
          </div>
        ) : isLevelUp ? (
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
        ) : actorUserId ? (
          <AvatarWithLevel
            userId={actorUserId}
            avatarUrl={actorAvatar}
            fallback={displayName.charAt(0)}
            size="md"
            className="h-10 w-10 flex-shrink-0"
          />
        ) : (
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={actorAvatar} alt={displayName} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex-1 min-w-0">
          {isBirthday ? (
            <p className="text-sm">
              <span className="font-semibold">{displayName}</span>{" "}
              <span className="text-muted-foreground">
                {actorName ? notification.message.replace(actorName, "").trim() : notification.message}
              </span>
              {notification.metadata?.birth_date && (
                <span className="text-muted-foreground"> ({formatBirthDate(notification.metadata.birth_date as string)})</span>
              )}
            </p>
          ) : isNewSong ? (
            <p className="text-sm">
              {actorName ? (
                <>
                  <span className="font-semibold">{actorName}</span>
                  <span className="text-muted-foreground"> added a new song</span>
                  {notification.metadata?.song_title && (
                    <span className="font-medium"> "{notification.metadata.song_title}"</span>
                  )}
                  {notification.metadata?.song_artist && (
                    <span className="text-muted-foreground"> by {notification.metadata.song_artist}</span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">New song added</span>
                  {notification.metadata?.song_title && (
                    <span className="font-medium"> "{notification.metadata.song_title}"</span>
                  )}
                  {notification.metadata?.song_artist && (
                    <span className="text-muted-foreground"> by {notification.metadata.song_artist}</span>
                  )}
                </>
              )}
            </p>
          ) : (
            <p className="text-sm">
              {actorName && <><span className="font-semibold">{actorName}</span>{" "}</>}
              <span className="text-muted-foreground">
                {actorName ? notification.message.replace(actorName, "").trim() : notification.message}
              </span>
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
        </div>
      </div>

      {isLevelUp && notification.metadata && (
        <LevelUpDialog
          open={showLevelUpDialog}
          onOpenChange={setShowLevelUpDialog}
          level={notification.metadata.new_level as number}
          levelName={notification.metadata.level_name_ko as string}
          emoji={notification.metadata.emoji as string}
        />
      )}
    </>
  );
}
