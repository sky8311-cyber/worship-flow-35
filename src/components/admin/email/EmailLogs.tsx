import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
  ChevronDown, ChevronRight, Mail, Users, CheckCircle, XCircle, Clock, AlertCircle,
  UserX, Music, Bot
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailLog {
  id: string;
  template_name: string | null;
  subject: string;
  sent_by: string;
  recipient_filter: unknown;
  recipient_count: number;
  status: string;
  error_message: string | null;
  sent_at: string;
  completed_at: string | null;
  sender_profile?: {
    full_name: string | null;
    email: string;
  };
}

interface EmailRecipient {
  id: string;
  email: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  user_profile?: {
    full_name: string | null;
  };
}

interface AutomatedEmailLog {
  id: string;
  user_id: string;
  email_type: string;
  sent_at: string;
  status: string | null;
  error_message: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  metadata: unknown;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  pending: { icon: <Clock className="w-4 h-4" />, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  sending: { icon: <Clock className="w-4 h-4 animate-spin" />, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  completed: { icon: <CheckCircle className="w-4 h-4" />, color: "bg-green-500/10 text-green-500 border-green-500/20" },
  sent: { icon: <CheckCircle className="w-4 h-4" />, color: "bg-green-500/10 text-green-500 border-green-500/20" },
  failed: { icon: <XCircle className="w-4 h-4" />, color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const emailTypeConfig: Record<string, { icon: React.ReactNode; label: string; labelKo: string }> = {
  inactive_user: { icon: <UserX className="w-4 h-4" />, label: "Inactive User", labelKo: "미접속자" },
  no_team_invite: { icon: <Users className="w-4 h-4" />, label: "Team Invite", labelKo: "팀원 초대" },
  no_worship_set: { icon: <Music className="w-4 h-4" />, label: "Worship Set", labelKo: "워십세트" },
};

const ITEMS_PER_PAGE = 50;

export const EmailLogs = () => {
  const { t, language } = useTranslation();
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("manual");
  const [automatedTypeFilter, setAutomatedTypeFilter] = useState<string>("all");
  const [automatedPage, setAutomatedPage] = useState(1);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["email-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_email_logs")
        .select(`*, sender_profile:profiles!admin_email_logs_sent_by_fkey(full_name, email)`)
        .order("sent_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as EmailLog[];
    },
  });

  const { data: automatedLogsCount = 0 } = useQuery({
    queryKey: ["automated-email-log-count", automatedTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from("automated_email_log")
        .select("*", { count: "exact", head: true });
      
      if (automatedTypeFilter !== "all") {
        query = query.eq("email_type", automatedTypeFilter);
      }
      
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: automatedLogs = [], isLoading: isLoadingAutomated } = useQuery({
    queryKey: ["automated-email-log", automatedPage, automatedTypeFilter],
    queryFn: async () => {
      const from = (automatedPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from("automated_email_log")
        .select("*")
        .order("sent_at", { ascending: false });
      
      if (automatedTypeFilter !== "all") {
        query = query.eq("email_type", automatedTypeFilter);
      }
      
      const { data, error } = await query.range(from, to);
      if (error) throw error;
      return data as AutomatedEmailLog[];
    },
  });

  const totalPages = Math.ceil(automatedLogsCount / ITEMS_PER_PAGE);

  const { data: recipients = [] } = useQuery({
    queryKey: ["email-recipients", selectedLogId],
    queryFn: async () => {
      if (!selectedLogId) return [];
      const { data, error } = await supabase
        .from("email_recipients")
        .select(`*, user_profile:profiles!email_recipients_user_id_fkey(full_name)`)
        .eq("email_log_id", selectedLogId)
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return data as EmailRecipient[];
    },
    enabled: !!selectedLogId,
  });

  const toggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) newExpanded.delete(logId);
    else newExpanded.add(logId);
    setExpandedLogs(newExpanded);
  };

  const getFilterLabel = (filter: unknown) => {
    const f = filter as { type?: string; roleValue?: string } | null;
    if (!f) return t("adminEmail.logs.filterUnknown");
    switch (f.type) {
      case "all": return t("adminEmail.logs.filterAllUsers");
      case "role": return t("adminEmail.logs.filterRole", { role: f.roleValue || "" });
      case "community": return t("adminEmail.logs.filterCommunity");
      default: return f.type || t("adminEmail.logs.filterUnknown");
    }
  };

  // Reset page when filter changes
  const handleFilterChange = (value: string) => {
    setAutomatedTypeFilter(value);
    setAutomatedPage(1);
  };

  const groupedAutomatedLogs = automatedLogs.reduce((acc, log) => {
    const date = format(new Date(log.sent_at), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, AutomatedEmailLog[]>);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {language === "ko" ? "수동 발송" : "Manual"}
          </TabsTrigger>
          <TabsTrigger value="automated" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            {language === "ko" ? "자동 발송" : "Automated"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4 space-y-3">
          {logs.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("adminEmail.logs.noLogs")}</h3>
              </CardContent>
            </Card>
          ) : (
            logs.map((log) => {
              const status = statusConfig[log.status] || statusConfig.pending;
              const isExpanded = expandedLogs.has(log.id);
              return (
                <Card key={log.id}>
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="p-0 h-auto" onClick={() => toggleExpand(log.id)}>
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                        <div>
                          <CardTitle className="text-sm font-medium">{log.subject}</CardTitle>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{format(new Date(log.sent_at), "MMM d, yyyy HH:mm")}</span>
                            <span>•</span>
                            <span>by {log.sender_profile?.full_name || log.sender_profile?.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{log.recipient_count}</span>
                        </div>
                        <Badge variant="outline" className={status.color}>{status.icon}<span className="ml-1">{log.status}</span></Badge>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="grid gap-4 md:grid-cols-3 mb-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">{t("adminEmail.logs.template")}</p>
                          <p className="text-sm font-medium">{log.template_name || t("adminEmail.logs.custom")}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("adminEmail.logs.recipients")}</p>
                          <p className="text-sm font-medium">{getFilterLabel(log.recipient_filter)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("adminEmail.logs.completed")}</p>
                          <p className="text-sm font-medium">{log.completed_at ? format(new Date(log.completed_at), "MMM d, yyyy HH:mm") : t("adminEmail.logs.inProgress")}</p>
                        </div>
                      </div>
                      {log.error_message && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg mb-4">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">{log.error_message}</span>
                        </div>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setSelectedLogId(log.id)}>{t("adminEmail.logs.viewRecipients")}</Button>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="automated" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{language === "ko" ? "자동 발송 기록" : "Automated Email History"}</h2>
              <Badge variant="secondary">
                {language === "ko" ? `총 ${automatedLogsCount}건` : `${automatedLogsCount} total`}
              </Badge>
            </div>
            <Select value={automatedTypeFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ko" ? "전체" : "All Types"}</SelectItem>
                {Object.entries(emailTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{language === "ko" ? config.labelKo : config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isLoadingAutomated ? (
            <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : Object.keys(groupedAutomatedLogs).length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{language === "ko" ? "자동 발송 기록이 없습니다" : "No automated emails sent"}</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedAutomatedLogs).map(([date, dateLogs]) => (
                <Card key={date}>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">{format(new Date(date), language === "ko" ? "yyyy년 M월 d일" : "MMM d, yyyy")}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === "ko" ? "시간" : "Time"}</TableHead>
                          <TableHead>{language === "ko" ? "유형" : "Type"}</TableHead>
                          <TableHead>{language === "ko" ? "수신자" : "Recipient"}</TableHead>
                          <TableHead>{language === "ko" ? "상태" : "Status"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dateLogs.map((log) => {
                          const config = emailTypeConfig[log.email_type];
                          const status = statusConfig[log.status || "sent"] || statusConfig.sent;
                          return (
                            <TableRow key={log.id}>
                              <TableCell className="text-xs">{format(new Date(log.sent_at), "HH:mm:ss")}</TableCell>
                              <TableCell><Badge variant="outline" className="gap-1">{config?.icon}{language === "ko" ? config?.labelKo : config?.label}</Badge></TableCell>
                              <TableCell><p className="text-sm">{log.recipient_name || "-"}</p><p className="text-xs text-muted-foreground font-mono">{log.recipient_email}</p></TableCell>
                              <TableCell><Badge variant="outline" className={status.color}>{status.icon}</Badge></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setAutomatedPage(p => Math.max(1, p - 1))}
                        className={automatedPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="px-4 py-2 text-sm">
                        {automatedPage} / {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setAutomatedPage(p => Math.min(totalPages, p + 1))}
                        className={automatedPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedLogId} onOpenChange={() => setSelectedLogId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>{t("adminEmail.logs.recipientsTitle")}</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("adminEmail.logs.recipient")}</TableHead>
                <TableHead>{t("adminEmail.logs.email")}</TableHead>
                <TableHead>{t("adminEmail.logs.status")}</TableHead>
                <TableHead>{t("adminEmail.logs.sentAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map((recipient) => {
                const status = statusConfig[recipient.status] || statusConfig.pending;
                return (
                  <TableRow key={recipient.id}>
                    <TableCell>{recipient.user_profile?.full_name || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{recipient.email}</TableCell>
                    <TableCell><Badge variant="outline" className={status.color}>{status.icon}<span className="ml-1">{recipient.status}</span></Badge></TableCell>
                    <TableCell className="text-xs">{recipient.sent_at ? format(new Date(recipient.sent_at), "MMM d, HH:mm:ss") : "-"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};
