import { usePendingInvitations, useAcceptInvitation } from "@/hooks/useInstituteInvitations";
import { useTranslation } from "@/hooks/useTranslation";
import { X, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export function InstituteInvitationBanner() {
  const { language } = useTranslation();
  const { data: invitations = [] } = usePendingInvitations();
  const acceptMutation = useAcceptInvitation();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = invitations.filter((inv) => !dismissed.has(inv.id));
  if (visible.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 20px 0" }}>
      {visible.map((inv) => {
        const courseName =
          language === "ko"
            ? (inv.institute_courses as any)?.title_ko || (inv.institute_courses as any)?.title
            : (inv.institute_courses as any)?.title || (inv.institute_courses as any)?.title_ko;

        return (
          <div
            key={inv.id}
            style={{
              background: "var(--inst-gold-bg, #fdf6e8)",
              border: "1px solid var(--inst-gold-bdr, #e8d090)",
              borderRadius: 10,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Mail className="w-4 h-4" style={{ color: "var(--inst-gold, #b8902a)", flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: "var(--inst-ink, #1a1a1a)", lineHeight: 1.5 }}>
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
            <button
              className="inst-btn-gold-sm"
              style={{ fontSize: 11, padding: "5px 14px", whiteSpace: "nowrap" }}
              disabled={acceptMutation.isPending}
              onClick={() => {
                acceptMutation.mutate(inv.id, {
                  onSuccess: () => {
                    toast({
                      title: language === "ko" ? "초대를 수락했습니다" : "Invitation accepted",
                    });
                  },
                });
              }}
            >
              {language === "ko" ? "수락하기" : "Accept"}
            </button>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(inv.id))}
              style={{
                background: "none",
                border: "none",
                padding: 4,
                cursor: "pointer",
                color: "var(--inst-ink3, #9a9890)",
              }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
