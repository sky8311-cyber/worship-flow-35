import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useSendInvitation, useSentInvitations } from "@/hooks/useInstituteInvitations";
import { toast } from "@/hooks/use-toast";
import { Send, Check, Clock, UserPlus } from "lucide-react";

interface Props {
  churchAccountId: string;
}

export function InstituteInviteSection({ churchAccountId }: Props) {
  const { user } = useAuth();
  const { language } = useTranslation();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const sendInvitation = useSendInvitation();
  const { data: sentInvitations = [] } = useSentInvitations();

  // Published courses
  const { data: courses = [] } = useQuery({
    queryKey: ["institute-courses-published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institute_courses")
        .select("id, title, title_ko")
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  // Church account team members
  const { data: members = [] } = useQuery({
    queryKey: ["church-account-members", churchAccountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("church_account_members")
        .select("user_id, role, profiles:user_id(full_name, email)")
        .eq("church_account_id", churchAccountId);
      if (error) throw error;
      return (data || []).filter((m) => m.user_id !== user?.id);
    },
    enabled: !!churchAccountId,
  });

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSend = () => {
    if (!selectedCourse || selectedMembers.size === 0) return;
    sendInvitation.mutate(
      { userIds: Array.from(selectedMembers), courseId: selectedCourse },
      {
        onSuccess: () => {
          toast({ title: language === "ko" ? "초대를 보냈습니다" : "Invitations sent" });
          setSelectedMembers(new Set());
          setSelectedCourse("");
        },
        onError: () => {
          toast({ title: language === "ko" ? "초대 전송 실패" : "Failed to send invitations", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div style={{ marginTop: 32 }}>
      <div
        className="inst-section-header"
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        <UserPlus className="w-4 h-4" style={{ color: "var(--inst-gold)" }} />
        <span>{language === "ko" ? "수강 초대" : "Course Invitations"}</span>
      </div>

      {/* Course select */}
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 12, color: "var(--inst-ink2)", display: "block", marginBottom: 6 }}>
          {language === "ko" ? "과목 선택" : "Select Course"}
        </label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 13,
            borderRadius: 8,
            border: "1px solid var(--inst-border)",
            background: "var(--inst-surface)",
            color: "var(--inst-ink)",
          }}
        >
          <option value="">{language === "ko" ? "-- 과목을 선택하세요 --" : "-- Select a course --"}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {language === "ko" ? c.title_ko : c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Member list */}
      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: 12, color: "var(--inst-ink2)", display: "block", marginBottom: 6 }}>
          {language === "ko" ? "팀원 선택" : "Select Members"} ({selectedMembers.size})
        </label>
        {members.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--inst-ink3)", padding: "12px 0" }}>
            {language === "ko" ? "팀원이 없습니다" : "No team members found"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
            {members.map((m) => {
              const profile = m.profiles as any;
              const isSelected = selectedMembers.has(m.user_id);
              return (
                <div
                  key={m.user_id}
                  onClick={() => toggleMember(m.user_id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: isSelected
                      ? "1px solid var(--inst-gold-bdr)"
                      : "1px solid var(--inst-border)",
                    background: isSelected ? "var(--inst-gold-bg)" : "var(--inst-surface)",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: isSelected
                        ? "2px solid var(--inst-gold)"
                        : "2px solid var(--inst-border)",
                      background: isSelected ? "var(--inst-gold)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <Check className="w-3 h-3" style={{ color: "#fff" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: "var(--inst-ink)" }}>
                      {profile?.full_name || profile?.email || m.user_id}
                    </div>
                    {profile?.email && profile?.full_name && (
                      <div style={{ fontSize: 11, color: "var(--inst-ink3)" }}>{profile.email}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Send button */}
      <button
        className="inst-btn-gold"
        style={{ marginTop: 16, width: "100%" }}
        disabled={!selectedCourse || selectedMembers.size === 0 || sendInvitation.isPending}
        onClick={handleSend}
      >
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Send className="w-3.5 h-3.5" />
          {language === "ko"
            ? `${selectedMembers.size}명에게 초대 보내기`
            : `Send to ${selectedMembers.size} member${selectedMembers.size !== 1 ? "s" : ""}`}
        </span>
      </button>

      {/* Sent invitations table */}
      {sentInvitations.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--inst-ink)", marginBottom: 8 }}>
            {language === "ko" ? "초대 현황" : "Invitation Status"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sentInvitations.map((inv) => {
              const profile = (inv as any).profiles;
              const course = inv.institute_courses as any;
              return (
                <div
                  key={inv.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--inst-border)",
                    background: "var(--inst-surface)",
                    fontSize: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: "var(--inst-ink)" }}>
                      {profile?.full_name || profile?.email || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--inst-ink3)" }}>
                      {language === "ko" ? course?.title_ko : course?.title}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {inv.status === "accepted" ? (
                      <>
                        <Check className="w-3 h-3" style={{ color: "var(--inst-gold)" }} />
                        <span style={{ color: "var(--inst-gold)", fontWeight: 600 }}>
                          {language === "ko" ? "수락" : "Accepted"}
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" style={{ color: "var(--inst-ink3)" }} />
                        <span style={{ color: "var(--inst-ink3)" }}>
                          {language === "ko" ? "대기중" : "Pending"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
