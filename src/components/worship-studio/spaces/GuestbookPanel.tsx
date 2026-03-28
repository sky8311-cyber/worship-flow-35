import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useGuestbook, useCreateGuestbookEntry, useDeleteGuestbookEntry } from "@/hooks/useGuestbook";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GuestbookEntry } from "./GuestbookEntry";

interface GuestbookPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  roomOwnerId?: string;
}

export function GuestbookPanel({ open, onOpenChange, spaceId, roomOwnerId }: GuestbookPanelProps) {
  const { user } = useAuth();
  const { language } = useTranslation();
  const { data: entries = [] } = useGuestbook(spaceId);
  const createEntry = useCreateGuestbookEntry();
  const deleteEntry = useDeleteGuestbookEntry();
  const [body, setBody] = useState("");

  const t = (ko: string, en: string) => (language === "ko" ? ko : en);

  const handleSubmit = () => {
    if (!user || !body.trim()) return;
    createEntry.mutate(
      { space_id: spaceId, author_user_id: user.id, body: body.trim() },
      { onSuccess: () => setBody("") }
    );
  };

  const handleDelete = (entryId: string) => {
    if (!window.confirm(t("삭제하시겠습니까?", "Delete this entry?"))) return;
    deleteEntry.mutate({ id: entryId, spaceId });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border/40">
          <SheetTitle className="text-base">📬 {t("방명록", "Guestbook")}</SheetTitle>
          <SheetDescription className="text-[11px]">
            {t("방명록 글은 모두 공개됩니다", "All entries are public")}
          </SheetDescription>
        </SheetHeader>

        {/* Entries list */}
        <ScrollArea className="flex-1">
          {entries.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {t("아직 방명록이 없어요", "No entries yet")}
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {entries.map((entry) => (
                <GuestbookEntry
                  key={entry.id}
                  entry={entry}
                  canDelete={
                    user?.id === entry.author_user_id || user?.id === roomOwnerId
                  }
                  onDelete={() => handleDelete(entry.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Write form */}
        <div className="border-t border-border/40 p-3 space-y-2">
          {user ? (
            <>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("방명록을 남겨보세요...", "Leave a message...")}
                className="text-sm min-h-[60px] max-h-[120px]"
                autoResize
              />
              <Button
                size="sm"
                className="w-full bg-[#b8902a] hover:bg-[#a07d24] text-white"
                disabled={!body.trim() || createEntry.isPending}
                onClick={handleSubmit}
              >
                {t("작성하기", "Submit")}
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              {t("로그인이 필요해요", "Please sign in to write")}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
