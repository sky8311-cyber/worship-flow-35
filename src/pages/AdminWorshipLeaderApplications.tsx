import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AdminNav } from "@/components/admin/AdminNav";
import { ApplicationCard } from "@/components/admin/ApplicationCard";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { CheckCircle, XCircle, LayoutGrid, List } from "lucide-react";
import { useState, useEffect } from "react";

const AdminWorshipLeaderApplications = () => {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode("card");
    }
  }, []);

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

      // Step 4: Batch fetch user_roles to check existing worship_leader roles
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds)
        .eq("role", "worship_leader");

      // Step 5: Build lookup maps
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const worshipLeaderUserIds = new Set((userRoles || []).map(r => r.user_id));

      // Step 6: Reconstruct data with hasWorshipLeaderRole flag
      return apps.map(app => ({
        ...app,
        profiles: profileMap.get(app.user_id),
        hasWorshipLeaderRole: worshipLeaderUserIds.has(app.user_id)
      }));
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const application = applications?.find(app => app.id === applicationId);
      if (!application) throw new Error("Application not found");

      // Step 1: Check if worship_leader role already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", application.user_id)
        .eq("role", "worship_leader")
        .maybeSingle();

      // Step 2: Add role only if not already exists
      if (!existingRole) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: application.user_id, role: "worship_leader" });

        if (roleError) throw roleError;
      }

      // Step 3: Fetch existing profile to merge (only update empty fields)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("church_name, church_website, country, serving_position, years_serving, worship_leader_intro")
        .eq("id", application.user_id)
        .single();

      // Step 4: Build profile update object - only fill empty fields
      const profileUpdate: Record<string, any> = {
        needs_worship_leader_profile: false
      };

      if (!existingProfile?.church_name && application.church_name) {
        profileUpdate.church_name = application.church_name;
      }
      if (!existingProfile?.church_website && application.church_website) {
        profileUpdate.church_website = application.church_website;
      }
      if (!existingProfile?.country && application.country) {
        profileUpdate.country = application.country;
      }
      if (!existingProfile?.serving_position && application.position) {
        profileUpdate.serving_position = application.position;
      }
      if (!existingProfile?.years_serving && application.years_serving) {
        profileUpdate.years_serving = application.years_serving;
      }
      if (!existingProfile?.worship_leader_intro && application.introduction) {
        profileUpdate.worship_leader_intro = application.introduction;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", application.user_id);

      if (profileError) throw profileError;

      // Step 5: Update application status to approved
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>{t("admin.applications.title")}</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant={viewMode === "card" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("card")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : !applications || applications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("admin.applications.noApplications")}
              </div>
            ) : viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applications.map((app: any) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    hasWorshipLeaderRole={app.hasWorshipLeaderRole}
                    onApprove={(id) => approveMutation.mutate(id)}
                    onReject={(id) => rejectMutation.mutate(id)}
                    isLoading={approveMutation.isPending || rejectMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.applications.applicant")}</TableHead>
                    <TableHead>{t("worshipLeaderRequest.communityName")}</TableHead>
                    <TableHead>{t("worshipLeaderRequest.website")}</TableHead>
                    <TableHead>{t("worshipLeaderRequest.country")}</TableHead>
                    <TableHead>{t("worshipLeaderRequest.servingPosition")}</TableHead>
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
                      <TableCell>{app.country || "-"}</TableCell>
                      <TableCell>{app.position}</TableCell>
                      <TableCell>{app.years_serving}년</TableCell>
                      <TableCell>
                        {format(new Date(app.created_at), "PPP", { locale: dateLocale })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(app.status)}
                          {app.hasWorshipLeaderRole && app.status === "pending" && (
                            <Badge className="bg-blue-500 text-white text-xs">
                              {t("admin.applications.alreadyWorshipLeader")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {app.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate(app.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {app.hasWorshipLeaderRole 
                                ? t("admin.applications.confirmStatus") 
                                : t("admin.applications.approve")}
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
