import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AdminNav } from "@/components/admin/AdminNav";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

const AdminWorshipLeaderApplications = () => {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["worship-leader-applications"],
    queryFn: async () => {
      // Step 1: Fetch all applications (simple select)
      const { data: apps, error } = await supabase
        .from("worship_leader_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!apps || apps.length === 0) return [];

      // Step 2: Collect unique user IDs
      const userIds = [...new Set(apps.map(app => app.user_id))];

      // Step 3: Batch fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);

      // Step 4: Build lookup map
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Step 5: Reconstruct data
      return apps.map(app => ({
        ...app,
        profiles: profileMap.get(app.user_id)
      }));
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const application = applications?.find(app => app.id === applicationId);
      if (!application) throw new Error("Application not found");

      // Add worship_leader role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: application.user_id, role: "worship_leader" });

      if (roleError) throw roleError;

      // Create worship_leader_profile
      const { error: profileError } = await supabase
        .from("worship_leader_profiles")
        .insert({
          user_id: application.user_id,
          church_name: application.church_name,
          church_website: application.church_website,
          denomination: application.denomination,
          country: application.country,
          position: application.position,
          years_serving: application.years_serving,
          introduction: application.introduction,
        });

      if (profileError) throw profileError;

      // Update application status
      const { error: statusError } = await supabase
        .from("worship_leader_applications")
        .update({
          status: "approved",
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (statusError) throw statusError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worship-leader-applications"] });
      toast.success(t("admin.applications.approvedSuccess"));
    },
    onError: (error: any) => {
      toast.error(error.message || t("admin.applications.approveError"));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from("worship_leader_applications")
        .update({
          status: "rejected",
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worship-leader-applications"] });
      toast.success(t("admin.applications.rejectedSuccess"));
    },
    onError: (error: any) => {
      toast.error(error.message || t("admin.applications.rejectError"));
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">{t("admin.applications.pending")}</Badge>;
      case "approved":
        return <Badge className="bg-green-500">{t("admin.applications.approved")}</Badge>;
      case "rejected":
        return <Badge variant="destructive">{t("admin.applications.rejected")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <AdminNav />
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.applications.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : !applications || applications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("admin.applications.noApplications")}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.applications.applicant")}</TableHead>
                    <TableHead>{t("worshipLeaderRequest.churchName")}</TableHead>
                    <TableHead>{t("worshipLeaderRequest.churchWebsite")}</TableHead>
                    <TableHead>{t("worshipLeaderRequest.denomination")}</TableHead>
                    <TableHead>{t("worshipLeaderRequest.country")}</TableHead>
                    <TableHead>{t("worshipLeaderRequest.position")}</TableHead>
                    <TableHead>{t("worshipLeaderRequest.yearsServing")}</TableHead>
                    <TableHead>{t("admin.applications.appliedDate")}</TableHead>
                    <TableHead>{t("admin.applications.status")}</TableHead>
                    <TableHead>{t("admin.applications.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app: any) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={app.profiles?.avatar_url} />
                            <AvatarFallback>
                              {app.profiles?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{app.profiles?.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {app.profiles?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{app.church_name}</TableCell>
                      <TableCell>
                        {app.church_website ? (
                          <a 
                            href={app.church_website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {app.church_website}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{app.denomination || "-"}</TableCell>
                      <TableCell>{app.country || "-"}</TableCell>
                      <TableCell>{app.position}</TableCell>
                      <TableCell>{app.years_serving}년</TableCell>
                      <TableCell>
                        {format(new Date(app.created_at), "PPP", { locale: dateLocale })}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>
                        {app.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate(app.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t("admin.applications.approve")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectMutation.mutate(app.id)}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {t("admin.applications.reject")}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminWorshipLeaderApplications;
