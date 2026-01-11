import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building2, Music, FileText, Church, Settings, Crown, Calendar, CheckCircle, XCircle, UserPlus, CalendarDays, History } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  
  const {
    isLeaderboardEnabled,
    isChurchSubscriptionEnabled,
    isChurchMenuVisible,
    isPremiumEnabled,
    isPremiumMenuVisible,
    isSchedulerEnabled,
    isCrossCommunityEnabled,
    isWorshipLeaderAutoApproveEnabled,
    toggleLeaderboard,
    toggleChurchSubscription,
    toggleChurchMenu,
    togglePremium,
    togglePremiumMenu,
    toggleScheduler,
    toggleCrossCommunity,
    toggleWorshipLeaderAutoApprove,
    isUpdating,
    updateSuccess,
    updateError,
  } = useAppSettings();

  // Show toast when settings are updated
  useEffect(() => {
    if (updateSuccess) {
      toast.success(t("admin.settings.settingsSaved"));
    }
  }, [updateSuccess, t]);

  useEffect(() => {
    if (updateError) {
      toast.error(t("admin.settings.settingsSaveFailed"));
    }
  }, [updateError, t]);
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Calculate date ranges
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [users, communities, sets, songs, churchAccounts, worshipLeaders, weeklySignups, monthlySets, premiumSubs] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("worship_communities").select("*", { count: "exact", head: true }),
        supabase.from("service_sets").select("*", { count: "exact", head: true }),
        supabase.from("songs").select("*", { count: "exact", head: true }),
        supabase.from("church_accounts").select("subscription_status", { count: "exact" }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "worship_leader"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
        supabase.from("service_sets").select("*", { count: "exact", head: true }).gte("created_at", monthStart.toISOString()),
        supabase.from("premium_subscriptions").select("*", { count: "exact", head: true }).eq("subscription_status", "active"),
      ]);
      
      const trialCount = churchAccounts.data?.filter(a => a.subscription_status === "trial").length || 0;
      const activeCount = churchAccounts.data?.filter(a => a.subscription_status === "active").length || 0;
      
      return {
        users: users.count || 0,
        communities: communities.count || 0,
        sets: sets.count || 0,
        songs: songs.count || 0,
        churchAccounts: churchAccounts.count || 0,
        trialAccounts: trialCount,
        activeAccounts: activeCount,
        worshipLeaders: worshipLeaders.count || 0,
        weeklySignups: weeklySignups.count || 0,
        monthlySets: monthlySets.count || 0,
        premiumSubscribers: premiumSubs.count || 0,
      };
    },
  });

  // Fetch pending worship leader applications
  const { data: pendingApplications } = useQuery({
    queryKey: ["pending-applications"],
    queryFn: async () => {
      const { data: apps } = await supabase
        .from("worship_leader_applications")
        .select("*, profiles:user_id(full_name, email, avatar_url)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      return apps || [];
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const app = pendingApplications?.find(a => a.id === applicationId);
      if (!app) throw new Error("Application not found");

      // Add worship_leader role if not exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", app.user_id)
        .eq("role", "worship_leader")
        .maybeSingle();

      if (!existingRole) {
        await supabase.from("user_roles").insert({
          user_id: app.user_id,
          role: "worship_leader",
        });
      }

      // Update profile with application data (only fill empty fields)
      const { data: profile } = await supabase
        .from("profiles")
        .select("church_name, church_website, country, years_serving, ministry_role, worship_leader_intro")
        .eq("id", app.user_id)
        .single();

      const profileUpdates: Record<string, unknown> = {};
      if (!profile?.church_name && app.church_name) profileUpdates.church_name = app.church_name;
      if (!profile?.church_website && app.church_website) profileUpdates.church_website = app.church_website;
      if (!profile?.country && app.country) profileUpdates.country = app.country;
      if (!profile?.years_serving && app.years_serving) profileUpdates.years_serving = app.years_serving;
      if (!profile?.ministry_role && app.position) profileUpdates.ministry_role = app.position;
      if (!profile?.worship_leader_intro && app.introduction) profileUpdates.worship_leader_intro = app.introduction;

      if (Object.keys(profileUpdates).length > 0) {
        await supabase.from("profiles").update(profileUpdates).eq("id", app.user_id);
      }

      // Update application status
      const { error } = await supabase
        .from("worship_leader_applications")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-applications"] });
      toast.success(language === "ko" ? "승인되었습니다" : "Application approved");
    },
    onError: () => {
      toast.error(language === "ko" ? "오류가 발생했습니다" : "An error occurred");
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from("worship_leader_applications")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", applicationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-applications"] });
      toast.success(language === "ko" ? "거절되었습니다" : "Application rejected");
    },
    onError: () => {
      toast.error(language === "ko" ? "오류가 발생했습니다" : "An error occurred");
    },
  });
  
  const statCards = [
    {
      title: t("admin.stats.totalUsers"),
      value: stats?.users || 0,
      icon: Users,
      description: t("admin.stats.registeredUsers"),
      color: "text-blue-500",
    },
    {
      title: language === "ko" ? "기본 멤버" : "Basic Members",
      value: stats?.worshipLeaders || 0,
      icon: Music,
      description: language === "ko" ? "승인된 기본 멤버 수" : "Approved basic members",
      color: "text-indigo-500",
    },
    {
      title: t("admin.stats.communities"),
      value: stats?.communities || 0,
      icon: Building2,
      description: t("admin.stats.activeCommunities"),
      color: "text-green-500",
    },
    {
      title: t("admin.stats.serviceSets"),
      value: stats?.sets || 0,
      icon: FileText,
      description: t("admin.stats.totalSets"),
      color: "text-purple-500",
    },
    {
      title: t("admin.stats.songs"),
      value: stats?.songs || 0,
      icon: Music,
      description: t("admin.stats.totalSongs"),
      color: "text-pink-500",
    },
    {
      title: t("admin.stats.churchAccounts"),
      value: stats?.churchAccounts || 0,
      icon: Church,
      description: t("admin.stats.totalChurchAccounts"),
      color: "text-orange-500",
    },
  ];

  const activityCards = [
    {
      title: language === "ko" ? "이번 주 신규 가입" : "Weekly Sign-ups",
      value: stats?.weeklySignups || 0,
      icon: UserPlus,
      description: language === "ko" ? "최근 7일간 가입자" : "New users in last 7 days",
      color: "text-cyan-500",
    },
    {
      title: language === "ko" ? "이번 달 예배세트" : "Monthly Sets",
      value: stats?.monthlySets || 0,
      icon: CalendarDays,
      description: language === "ko" ? "이번 달 생성된 세트" : "Sets created this month",
      color: "text-emerald-500",
    },
    {
      title: language === "ko" ? "프리미엄 구독자" : "Premium Subscribers",
      value: stats?.premiumSubscribers || 0,
      icon: Crown,
      description: language === "ko" ? "활성 프리미엄 계정" : "Active premium accounts",
      color: "text-amber-500",
    },
  ];
  
  return (
    <div className="min-h-[100dvh] bg-gradient-soft">
      <AdminNav />
      
      <main className="container mx-auto px-4 py-8 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("admin.dashboard.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("admin.dashboard.subtitle")}
          </p>
        </div>

        {/* Pending Applications Card */}
        {pendingApplications && pendingApplications.length > 0 && (
          <Card className="mb-8 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-lg">
                    {language === "ko" ? "대기 중인 승급 신청" : "Pending Applications"}
                  </CardTitle>
                  <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                    {pendingApplications.length}{language === "ko" ? "건" : ""}
                  </Badge>
                </div>
                <Link to="/admin/applications">
                  <Button variant="outline" size="sm">
                    {language === "ko" ? "전체보기" : "View All"}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={(app.profiles as { avatar_url?: string })?.avatar_url || undefined} />
                        <AvatarFallback>
                          {((app.profiles as { full_name?: string })?.full_name?.[0] || "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {(app.profiles as { full_name?: string })?.full_name || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">{app.church_name}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => approveMutation.mutate(app.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {language === "ko" ? "승인" : "Approve"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => rejectMutation.mutate(app.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {language === "ko" ? "거절" : "Reject"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading statistics...</p>
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card key={card.title} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{card.title}</CardTitle>
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground mb-1">
                        {card.value}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {card.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Activity Stats */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                {language === "ko" ? "📊 활동 지표" : "📊 Activity Metrics"}
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {activityCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Card key={card.title} className="shadow-sm border-dashed">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-muted`}>
                            <Icon className={`w-5 h-5 ${card.color}`} />
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <p className="text-xs text-muted-foreground">{card.title}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Platform Settings */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* General Platform Settings */}
              <Card className="shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-muted-foreground" />
                    <CardTitle>{t("admin.settings.title")}</CardTitle>
                  </div>
                  <CardDescription>{t("admin.settings.subtitle")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Leaderboard Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">{t("admin.settings.leaderboard")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.settings.leaderboardDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={isLeaderboardEnabled}
                      onCheckedChange={toggleLeaderboard}
                      disabled={isUpdating}
                    />
                  </div>

                  <Separator />

                  {/* Church Subscription Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">{t("admin.settings.churchSubscription")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.settings.churchSubscriptionDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={isChurchSubscriptionEnabled}
                      onCheckedChange={toggleChurchSubscription}
                      disabled={isUpdating}
                    />
                  </div>

                  <Separator />

                  {/* Church Menu Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">{t("admin.settings.churchMenu")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.settings.churchMenuDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={isChurchMenuVisible}
                      onCheckedChange={toggleChurchMenu}
                      disabled={isUpdating}
                    />
                  </div>

                  <Separator />

                  {/* Worship Leader Auto Approve Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">{t("admin.settings.worshipLeaderAutoApprove")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.settings.worshipLeaderAutoApproveDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={isWorshipLeaderAutoApproveEnabled}
                      onCheckedChange={toggleWorshipLeaderAutoApprove}
                      disabled={isUpdating}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Premium Account Settings */}
              <Card className="shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <CardTitle>{t("admin.settings.premiumSettingsTitle")}</CardTitle>
                  </div>
                  <CardDescription>{t("admin.settings.premiumSettingsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Premium Enabled Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">{t("admin.settings.premiumEnabled")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.settings.premiumEnabledDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={isPremiumEnabled}
                      onCheckedChange={togglePremium}
                      disabled={isUpdating}
                    />
                  </div>

                  <Separator />

                  {/* Premium Menu Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">{t("admin.settings.premiumMenu")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.settings.premiumMenuDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={isPremiumMenuVisible}
                      onCheckedChange={togglePremiumMenu}
                      disabled={isUpdating}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Scheduler Settings */}
              <Card className="shadow-md lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <CardTitle>{t("admin.settings.schedulerSettingsTitle")}</CardTitle>
                  </div>
                  <CardDescription>{t("admin.settings.schedulerSettingsDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Scheduler Enabled Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="space-y-0.5">
                        <Label className="text-base">{t("admin.settings.schedulerEnabled")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("admin.settings.schedulerEnabledDesc")}
                        </p>
                      </div>
                      <Switch
                        checked={isSchedulerEnabled}
                        onCheckedChange={toggleScheduler}
                        disabled={isUpdating}
                      />
                    </div>

                    {/* Cross-Community Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="space-y-0.5">
                        <Label className="text-base">{t("admin.settings.crossCommunity")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("admin.settings.crossCommunityDesc")}
                        </p>
                      </div>
                      <Switch
                        checked={isCrossCommunityEnabled}
                        onCheckedChange={toggleCrossCommunity}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform History Link Card */}
            <Card className="shadow-md mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-500" />
                    <CardTitle>{language === "ko" ? "플랫폼 히스토리" : "Platform History"}</CardTitle>
                  </div>
                  <Link to="/admin/history">
                    <Button variant="outline" size="sm">
                      {language === "ko" ? "관리하기" : "Manage"}
                    </Button>
                  </Link>
                </div>
                <CardDescription>
                  {language === "ko" 
                    ? "앱 히스토리 페이지에 표시할 마일스톤을 관리합니다" 
                    : "Manage milestones displayed on the App History page"}
                </CardDescription>
              </CardHeader>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
