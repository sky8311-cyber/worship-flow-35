import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { parseLocalDate } from "@/lib/countdownHelper";
import { Cake, Music, Calendar } from "lucide-react";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
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
    } else if (notification.related_type === "calendar_event" && notification.related_id) {
      navigate("/dashboard");
    } else if (notification.related_type === "member" && notification.related_id) {
      navigate("/admin/users");
    } else if (notification.related_type === "profile" && notification.related_id && notification.type === "birthday") {
      // Birthday notification - could open profile or stay on dashboard
      navigate("/dashboard");
    }
  };

  const actorAvatar = notification.metadata?.actor_avatar;
  const actorName = notification.metadata?.actor_name || "User";
  const timeAgo = formatDistanceToNow(parseLocalDate(notification.created_at), { addSuffix: true });
  const isBirthday = notification.type === "birthday";
  const isWorshipSet = notification.type === "new_worship_set";
  const isCalendarEvent = notification.type === "new_calendar_event";

  return (
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
      ) : (
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={actorAvatar} alt={actorName} />
          <AvatarFallback>{actorName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold">{actorName}</span>{" "}
          <span className="text-muted-foreground">
            {notification.message.replace(actorName, "").trim()}
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}
