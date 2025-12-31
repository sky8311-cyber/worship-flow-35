import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { PremiumBillingCard } from "@/components/premium/PremiumBillingCard";
import { RoleBadge } from "@/components/RoleBadge";
import { COMMON_TIMEZONES, getSystemTimezone, getTimezoneDisplayName } from "@/lib/dateUtils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toast } from "sonner";
import { Mail, Lock, User, UserCog, Users, ExternalLink, Clock, XCircle, AlertTriangle, Globe, RefreshCw } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user, profile, isAdmin, isWorshipLeader, isCommunityLeaderInAnyCommunity, isCommunityOwnerInAnyCommunity, updatePassword, refreshProfile } = useAuth();
  const { isPremiumMenuVisible } = useAppSettings();
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

  return (
    <AppLayout>
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

        {/* Premium Subscription - only show if feature flag enabled */}
        {isPremiumMenuVisible && (
          <PremiumBillingCard />
        )}

        {/* Dialog */}
        <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
      </div>
    </AppLayout>
  );
};

export default Settings;
