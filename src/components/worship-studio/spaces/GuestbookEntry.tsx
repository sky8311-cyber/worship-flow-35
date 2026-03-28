import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";
import type { GuestbookEntry as GuestbookEntryType } from "@/hooks/useGuestbook";

interface GuestbookEntryProps {
  entry: GuestbookEntryType;
  canDelete: boolean;
  onDelete: () => void;
}

export function GuestbookEntry({ entry, canDelete, onDelete }: GuestbookEntryProps) {
  const { language } = useTranslation();

  return (
    <div className="py-3 px-4">
      <div className="flex items-start gap-2.5">
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarImage src={entry.author?.avatar_url || undefined} />
          <AvatarFallback className="text-[10px]">
            {entry.author?.full_name?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">
              {entry.author?.full_name || "익명"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {entry.created_at
                ? formatDistanceToNow(new Date(entry.created_at), {
                    addSuffix: true,
                    locale: language === "ko" ? ko : enUS,
                  })
                : ""}
            </span>
          </div>
          <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap break-words">
            {entry.body}
          </p>
        </div>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
