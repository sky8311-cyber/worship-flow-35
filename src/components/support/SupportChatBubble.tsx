import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { SupportMessage } from "@/hooks/useSupportChat";
import { Headset } from "lucide-react";

interface SupportChatBubbleProps {
  message: SupportMessage;
  isOwn: boolean;
}

export function SupportChatBubble({ message, isOwn }: SupportChatBubbleProps) {
  const isAdmin = message.sender_type === "admin";
  const displayName = isAdmin
    ? "Support Team"
    : message.profiles?.display_name || "User";
  const avatarUrl = message.profiles?.avatar_url;

  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%]",
        isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        {isAdmin ? (
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Headset className="h-4 w-4" />
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback>
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </>
        )}
      </Avatar>

      {/* Message content */}
      <div className={cn("flex flex-col gap-1", isOwn && "items-end")}>
        {/* Sender name for admin messages */}
        {isAdmin && !isOwn && (
          <span className="text-xs font-medium text-primary">
            {displayName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2 max-w-full break-words",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : isAdmin
              ? "bg-primary/10 text-foreground rounded-bl-md border border-primary/20"
              : "bg-muted text-foreground rounded-bl-md"
          )}
        >
          {/* Images */}
          {message.image_urls && message.image_urls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.image_urls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt=""
                  className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                />
              ))}
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground">
          {format(new Date(message.created_at), "HH:mm")}
        </span>
      </div>
    </div>
  );
}
