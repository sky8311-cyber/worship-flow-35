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
import { CheckCircle, XCircle, LayoutGrid, List, Zap, Filter, Users } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterType = "all" | "pending" | "auto_approved" | "manual_approved" | "rejected";

const AdminWorshipLeaderApplications = () => {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [filterType, setFilterType] = useState<FilterType>("all");
  
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

      // Step 6: Send approval notification to applicant
      await supabase.from("notifications").insert({
        user_id: application.user_id,
        type: "promoted_to_worship_leader",
        title: "예배인도자로 승급되었습니다! / You're now a Worship Leader!",
        message: "축하합니다! 이제 커뮤니티를 생성하고 예배팀을 이끌 수 있습니다. / Congratulations! You can now create communities and lead worship teams.",
        related_type: "worship_leader_application",
        related_id: applicationId,
      });
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
      const application = applications?.find(app => app.id === applicationId);
      if (!application) throw new Error("Application not found");

      const { error } = await supabase
        .from("worship_leader_applications")
        .update({
          status: "rejected",
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (error) throw error;

      // Send rejection notification to applicant
      await supabase.from("notifications").insert({
        user_id: application.user_id,
        type: "worship_leader_rejected",
        title: "예배인도자 신청 결과 / Application Result",
        message: "신청이 승인되지 않았습니다. 다시 신청하실 수 있습니다. / Your application was not approved. You may reapply.",
        related_type: "worship_leader_application",
        related_id: applicationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worship-leader-applications"] });
      toast.success(t("admin.applications.rejectedSuccess"));
    },
    onError: (error: any) => {
      toast.error(error.message || t("admin.applications.rejectError"));
    },
  });

  const getStatusBadge = (status: string, isAutoApproved?: boolean) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">{t("admin.applications.pending")}</Badge>;
      case "approved":
        return (
          <div className="flex items-center gap-1">
            <Badge className="bg-green-500">{t("admin.applications.approved")}</Badge>
            {isAutoApproved && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                {language === "ko" ? "자동" : "Auto"}
              </Badge>
            )}
          </div>
        );
      case "rejected":
        return <Badge variant="destructive">{t("admin.applications.rejected")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Filter applications based on selected filter
  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    
    return applications.filter((app: any) => {
      const isAutoApproved = app.status === "approved" && !app.reviewed_by;
      const isManualApproved = app.status === "approved" && app.reviewed_by;
      
      switch (filterType) {
        case "pending":
          return app.status === "pending";
        case "auto_approved":
          return isAutoApproved;
        case "manual_approved":
          return isManualApproved;
        case "rejected":
          return app.status === "rejected";
        default:
          return true;
      }
    });
  }, [applications, filterType]);

  // Count for each filter
  const counts = useMemo(() => {
    if (!applications) return { all: 0, pending: 0, auto_approved: 0, manual_approved: 0, rejected: 0 };
    
    return applications.reduce((acc: Record<string, number>, app: any) => {
      acc.all++;
      if (app.status === "pending") acc.pending++;
      else if (app.status === "approved" && !app.reviewed_by) acc.auto_approved++;
      else if (app.status === "approved" && app.reviewed_by) acc.manual_approved++;
      else if (app.status === "rejected") acc.rejected++;
      return acc;
    }, { all: 0, pending: 0, auto_approved: 0, manual_approved: 0, rejected: 0 });
  }, [applications]);

  return (
    <div className="min-h-screen bg-gradient-soft">
      <AdminNav />
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
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
              
              {/* Filter Tabs */}
              <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)} className="w-full">
                <TabsList className="grid w-full grid-cols-5 h-auto">
                  <TabsTrigger value="all" className="text-xs px-2 py-1.5">
                    {language === "ko" ? "전체" : "All"} ({counts.all})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs px-2 py-1.5">
                    {language === "ko" ? "대기" : "Pending"} ({counts.pending})
                  </TabsTrigger>
                  <TabsTrigger value="auto_approved" className="text-xs px-2 py-1.5">
                    <Zap className="h-3 w-3 mr-1" />
                    {language === "ko" ? "자동" : "Auto"} ({counts.auto_approved})
                  </TabsTrigger>
                  <TabsTrigger value="manual_approved" className="text-xs px-2 py-1.5">
                    {language === "ko" ? "수동" : "Manual"} ({counts.manual_approved})
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="text-xs px-2 py-1.5">
                    {language === "ko" ? "거절" : "Rejected"} ({counts.rejected})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : !filteredApplications || filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("admin.applications.noApplications")}
              </div>
            ) : viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredApplications.map((app: any) => {
                  const isAutoApproved = app.status === "approved" && !app.reviewed_by;
                  return (
                    <ApplicationCard
                      key={app.id}
                      application={{...app, isAutoApproved}}
                      hasWorshipLeaderRole={app.hasWorshipLeaderRole}
                      onApprove={(id) => approveMutation.mutate(id)}
                      onReject={(id) => rejectMutation.mutate(id)}
                      isLoading={approveMutation.isPending || rejectMutation.isPending}
                    />
                  );
                })}
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
                  {filteredApplications.map((app: any) => {
                    const isAutoApproved = app.status === "approved" && !app.reviewed_by;
                    return (
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
                            {getStatusBadge(app.status, isAutoApproved)}
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
                    );
                  })}
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
