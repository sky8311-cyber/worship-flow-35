import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserX, Users, Music, Mail, Clock } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


interface AutomatedEmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailType: string;
  triggerDays: number;
  cooldownDays?: number;
}

interface Recipient {
  id: string;
  email: string;
  full_name: string | null;
  last_active_at: string | null;
  days_inactive: number;
  community_name: string | null;
}

const emailTypeLabels: Record<string, { icon: React.ReactNode; label: string; labelKo: string }> = {
  inactive_user: {
    icon: <UserX className="w-5 h-5" />,
    label: "Inactive User Reminder",
    labelKo: "미접속자 리마인더",
  },
  no_team_invite: {
    icon: <Users className="w-5 h-5" />,
    label: "Team Invite Reminder",
    labelKo: "팀원 초대 리마인더",
  },
  no_worship_set: {
    icon: <Music className="w-5 h-5" />,
    label: "Worship Set Reminder",
    labelKo: "워십세트 생성 리마인더",
  },
};

export const AutomatedEmailPreviewDialog = ({
  open,
  onOpenChange,
  emailType,
  triggerDays,
  cooldownDays = 7,
}: AutomatedEmailPreviewDialogProps) => {
  const { language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch recipients
  const { data: recipients = [], isLoading } = useQuery({
    queryKey: ["automated-email-recipients", emailType, triggerDays, cooldownDays],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_automated_email_recipients", {
        p_email_type: emailType,
        p_trigger_days: triggerDays,
        p_cooldown_days: cooldownDays,
      });
      if (error) throw error;
      return (data || []) as Recipient[];
    },
    enabled: open && !!emailType,
  });

  const filteredRecipients = recipients.filter(
    (r) =>
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.community_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const typeInfo = emailTypeLabels[emailType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {typeInfo?.icon}
            {language === "ko" ? typeInfo?.labelKo : typeInfo?.label}
            <Badge variant="secondary" className="ml-2">
              {recipients.length}
              {language === "ko" ? "명" : " recipients"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {language === "ko"
              ? `${triggerDays}일 이상 조건을 충족하며 아직 발송되지 않은 대상자입니다.`
              : `Recipients who meet the ${triggerDays}-day criteria and haven't been emailed yet.`}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={language === "ko" ? "이름 또는 이메일 검색..." : "Search name or email..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Recipients Table with horizontal scroll */}
        <div className="flex-1 min-h-0 max-h-[400px] overflow-auto border rounded-lg">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : filteredRecipients.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? (language === "ko" ? "검색 결과가 없습니다" : "No results found")
                  : (language === "ko" ? "대상자가 없습니다" : "No recipients found")}
              </p>
            </div>
          ) : (
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ko" ? "이름" : "Name"}</TableHead>
                  <TableHead>{language === "ko" ? "이메일" : "Email"}</TableHead>
                  {emailType === "no_team_invite" && (
                    <TableHead>{language === "ko" ? "커뮤니티" : "Community"}</TableHead>
                  )}
                  <TableHead className="text-right">
                    {language === "ko" ? "경과일" : "Days"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecipients.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {recipient.full_name || (language === "ko" ? "(이름 없음)" : "(No name)")}
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {recipient.email}
                    </TableCell>
                    {emailType === "no_team_invite" && (
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {recipient.community_name}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        {recipient.days_inactive}
                        {language === "ko" ? "일" : "d"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer Info with fetch time */}
        <div className="flex flex-col gap-2 pt-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <p>
              {filteredRecipients.length !== recipients.length && (
                <>
                  {language === "ko" 
                    ? `${filteredRecipients.length}명 표시 중 (전체 ${recipients.length}명)` 
                    : `Showing ${filteredRecipients.length} of ${recipients.length}`}
                </>
              )}
            </p>
            <p className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" />
              {language === "ko" 
                ? `조회: ${new Date().toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}` 
                : `Fetched: ${new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              {language === "ko" ? "닫기" : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
