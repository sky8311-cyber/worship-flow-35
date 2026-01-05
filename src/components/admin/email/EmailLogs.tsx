import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Mail, Users, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
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

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  pending: { icon: <Clock className="w-4 h-4" />, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  sending: { icon: <Clock className="w-4 h-4 animate-spin" />, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  completed: { icon: <CheckCircle className="w-4 h-4" />, color: "bg-green-500/10 text-green-500 border-green-500/20" },
  failed: { icon: <XCircle className="w-4 h-4" />, color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export const EmailLogs = () => {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Fetch email logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["email-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_email_logs")
        .select(`
          *,
          sender_profile:profiles!admin_email_logs_sent_by_fkey(full_name, email)
        `)
        .order("sent_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as EmailLog[];
    },
  });

  // Fetch recipients for selected log
  const { data: recipients = [] } = useQuery({
    queryKey: ["email-recipients", selectedLogId],
    queryFn: async () => {
      if (!selectedLogId) return [];
      const { data, error } = await supabase
        .from("email_recipients")
        .select(`
          *,
          user_profile:profiles!email_recipients_user_id_fkey(full_name)
        `)
        .eq("email_log_id", selectedLogId)
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return data as EmailRecipient[];
    },
    enabled: !!selectedLogId,
  });

  const toggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getFilterLabel = (filter: unknown) => {
    const f = filter as { type?: string; roleValue?: string; communityId?: string } | null;
    if (!f) return "Unknown";
    switch (f.type) {
      case "all":
        return "All Users";
      case "role":
        return `Role: ${f.roleValue}`;
      case "community":
        return "Community Members";
      default:
        return f.type || "Unknown";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Email Send History</h2>

      {logs.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No emails sent yet</h3>
            <p className="text-muted-foreground">
              Your email send history will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const status = statusConfig[log.status] || statusConfig.pending;
            const isExpanded = expandedLogs.has(log.id);

            return (
              <Card key={log.id}>
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => toggleExpand(log.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {log.subject}
                        </CardTitle>
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
                      <Badge variant="outline" className={status.color}>
                        {status.icon}
                        <span className="ml-1">{log.status}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="grid gap-4 md:grid-cols-3 mb-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Template</p>
                        <p className="text-sm font-medium">{log.template_name || "Custom"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Recipients</p>
                        <p className="text-sm font-medium">{getFilterLabel(log.recipient_filter)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Completed</p>
                        <p className="text-sm font-medium">
                          {log.completed_at
                            ? format(new Date(log.completed_at), "MMM d, yyyy HH:mm")
                            : "In progress..."}
                        </p>
                      </div>
                    </div>

                    {log.error_message && (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg mb-4">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{log.error_message}</span>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLogId(log.id)}
                    >
                      View Recipients
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Recipients Dialog */}
      <Dialog open={!!selectedLogId} onOpenChange={() => setSelectedLogId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Email Recipients</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map((recipient) => {
                const status = statusConfig[recipient.status] || statusConfig.pending;
                return (
                  <TableRow key={recipient.id}>
                    <TableCell>{recipient.user_profile?.full_name || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{recipient.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.color}>
                        {status.icon}
                        <span className="ml-1">{recipient.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {recipient.sent_at
                        ? format(new Date(recipient.sent_at), "MMM d, HH:mm:ss")
                        : "-"}
                    </TableCell>
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
