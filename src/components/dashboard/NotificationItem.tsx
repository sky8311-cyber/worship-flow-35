import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { parseLocalDate } from "@/lib/countdownHelper";

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
    }
  };

  const actorAvatar = notification.metadata?.actor_avatar;
  const actorName = notification.metadata?.actor_name || "User";
  const timeAgo = formatDistanceToNow(parseLocalDate(notification.created_at), { addSuffix: true });

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
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={actorAvatar} alt={actorName} />
        <AvatarFallback>{actorName.charAt(0)}</AvatarFallback>
      </Avatar>
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
