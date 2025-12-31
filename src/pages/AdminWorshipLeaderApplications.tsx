import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminNav } from "@/components/admin/AdminNav";
import { ApplicationCard } from "@/components/admin/ApplicationCard";
import { useTranslation } from "@/hooks/useTranslation";
import { format, formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { CheckCircle, XCircle, LayoutGrid, List, Zap, Music, AlertTriangle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterType = "all" | "pending" | "auto_approved" | "manual_approved" | "rejected" | "no_application";

const AdminWorshipLeaderApplications = () => {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode("card");
    }
  }, []);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["worship-leader-applications"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Fetch all data in parallel
      const [appsResult, authResult, setsResult, songsResult, worshipLeaderRolesResult] = await Promise.all([
        supabase
          .from("worship_leader_applications")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.functions.invoke("admin-list-users", {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }),
        supabase.from("service_sets").select("created_by"),
        supabase.from("songs").select("created_by"),
        // Fetch all worship_leader roles
        supabase.from("user_roles").select("user_id, created_at").eq("role", "worship_leader")
      ]);

      if (appsResult.error) throw appsResult.error;
      
      const apps = appsResult.data || [];
      const authUsers = authResult.data?.users || [];
      const worshipLeaderRoles = worshipLeaderRolesResult.data || [];
      
      // Get all user IDs (from apps + from roles without apps)
      const appUserIds = new Set(apps.map(app => app.user_id));
      const roleOnlyUserIds = worshipLeaderRoles
        .filter(r => !appUserIds.has(r.user_id))
        .map(r => r.user_id);
      
      const allUserIds = [...new Set([...apps.map(app => app.user_id), ...roleOnlyUserIds])];
      
      if (allUserIds.length === 0) return [];

      // Batch fetch profiles and roles
      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, avatar_url, church_name").in("id", allUserIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", allUserIds).eq("role", "worship_leader")
      ]);

      // Build lookup maps
      const profileMap = new Map((profilesResult.data || []).map(p => [p.id, p]));
      const worshipLeaderUserIds = new Set((rolesResult.data || []).map(r => r.user_id));
      const authMap = new Map<string, { id: string; last_sign_in_at: string | null }>(
        authUsers.map((u: any) => [u.id, u])
      );
      const roleCreatedAtMap = new Map(worshipLeaderRoles.map(r => [r.user_id, r.created_at]));
      
      // Count sets and songs per user
      const setsCountMap = new Map<string, number>();
      const songsCountMap = new Map<string, number>();
      (setsResult.data || []).forEach(s => {
        if (s.created_by) setsCountMap.set(s.created_by, (setsCountMap.get(s.created_by) || 0) + 1);
      });
      (songsResult.data || []).forEach(s => {
        if (s.created_by) songsCountMap.set(s.created_by, (songsCountMap.get(s.created_by) || 0) + 1);
      });

      // Build results from actual applications
      const appResults = apps.map(app => ({
        ...app,
        profiles: profileMap.get(app.user_id),
        hasWorshipLeaderRole: worshipLeaderUserIds.has(app.user_id),
        last_sign_in_at: authMap.get(app.user_id)?.last_sign_in_at || null,
        setsCount: setsCountMap.get(app.user_id) || 0,
        songsCount: songsCountMap.get(app.user_id) || 0,
        isVirtual: false
      }));

      // Build virtual entries for WL users without applications
      const virtualResults = roleOnlyUserIds.map(userId => {
        const profile = profileMap.get(userId);
        const roleCreatedAt = roleCreatedAtMap.get(userId);
        return {
          id: `virtual-${userId}`,
          user_id: userId,
          status: "approved",
          created_at: roleCreatedAt || new Date().toISOString(),
          church_name: profile?.church_name || null,
          church_website: null,
          country: null,
          position: null,
          years_serving: null,
          introduction: null,
          reviewed_by: null,
          reviewed_at: roleCreatedAt,
          profiles: profile,
          hasWorshipLeaderRole: true,
          last_sign_in_at: authMap.get(userId)?.last_sign_in_at || null,
          setsCount: setsCountMap.get(userId) || 0,
          songsCount: songsCountMap.get(userId) || 0,
          isVirtual: true
        };
      });

      return [...appResults, ...virtualResults];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const application = applications?.find(app => app.id === applicationId);
      if (!application) throw new Error("Application not found");

      const { data: existingRole } = await supabase
        .from("user_roles").select("id").eq("user_id", application.user_id).eq("role", "worship_leader").maybeSingle();

      if (!existingRole) {
        const { error: roleError } = await supabase.from("user_roles").insert({ user_id: application.user_id, role: "worship_leader" });
        if (roleError) throw roleError;
      }

      const { data: existingProfile } = await supabase
        .from("profiles").select("church_name, church_website, country, serving_position, years_serving, worship_leader_intro")
        .eq("id", application.user_id).single();

      const profileUpdate: Record<string, any> = { needs_worship_leader_profile: false };
      if (!existingProfile?.church_name && application.church_name) profileUpdate.church_name = application.church_name;
      if (!existingProfile?.church_website && application.church_website) profileUpdate.church_website = application.church_website;
      if (!existingProfile?.country && application.country) profileUpdate.country = application.country;
      if (!existingProfile?.serving_position && application.position) profileUpdate.serving_position = application.position;
      if (!existingProfile?.years_serving && application.years_serving) profileUpdate.years_serving = application.years_serving;
      if (!existingProfile?.worship_leader_intro && application.introduction) profileUpdate.worship_leader_intro = application.introduction;

      await supabase.from("profiles").update(profileUpdate).eq("id", application.user_id);
      await supabase.from("worship_leader_applications").update({
        status: "approved", reviewed_by: (await supabase.auth.getUser()).data.user?.id, reviewed_at: new Date().toISOString(),
      }).eq("id", applicationId);

      await supabase.from("notifications").insert({
        user_id: application.user_id, type: "join_approved",
        title: "예배인도자 승인 완료! / You're now a Worship Leader!",
        message: "축하합니다! 이제 커뮤니티를 생성하고 예배팀을 이끌 수 있습니다.",
        related_type: "worship_leader_application", related_id: applicationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worship-leader-applications"] });
      toast.success(t("admin.applications.approvedSuccess"));
    },
    onError: (error: any) => toast.error(error.message || t("admin.applications.approveError")),
  });

  const rejectMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const application = applications?.find(app => app.id === applicationId);
      if (!application) throw new Error("Application not found");

      await supabase.from("worship_leader_applications").update({
        status: "rejected", reviewed_by: (await supabase.auth.getUser()).data.user?.id, reviewed_at: new Date().toISOString(),
      }).eq("id", applicationId);

      await supabase.from("notifications").insert({
        user_id: application.user_id, type: "worship_leader_rejected",
        title: "예배인도자 신청 결과 / Application Result",
        message: "신청이 승인되지 않았습니다. 다시 신청하실 수 있습니다.",
        related_type: "worship_leader_application", related_id: applicationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worship-leader-applications"] });
      toast.success(t("admin.applications.rejectedSuccess"));
    },
    onError: (error: any) => toast.error(error.message || t("admin.applications.rejectError")),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await approveMutation.mutateAsync(id);
    },
    onSuccess: () => setSelectedApps(new Set()),
  });

  const bulkRejectMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await rejectMutation.mutateAsync(id);
    },
    onSuccess: () => setSelectedApps(new Set()),
  });

  const getStatusBadge = (status: string, isAutoApproved?: boolean) => {
    switch (status) {
      case "pending": return <Badge variant="outline">{t("admin.applications.pending")}</Badge>;
      case "approved": return (
        <div className="flex items-center gap-1">
          <Badge className="bg-green-500">{t("admin.applications.approved")}</Badge>
          {isAutoApproved && <Badge variant="secondary" className="text-xs"><Zap className="h-3 w-3 mr-1" />{language === "ko" ? "자동" : "Auto"}</Badge>}
        </div>
      );
      case "rejected": return <Badge variant="destructive">{t("admin.applications.rejected")}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    return applications.filter((app: any) => {
      const isAutoApproved = app.status === "approved" && !app.reviewed_by && !app.isVirtual;
      const isManualApproved = app.status === "approved" && app.reviewed_by && !app.isVirtual;
      switch (filterType) {
        case "pending": return app.status === "pending";
        case "auto_approved": return isAutoApproved;
        case "manual_approved": return isManualApproved;
        case "rejected": return app.status === "rejected";
        case "no_application": return app.isVirtual;
        default: return true;
      }
    });
  }, [applications, filterType]);

  const counts = useMemo(() => {
    if (!applications) return { all: 0, pending: 0, auto_approved: 0, manual_approved: 0, rejected: 0, no_application: 0 };
    return applications.reduce((acc: Record<string, number>, app: any) => {
      acc.all++;
      if (app.isVirtual) acc.no_application++;
      else if (app.status === "pending") acc.pending++;
      else if (app.status === "approved" && !app.reviewed_by) acc.auto_approved++;
      else if (app.status === "approved" && app.reviewed_by) acc.manual_approved++;
      else if (app.status === "rejected") acc.rejected++;
      return acc;
    }, { all: 0, pending: 0, auto_approved: 0, manual_approved: 0, rejected: 0, no_application: 0 });
  }, [applications]);

  const pendingSelected = Array.from(selectedApps).filter(id => 
    filteredApplications.find((a: any) => a.id === id && a.status === "pending")
  );

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
                  <Button variant={viewMode === "card" ? "default" : "outline"} size="sm" onClick={() => setViewMode("card")}><LayoutGrid className="h-4 w-4" /></Button>
                  <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}><List className="h-4 w-4" /></Button>
                </div>
              </div>
              <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)} className="w-full">
                <TabsList className="grid w-full grid-cols-6 h-auto">
                  <TabsTrigger value="all" className="text-xs px-2 py-1.5">{language === "ko" ? "전체" : "All"} ({counts.all})</TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs px-2 py-1.5">{language === "ko" ? "대기" : "Pending"} ({counts.pending})</TabsTrigger>
                  <TabsTrigger value="auto_approved" className="text-xs px-2 py-1.5"><Zap className="h-3 w-3 mr-1" />{language === "ko" ? "자동" : "Auto"} ({counts.auto_approved})</TabsTrigger>
                  <TabsTrigger value="manual_approved" className="text-xs px-2 py-1.5">{language === "ko" ? "수동" : "Manual"} ({counts.manual_approved})</TabsTrigger>
                  <TabsTrigger value="rejected" className="text-xs px-2 py-1.5">{language === "ko" ? "거절" : "Rejected"} ({counts.rejected})</TabsTrigger>
                  <TabsTrigger value="no_application" className="text-xs px-2 py-1.5"><AlertTriangle className="h-3 w-3 mr-1" />{language === "ko" ? "신청없음" : "No App"} ({counts.no_application})</TabsTrigger>
                </TabsList>
              </Tabs>
              {pendingSelected.length > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => bulkApproveMutation.mutate(pendingSelected)} disabled={bulkApproveMutation.isPending}>
                    <CheckCircle className="h-4 w-4 mr-1" />{pendingSelected.length}{language === "ko" ? "명 승인" : " Approve"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => bulkRejectMutation.mutate(pendingSelected)} disabled={bulkRejectMutation.isPending}>
                    <XCircle className="h-4 w-4 mr-1" />{pendingSelected.length}{language === "ko" ? "명 거절" : " Reject"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : !filteredApplications || filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t("admin.applications.noApplications")}</div>
            ) : viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredApplications.map((app: any) => (
                  <ApplicationCard key={app.id} application={{...app, isAutoApproved: app.status === "approved" && !app.reviewed_by}} hasWorshipLeaderRole={app.hasWorshipLeaderRole}
                    onApprove={(id) => approveMutation.mutate(id)} onReject={(id) => rejectMutation.mutate(id)} isLoading={approveMutation.isPending || rejectMutation.isPending} />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={selectedApps.size === filteredApplications.length && filteredApplications.length > 0}
                        onCheckedChange={(checked) => setSelectedApps(checked ? new Set(filteredApplications.map((a: any) => a.id)) : new Set())} />
                    </TableHead>
                    <TableHead>{t("admin.applications.applicant")}</TableHead>
                    <TableHead>{t("worshipLeaderRequest.communityName")}</TableHead>
                    <TableHead>{language === "ko" ? "직분/경력" : "Position/Exp"}</TableHead>
                    <TableHead>{t("admin.applications.appliedDate")}</TableHead>
                    <TableHead>{t("admin.applications.lastLogin")}</TableHead>
                    <TableHead className="text-center">{t("admin.applications.worshipSets")}</TableHead>
                    <TableHead className="text-center">{t("admin.applications.songContributions")}</TableHead>
                    <TableHead>{t("admin.applications.status")}</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app: any) => (
                    <TableRow key={app.id}>
                      <TableCell><Checkbox checked={selectedApps.has(app.id)} onCheckedChange={(checked) => {
                        const newSet = new Set(selectedApps);
                        checked ? newSet.add(app.id) : newSet.delete(app.id);
                        setSelectedApps(newSet);
                      }} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8"><AvatarImage src={app.profiles?.avatar_url} /><AvatarFallback className="text-xs">{app.profiles?.full_name?.charAt(0) || "U"}</AvatarFallback></Avatar>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{app.profiles?.full_name}</div>
                            <div className="text-xs text-muted-foreground truncate">{app.profiles?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{app.church_name || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="text-sm">
                        {app.position ? `${app.position} (${app.years_serving}${language === "ko" ? "년" : "yr"})` : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-xs">{format(new Date(app.created_at), "yy.MM.dd", { locale: dateLocale })}</TableCell>
                      <TableCell className="text-xs">
                        {app.last_sign_in_at ? formatDistanceToNow(new Date(app.last_sign_in_at), { addSuffix: true, locale: dateLocale }) : <span className="text-muted-foreground">{t("admin.applications.neverLoggedIn")}</span>}
                      </TableCell>
                      <TableCell className="text-center text-sm">{app.setsCount}</TableCell>
                      <TableCell className="text-center"><div className="flex items-center justify-center gap-1"><Music className="w-3 h-3 text-muted-foreground" /><span className="text-sm">{app.songsCount}</span></div></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          {app.isVirtual ? (
                            <Badge variant="outline" className="text-orange-500 border-orange-500">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {language === "ko" ? "신청서없음" : "No App"}
                            </Badge>
                          ) : (
                            getStatusBadge(app.status, app.status === "approved" && !app.reviewed_by)
                          )}
                          {app.hasWorshipLeaderRole && app.status === "pending" && <Badge className="bg-blue-500 text-white text-xs">WL</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {app.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => approveMutation.mutate(app.id)} disabled={approveMutation.isPending}><CheckCircle className="h-4 w-4 text-green-600" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => rejectMutation.mutate(app.id)} disabled={rejectMutation.isPending}><XCircle className="h-4 w-4 text-destructive" /></Button>
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
