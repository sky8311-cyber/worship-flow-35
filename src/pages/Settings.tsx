import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";
import { RoleBadge } from "@/components/RoleBadge";
import { COMMON_TIMEZONES, getSystemTimezone, getTimezoneDisplayName } from "@/lib/dateUtils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";
import { Mail, Lock, User, UserCog, Users, ExternalLink, Clock, XCircle, AlertTriangle, Globe, RefreshCw, Bell, BellOff, Home, CreditCard, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useTierFeature } from "@/hooks/useTierFeature";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CurationProfileChat } from "@/components/CurationProfileChat";

// Curation Profile Card Component
const CurationProfileCard = ({ autoOpen = false }: { autoOpen?: boolean }) => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const { tier } = useTierFeature();
  const [chatOpen, setChatOpen] = useState(autoOpen);

  // Open to worship_leader (Basic) and above
  const canAccessProfile = tier === "worship_leader" || tier === "premium" || tier === "church";

  useEffect(() => {
    if (autoOpen) setChatOpen(true);
  }, [autoOpen]);

  const { data: profile } = useQuery({
    queryKey: ["curation-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase
        .from("user_curation_profiles" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle() as any);
      if (error) throw error;
      return data as { skills_summary: string | null } | null;
    },
    enabled: !!user,
  });

  if (!canAccessProfile) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {language === "ko" ? "내 예배 프로필" : "My Worship Profile"}
          </CardTitle>
          <CardDescription>
            {profile?.skills_summary
              ? profile.skills_summary
              : (language === "ko" ? "AI 선곡을 위한 프로필을 아직 설정하지 않았습니다." : "You haven't set up your worship profile yet.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setChatOpen(true)} variant={profile?.skills_summary ? "outline" : "default"} className="w-full">
            {profile?.skills_summary
              ? (language === "ko" ? "프로필 수정하기" : "Edit Profile")
              : (language === "ko" ? "프로필 설정하기" : "Set Up Profile")}
          </Button>
        </CardContent>
      </Card>

      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {profile?.skills_summary ? "예배 프로필 수정" : "내 예배 프로필 설정"}
            </SheetTitle>
            <SheetDescription>
              AI가 더 정확한 선곡을 위해 몇 가지를 물어봅니다.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 min-h-0">
            <CurationProfileChat
              existingSummary={profile?.skills_summary}
              onComplete={() => setChatOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

// Email Preferences Card Component
const EmailPreferencesCard = () => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const queryClient = useQueryClient();

  const { data: emailPrefs, isLoading } = useQuery({
    queryKey: ["email-preferences", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase
        .from("email_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .single() as any);
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  const updatePreference = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await (supabase
        .from("email_preferences" as any)
        .upsert({ user_id: user.id, [key]: value }, { onConflict: "user_id" }) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-preferences"] });
      toast.success(language === "ko" ? "설정이 저장되었습니다" : "Preference saved");
    },
    onError: (error: any) => toast.error(error.message),
  });

  if (isLoading) return null;

  const prefs = emailPrefs || { automated_reminders: true, community_updates: true, product_updates: true, marketing_emails: true };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {language === "ko" ? "이메일 수신 설정" : "Email Preferences"}
        </CardTitle>
        <CardDescription>
          {language === "ko" ? "K-Worship에서 보내는 이메일 수신 여부를 설정합니다" : "Manage emails you receive from K-Worship"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <span>📬</span>
            <span className="text-sm">{language === "ko" ? "자동 리마인더" : "Automated Reminders"}</span>
          </div>
          <Switch
            checked={prefs.automated_reminders}
            onCheckedChange={(v) => updatePreference.mutate({ key: "automated_reminders", value: v })}
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <span>👥</span>
            <span className="text-sm">{language === "ko" ? "커뮤니티 업데이트" : "Community Updates"}</span>
          </div>
          <Switch
            checked={prefs.community_updates}
            onCheckedChange={(v) => updatePreference.mutate({ key: "community_updates", value: v })}
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <span>📢</span>
            <span className="text-sm">{language === "ko" ? "서비스 업데이트" : "Service Updates"}</span>
          </div>
          <Switch
            checked={prefs.product_updates}
            onCheckedChange={(v) => updatePreference.mutate({ key: "product_updates", value: v })}
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <span className="text-sm">{language === "ko" ? "마케팅 이메일" : "Marketing Emails"}</span>
          </div>
          <Switch
            checked={prefs.marketing_emails}
            onCheckedChange={(v) => updatePreference.mutate({ key: "marketing_emails", value: v })}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user, profile, isAdmin, isWorshipLeader, isCommunityLeaderInAnyCommunity, isCommunityOwnerInAnyCommunity, updatePassword, refreshProfile } = useAuth();
  const { isSandboxTester } = useAppSettings();
  const queryClient = useQueryClient();

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Dialog states
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  // Fetch application status
  const { data: applicationStatus } = useQuery({
    queryKey: ["worship-leader-application", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("worship_leader_applications")
        .select("status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user && !isWorshipLeader,
  });

  // Fetch user communities for management link
  const { data: userCommunities } = useQuery({
    queryKey: ["user-communities-settings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("community_members")
        .select(`
          community_id,
          role,
          worship_communities (id, name)
        `)
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const leaderCommunities = userCommunities?.filter(c => c.role === "community_leader") || [];

  // Handle email change
  const handleEmailChange = async () => {
    if (!newEmail.trim()) {
      toast.error(language === "ko" ? "새 이메일을 입력하세요" : "Please enter new email");
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success(language === "ko" ? "확인 이메일이 발송되었습니다" : "Confirmation email sent");
      setNewEmail("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(language === "ko" ? "비밀번호는 6자 이상이어야 합니다" : "Password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      toast.success(language === "ko" ? "비밀번호가 변경되었습니다" : "Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Timezone update mutation
  const updateTimezoneMutation = useMutation({
    mutationFn: async (newTimezone: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ timezone: newTimezone })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "시간대가 업데이트되었습니다" : "Timezone updated");
      refreshProfile();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleUseSystemTimezone = () => {
    const systemTimezone = getSystemTimezone();
    updateTimezoneMutation.mutate(systemTimezone);
  };

  const handleTimezoneChange = (timezone: string) => {
    updateTimezoneMutation.mutate(timezone);
  };

  // Cancel worship leader role mutation (uses edge function to bypass RLS)
  const cancelWorshipLeaderMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("cancel-worship-leader-role");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "예배인도자 승인이 취소되었습니다" : "Worship leader approval cancelled");
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["worship-leader-application"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Cancel pending application mutation
  const cancelApplicationMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("worship_leader_applications")
        .delete()
        .eq("user_id", user.id)
        .eq("status", "pending");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "신청이 취소되었습니다" : "Application cancelled");
      queryClient.invalidateQueries({ queryKey: ["worship-leader-application"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Push notification settings
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    preferences: pushPreferences,
    togglePush,
    updatePreference,
    isUpdatingPreferences,
    permission: pushPermission,
  } = usePushNotifications();

  // Push Notification Settings Card Component
  const PushNotificationSettingsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {language === "ko" ? "푸시 알림 설정" : "Push Notification Settings"}
        </CardTitle>
        <CardDescription>
          {language === "ko" 
            ? "브라우저를 닫아도 중요한 알림을 받을 수 있습니다" 
            : "Receive important notifications even when browser is closed"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isPushSupported ? (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {language === "ko" 
                ? "이 브라우저는 푸시 알림을 지원하지 않습니다" 
                : "This browser does not support push notifications"}
            </p>
          </div>
        ) : pushPermission === "denied" ? (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <BellOff className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">
                {language === "ko" ? "알림이 차단됨" : "Notifications Blocked"}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === "ko" 
                  ? "브라우저 설정에서 알림 권한을 허용해주세요" 
                  : "Please enable notifications in your browser settings"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Main toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{language === "ko" ? "푸시 알림 켜기" : "Enable Push Notifications"}</Label>
                <p className="text-xs text-muted-foreground">
                  {isPushSubscribed 
                    ? (language === "ko" ? "알림이 활성화되어 있습니다" : "Notifications are enabled")
                    : (language === "ko" ? "알림을 받으려면 켜세요" : "Turn on to receive notifications")}
                </p>
              </div>
              <Switch
                checked={isPushSubscribed}
                onCheckedChange={togglePush}
                disabled={isPushLoading}
              />
            </div>

            {/* Category toggles (only show when subscribed) */}
            {isPushSubscribed && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === "ko" ? "알림 유형 선택" : "Notification Types"}
                  </p>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span className="text-sm">{language === "ko" ? "일정 리마인더" : "Event Reminders"}</span>
                    </div>
                    <Switch
                      checked={pushPreferences.event_reminder}
                      onCheckedChange={(checked) => updatePreference("event_reminder", checked)}
                      disabled={isUpdatingPreferences}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span>🎵</span>
                      <span className="text-sm">{language === "ko" ? "새 워십세트 업로드" : "New Worship Sets"}</span>
                    </div>
                    <Switch
                      checked={pushPreferences.new_worship_set}
                      onCheckedChange={(checked) => updatePreference("new_worship_set", checked)}
                      disabled={isUpdatingPreferences}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span>📝</span>
                      <span className="text-sm">{language === "ko" ? "커뮤니티 피드 글" : "Community Posts"}</span>
                    </div>
                    <Switch
                      checked={pushPreferences.community_post}
                      onCheckedChange={(checked) => updatePreference("community_post", checked)}
                      disabled={isUpdatingPreferences}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span>💬</span>
                      <span className="text-sm">{language === "ko" ? "채팅 메시지" : "Chat Messages"}</span>
                    </div>
                    <Switch
                      checked={pushPreferences.chat_message}
                      onCheckedChange={(checked) => updatePreference("chat_message", checked)}
                      disabled={isUpdatingPreferences}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const breadcrumb = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard"><Home className="h-4 w-4" /></Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{language === "ko" ? "설정" : "Settings"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <AppLayout breadcrumb={breadcrumb}>
      <div className="container max-w-2xl mx-auto py-6 px-4 space-y-6">
        <h1 className="text-2xl font-bold">{language === "ko" ? "설정" : "Settings"}</h1>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {language === "ko" ? "계정 설정" : "Account Settings"}
            </CardTitle>
            <CardDescription>
              {language === "ko" ? "이메일과 비밀번호를 변경합니다" : "Change your email and password"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Change */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {language === "ko" ? "이메일 변경" : "Change Email"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === "ko" ? "현재 이메일: " : "Current email: "}{profile?.email}
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={language === "ko" ? "새 이메일 주소" : "New email address"}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <Button onClick={handleEmailChange} disabled={emailLoading}>
                  {emailLoading ? "..." : language === "ko" ? "변경" : "Change"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "ko" ? "새 이메일 주소로 확인 메일이 발송됩니다" : "A confirmation email will be sent to your new address"}
              </p>
            </div>

            <Separator />

            {/* Password Change */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {language === "ko" ? "비밀번호 변경" : "Change Password"}
              </Label>
              <Input
                type="password"
                placeholder={language === "ko" ? "새 비밀번호" : "New password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder={language === "ko" ? "새 비밀번호 확인" : "Confirm new password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button onClick={handlePasswordChange} disabled={passwordLoading}>
                {passwordLoading ? "..." : language === "ko" ? "비밀번호 변경" : "Change Password"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings - Timezone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {language === "ko" ? "지역 설정" : "Regional Settings"}
            </CardTitle>
            <CardDescription>
              {language === "ko" ? "정확한 이벤트 시간을 위해 시간대를 설정하세요" : "Set your timezone for accurate event times"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">{language === "ko" ? "현재 시간대" : "Current Timezone"}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.timezone 
                    ? getTimezoneDisplayName(profile.timezone, language as 'ko' | 'en')
                    : (language === "ko" ? "미설정" : "Not set")}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleUseSystemTimezone}
                disabled={updateTimezoneMutation.isPending}
                className="shrink-0"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {language === "ko" ? "시스템 설정 사용" : "Use System Settings"}
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>{language === "ko" ? "시간대 선택" : "Select Timezone"}</Label>
              <Select 
                value={profile?.timezone || ""} 
                onValueChange={handleTimezoneChange}
                disabled={updateTimezoneMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === "ko" ? "시간대 선택" : "Select timezone"} />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {language === "ko" ? tz.label : tz.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Push Notification Settings */}
        <PushNotificationSettingsCard />

        {/* Email Preferences Settings */}
        <EmailPreferencesCard />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {language === "ko" ? "프로필 관리" : "Profile Management"}
            </CardTitle>
            <CardDescription>
              {isWorshipLeader 
                ? (language === "ko" ? "기본 프로필과 예배인도자 정보를 관리합니다" : "Manage your basic profile and worship leader info")
                : (language === "ko" ? "기본 프로필을 관리합니다" : "Manage your basic profile")
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" onClick={() => setProfileEditOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              {language === "ko" ? "프로필 변경" : "Edit Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Role Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              {language === "ko" ? "역할 관리" : "Role Management"}
            </CardTitle>
            <CardDescription>
              {language === "ko" ? "예배인도자 역할을 관리합니다" : "Manage your worship leader role"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Roles */}
            <div className="flex flex-wrap gap-2">
              {isAdmin && <RoleBadge role="admin" />}
              {isCommunityOwnerInAnyCommunity && <RoleBadge role="community_owner" />}
              {isWorshipLeader && <RoleBadge role="worship_leader" />}
              {isCommunityLeaderInAnyCommunity && !isCommunityOwnerInAnyCommunity && (
                <RoleBadge role="community_leader" />
              )}
              {!isAdmin && !isWorshipLeader && !isCommunityLeaderInAnyCommunity && !isCommunityOwnerInAnyCommunity && (
                <RoleBadge role="member" />
              )}
            </div>

            <Separator />

            {/* Apply for Worship Leader (if not already one) */}
            {!isWorshipLeader && (
              <div className="space-y-3">
                {applicationStatus?.status === "pending" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-700 dark:text-yellow-400">
                          {language === "ko" ? "신청 검토 중" : "Application Pending"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === "ko" ? "관리자가 신청을 검토하고 있습니다" : "Admin is reviewing your application"}
                        </p>
                      </div>
                    </div>
                    {/* Cancel Application Button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <XCircle className="mr-2 h-4 w-4" />
                          {language === "ko" ? "신청 취소" : "Cancel Application"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {language === "ko" ? "신청을 취소하시겠습니까?" : "Cancel Application?"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {language === "ko" 
                              ? "예배인도자 승인 신청이 취소됩니다. 나중에 다시 신청할 수 있습니다."
                              : "Your worship leader application will be cancelled. You can apply again later."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancelApplicationMutation.mutate()}
                            disabled={cancelApplicationMutation.isPending}
                          >
                            {language === "ko" ? "신청 취소" : "Cancel Application"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : applicationStatus?.status === "rejected" ? (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-400">
                        {language === "ko" ? "신청이 거절되었습니다" : "Application Rejected"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === "ko" ? "다시 신청할 수 있습니다" : "You can apply again"}
                      </p>
                    </div>
                  </div>
                ) : null}

                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => navigate("/request-worship-leader")}
                  disabled={applicationStatus?.status === "pending"}
                >
                  <UserCog className="mr-2 h-4 w-4" />
                  {applicationStatus?.status === "rejected" 
                    ? (language === "ko" ? "예배인도자 재신청" : "Reapply for Worship Leader")
                    : (language === "ko" ? "예배인도자 승인 신청" : "Apply for Worship Leader Approval")}
                </Button>
              </div>
            )}

            {/* Cancel Worship Leader Role (if already worship leader) */}
            {isWorshipLeader && !isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    {language === "ko" ? "예배인도자 승인 취소" : "Cancel Worship Leader Approval"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {language === "ko" ? "예배인도자 승인을 취소하시겠습니까?" : "Cancel Worship Leader Approval?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {language === "ko" 
                        ? "예배인도자 권한이 제거됩니다. 곡 추가/편집, 워십세트 생성 등의 기능을 사용할 수 없게 됩니다."
                        : "Your worship leader privileges will be removed. You will lose access to features like adding/editing songs, creating worship sets, etc."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cancelWorshipLeaderMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {language === "ko" ? "승인 취소" : "Cancel Approval"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>

        {/* Community Management */}
        {(isCommunityLeaderInAnyCommunity || isWorshipLeader || isAdmin) && leaderCommunities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === "ko" ? "예배공동체 관리" : "Community Management"}
              </CardTitle>
              <CardDescription>
                {language === "ko" ? "리더로 있는 예배공동체를 관리합니다" : "Manage communities where you are a leader"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderCommunities.map((community: any) => (
                <Button
                  key={community.community_id}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate(`/community/${community.community_id}`)}
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {community.worship_communities?.name}
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Membership Link Card - Only visible to Admin or Sandbox Tester */}
        {(isAdmin || isSandboxTester) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {language === "ko" ? "멤버십" : "Membership"}
              </CardTitle>
              <CardDescription>
                {language === "ko" ? "멤버십 상태 확인 및 업그레이드" : "View membership status and upgrade options"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/membership")} className="w-full">
                {language === "ko" ? "멤버십 관리" : "Manage Membership"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Worship Curation Profile */}
        <CurationProfileCard />

        {/* Delete Account Section */}
        <DeleteAccountSection />

        {/* Dialog */}
        <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
      </div>
    </AppLayout>
  );
};

export default Settings;
