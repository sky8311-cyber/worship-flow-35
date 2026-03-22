import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useSendInvitation, useSentInvitations } from "@/hooks/useInstituteInvitations";
import { toast } from "@/hooks/use-toast";
import { Send, Check, Clock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const { data: courses = [] } = useQuery({
    queryKey: ["institute-courses-published"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_courses").select("id, title, title_ko").eq("is_published", true).order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

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
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
          {language === "ko" ? "수강 초대" : "Course Invitations"}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Course select */}
      <div className="mt-3">
        <label className="text-xs text-muted-foreground block mb-1.5">
          {language === "ko" ? "과목 선택" : "Select Course"}
        </label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full py-2.5 px-3 text-sm rounded-lg border border-border bg-card text-foreground"
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
      <div className="mt-4">
        <label className="text-xs text-muted-foreground block mb-1.5">
          {language === "ko" ? "팀원 선택" : "Select Members"} ({selectedMembers.size})
        </label>
        {members.length === 0 ? (
          <div className="text-xs text-muted-foreground py-3">
            {language === "ko" ? "팀원이 없습니다" : "No team members found"}
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
            {members.map((m) => {
              const profile = m.profiles as any;
              const isSelected = selectedMembers.has(m.user_id);
              return (
                <Card
                  key={m.user_id}
                  className={`cursor-pointer transition-colors ${isSelected ? "border-primary/30 bg-primary/5" : ""}`}
                  onClick={() => toggleMember(m.user_id)}
                >
                  <CardContent className="p-2.5 flex items-center gap-2.5">
                    <div
                      className={`w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 border-2 ${
                        isSelected ? "border-primary bg-primary" : "border-border bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {profile?.full_name || profile?.email || m.user_id}
                      </div>
                      {profile?.email && profile?.full_name && (
                        <div className="text-[11px] text-muted-foreground">{profile.email}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Send button */}
      <Button
        className="mt-4 w-full"
        disabled={!selectedCourse || selectedMembers.size === 0 || sendInvitation.isPending}
        onClick={handleSend}
      >
        <Send className="w-3.5 h-3.5 mr-1.5" />
        {language === "ko"
          ? `${selectedMembers.size}명에게 초대 보내기`
          : `Send to ${selectedMembers.size} member${selectedMembers.size !== 1 ? "s" : ""}`}
      </Button>

      {/* Sent invitations table */}
      {sentInvitations.length > 0 && (
        <div className="mt-6">
          <div className="text-xs font-semibold text-foreground mb-2">
            {language === "ko" ? "초대 현황" : "Invitation Status"}
          </div>
          <div className="flex flex-col gap-1">
            {sentInvitations.map((inv) => {
              const profile = (inv as any).profiles;
              const course = inv.institute_courses as any;
              return (
                <Card key={inv.id}>
                  <CardContent className="p-2.5 flex items-center gap-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {profile?.full_name || profile?.email || "—"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {language === "ko" ? course?.title_ko : course?.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {inv.status === "accepted" ? (
                        <Badge variant="default" className="text-[10px]">
                          <Check className="w-3 h-3 mr-0.5" />
                          {language === "ko" ? "수락" : "Accepted"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          <Clock className="w-3 h-3 mr-0.5" />
                          {language === "ko" ? "대기중" : "Pending"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
