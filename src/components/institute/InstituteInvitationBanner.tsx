import { usePendingInvitations, useAcceptInvitation } from "@/hooks/useInstituteInvitations";
import { useTranslation } from "@/hooks/useTranslation";
import { X, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function InstituteInvitationBanner() {
  const { language } = useTranslation();
  const { data: invitations = [] } = usePendingInvitations();
  const acceptMutation = useAcceptInvitation();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = invitations.filter((inv) => !dismissed.has(inv.id));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {visible.map((inv) => {
        const courseName =
          language === "ko"
            ? (inv.institute_courses as any)?.title_ko || (inv.institute_courses as any)?.title
            : (inv.institute_courses as any)?.title || (inv.institute_courses as any)?.title_ko;

        return (
          <Card key={inv.id} className="border-primary/20 bg-primary/5">
            <CardContent className="p-3 flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 text-sm text-foreground leading-snug">
                {language === "ko" ? (
                  <>
                    <strong>{courseName}</strong> 수강에 초대되었습니다
                  </>
                ) : (
                  <>
                    You've been invited to <strong>{courseName}</strong>
                  </>
                )}
              </div>
              <Button
                size="sm"
                variant="default"
                className="text-xs whitespace-nowrap"
                disabled={acceptMutation.isPending}
                onClick={() => {
                  acceptMutation.mutate(inv.id, {
                    onSuccess: () => {
                      toast({ title: language === "ko" ? "초대를 수락했습니다" : "Invitation accepted" });
                    },
                  });
                }}
              >
                {language === "ko" ? "수락하기" : "Accept"}
              </Button>
              <button
                onClick={() => setDismissed((prev) => new Set(prev).add(inv.id))}
                className="bg-transparent border-none p-1 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
