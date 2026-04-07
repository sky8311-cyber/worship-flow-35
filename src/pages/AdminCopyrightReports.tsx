import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

const STATUSES = [
  "submitted", "under_review", "validated", "rejected", "removed", "user_warned", "user_suspended"
] as const;

const statusColors: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  validated: "bg-orange-100 text-orange-800",
  rejected: "bg-gray-100 text-gray-800",
  removed: "bg-red-100 text-red-800",
  user_warned: "bg-amber-100 text-amber-800",
  user_suspended: "bg-red-200 text-red-900",
};

const AdminCopyrightReports = () => {
  const { language } = useTranslation();
  const isKo = language === "ko";
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-copyright-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copyright_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const updates: any = {
        status,
        reviewer_notes: notes || null,
        reviewed_at: new Date().toISOString(),
      };
      if (["removed", "user_warned", "user_suspended", "rejected", "validated"].includes(status)) {
        updates.resolved_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("copyright_reports")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-copyright-reports"] });
      toast.success("Report updated");
      setSelectedReport(null);
    },
  });

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">
            {isKo ? "저작권 신고 관리" : "Copyright Reports"}
          </h1>
          <Badge variant="outline">{reports?.length || 0}</Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : !reports?.length ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            {isKo ? "접수된 신고가 없습니다." : "No reports yet."}
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {reports.map((report: any) => (
              <Card key={report.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => {
                setSelectedReport(report);
                setReviewerNotes(report.reviewer_notes || "");
                setNewStatus(report.status);
              }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={statusColors[report.status] || ""}>{report.status}</Badge>
                        <span className="text-xs text-muted-foreground">{report.content_type}</span>
                      </div>
                      <p className="text-sm truncate">{report.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.reporter_email} · {format(new Date(report.created_at), "yyyy-MM-dd HH:mm")}
                      </p>
                      {report.uploader_user_id && (
                        <p className="text-xs text-orange-600">Uploader: {report.uploader_user_id.slice(0, 8)}…</p>
                      )}
                    </div>
                    {report.status === "submitted" && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
                    {report.status === "validated" && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                    {report.status === "rejected" && <XCircle className="w-5 h-5 text-gray-400 shrink-0" />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{isKo ? "신고 상세" : "Report Detail"}</DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>{isKo ? "신고자" : "Reporter"}:</strong> {selectedReport.reporter_email}</div>
                  <div><strong>{isKo ? "이름" : "Name"}:</strong> {selectedReport.reporter_name || "—"}</div>
                  <div><strong>Content ID:</strong> {selectedReport.content_id.slice(0, 8)}…</div>
                  <div><strong>Type:</strong> {selectedReport.content_type}</div>
                  {selectedReport.uploader_user_id && (
                    <div className="col-span-2"><strong>Uploader ID:</strong> {selectedReport.uploader_user_id}</div>
                  )}
                </div>

                <div>
                  <strong className="text-sm">{isKo ? "사유" : "Reason"}:</strong>
                  <p className="text-sm mt-1 p-2 bg-muted rounded">{selectedReport.reason}</p>
                </div>

                {selectedReport.evidence_url && (
                  <div>
                    <strong className="text-sm">{isKo ? "증거" : "Evidence"}:</strong>
                    <a href={selectedReport.evidence_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block mt-1">
                      {selectedReport.evidence_url}
                    </a>
                  </div>
                )}

                <div>
                  <strong className="text-sm">{isKo ? "상태 변경" : "Change Status"}</strong>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <strong className="text-sm">{isKo ? "관리자 메모" : "Reviewer Notes"}</strong>
                  <Textarea
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    className="mt-1"
                    rows={3}
                    maxLength={2000}
                  />
                </div>

                <Button
                  onClick={() => updateMutation.mutate({
                    id: selectedReport.id,
                    status: newStatus,
                    notes: reviewerNotes,
                  })}
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {isKo ? "저장" : "Save"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCopyrightReports;
