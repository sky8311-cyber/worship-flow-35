import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const RequestWorshipLeader = () => {
  const navigate = useNavigate();
  const { user, refreshProfile, isWorshipLeader } = useAuth();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    communityName: "",
    website: "",
    country: "",
    servingPosition: "",
    yearsServing: "",
    introduction: "",
  });

  // Fetch existing application
  const { data: existingApplication, isLoading: isLoadingApplication } = useQuery({
    queryKey: ["worship-leader-application-detail", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("worship_leader_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Cancel application mutation
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
      toast({
        title: language === "ko" ? "신청이 취소되었습니다" : "Application cancelled",
        description: language === "ko" ? "다시 신청할 수 있습니다" : "You can apply again",
      });
      queryClient.invalidateQueries({ queryKey: ["worship-leader-application-detail"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "ko" ? "취소 실패" : "Cancel failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setLoading(true);

    try {
      // Create application (denomination is now optional/null)
      const { data: application, error } = await supabase
        .from("worship_leader_applications")
        .insert({
          user_id: user.id,
          church_name: formData.communityName,
          church_website: formData.website || "",
          denomination: null,
          country: formData.country,
          position: formData.servingPosition,
          years_serving: parseInt(formData.yearsServing),
          introduction: formData.introduction,
        })
        .select()
        .single();

      if (error) throw error;

      // Check if auto-approve is enabled
      const { data: autoApproveFlag } = await supabase
        .from("platform_feature_flags")
        .select("enabled")
        .eq("key", "worship_leader_auto_approve")
        .single();

      if (autoApproveFlag?.enabled && application) {
        // Add worship_leader role
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "worship_leader")
          .maybeSingle();

        if (!existingRole) {
          await supabase.from("user_roles").insert({
            user_id: user.id,
            role: "worship_leader",
          });
        }

        // Update application status to approved
        await supabase
          .from("worship_leader_applications")
          .update({ status: "approved", reviewed_at: new Date().toISOString() })
          .eq("id", application.id);

        // Update profile with application data (only fill empty fields)
        const { data: profile } = await supabase
          .from("profiles")
          .select("church_name, church_website, country, years_serving, ministry_role, worship_leader_intro")
          .eq("id", user.id)
          .single();

        const profileUpdates: Record<string, unknown> = {};
        if (!profile?.church_name && formData.communityName) profileUpdates.church_name = formData.communityName;
        if (!profile?.church_website && formData.website) profileUpdates.church_website = formData.website;
        if (!profile?.country && formData.country) profileUpdates.country = formData.country;
        if (!profile?.years_serving && formData.yearsServing) profileUpdates.years_serving = parseInt(formData.yearsServing);
        if (!profile?.ministry_role && formData.servingPosition) profileUpdates.ministry_role = formData.servingPosition;
        if (!profile?.worship_leader_intro && formData.introduction) profileUpdates.worship_leader_intro = formData.introduction;

        if (Object.keys(profileUpdates).length > 0) {
          await supabase.from("profiles").update(profileUpdates).eq("id", user.id);
        }

        toast({
          title: "🎉 예배인도자 승급 승인!",
          description: "자동으로 예배인도자로 승급되었습니다.",
        });

        await refreshProfile();
      } else {
        toast({
          title: t("worshipLeaderRequest.success"),
          description: t("worshipLeaderRequest.successDesc"),
        });
      }

      window.location.href = "/dashboard";
    } catch (error: any) {
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (isLoadingApplication) {
    return (
      <div className="min-h-screen bg-gradient-soft p-4 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Already a worship leader
  if (isWorshipLeader) {
    return (
      <div className="min-h-screen bg-gradient-soft p-4">
        <div className="container max-w-2xl mx-auto py-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <h2 className="text-xl font-bold">
                  {language === "ko" ? "이미 예배인도자입니다!" : "You are already a worship leader!"}
                </h2>
                <p className="text-muted-foreground">
                  {language === "ko" 
                    ? "대시보드에서 예배인도자 기능을 사용하세요." 
                    : "Use worship leader features from the dashboard."}
                </p>
                <Button onClick={() => navigate("/dashboard")}>
                  {language === "ko" ? "대시보드로 이동" : "Go to Dashboard"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pending application - show status instead of form
  if (existingApplication?.status === "pending") {
    return (
      <div className="min-h-screen bg-gradient-soft p-4">
        <div className="container max-w-2xl mx-auto py-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                {language === "ko" ? "승급 신청 대기 중" : "Application Pending"}
              </CardTitle>
              <CardDescription>
                {language === "ko" 
                  ? "예배인도자 승급 신청이 접수되었습니다. 관리자의 승인을 기다리고 있습니다." 
                  : "Your worship leader application has been submitted and is awaiting admin approval."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Application Details */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">
                  {language === "ko" ? "신청 정보" : "Application Details"}
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "ko" ? "교회/공동체" : "Church/Community"}</span>
                    <span className="font-medium">{existingApplication.church_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "ko" ? "직분" : "Position"}</span>
                    <span className="font-medium">{existingApplication.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "ko" ? "국가" : "Country"}</span>
                    <span className="font-medium">{existingApplication.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "ko" ? "사역 기간" : "Years Serving"}</span>
                    <span className="font-medium">{existingApplication.years_serving}{language === "ko" ? "년" : " years"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "ko" ? "신청일" : "Applied on"}</span>
                    <span className="font-medium">
                      {format(new Date(existingApplication.created_at), language === "ko" ? "yyyy년 M월 d일" : "MMM d, yyyy", {
                        locale: language === "ko" ? ko : undefined,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cancel Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
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
                        ? "예배인도자 승급 신청이 취소됩니다. 나중에 다시 신청할 수 있습니다."
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Approved application (but not yet worship leader - edge case)
  if (existingApplication?.status === "approved") {
    return (
      <div className="min-h-screen bg-gradient-soft p-4">
        <div className="container max-w-2xl mx-auto py-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <h2 className="text-xl font-bold">
                  {language === "ko" ? "승급 신청이 승인되었습니다!" : "Your application was approved!"}
                </h2>
                <p className="text-muted-foreground">
                  {language === "ko" 
                    ? "곧 예배인도자 기능을 사용할 수 있습니다." 
                    : "You will soon have access to worship leader features."}
                </p>
                <Button onClick={() => navigate("/dashboard")}>
                  {language === "ko" ? "대시보드로 이동" : "Go to Dashboard"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Rejected - show message and allow re-application
  const showRejectedNotice = existingApplication?.status === "rejected";

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>

        {/* Rejected notice */}
        {showRejectedNotice && (
          <Card className="mb-4 border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-700 dark:text-yellow-400">
                    {language === "ko" ? "이전 신청이 거절되었습니다" : "Previous application was rejected"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === "ko" 
                      ? "아래 양식을 통해 다시 신청할 수 있습니다. 정보를 더 자세히 작성해 주세요."
                      : "You can reapply using the form below. Please provide more detailed information."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("worshipLeaderRequest.title")}</CardTitle>
            <CardDescription>{t("worshipLeaderRequest.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload Section */}
              <div className="space-y-2">
                <Label>{t("worshipLeaderRequest.photo")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("worshipLeaderRequest.photoDesc")}
                </p>
                <AvatarUpload onUploadSuccess={() => {}} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="communityName">
                  {t("worshipLeaderRequest.communityName")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="communityName"
                  type="text"
                  required
                  placeholder={t("worshipLeaderRequest.communityNamePlaceholder")}
                  value={formData.communityName}
                  onChange={(e) => setFormData({ ...formData, communityName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">{t("worshipLeaderRequest.website")}</Label>
                <Input
                  id="website"
                  type="text"
                  placeholder={t("worshipLeaderRequest.websitePlaceholder")}
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">
                  {t("worshipLeaderRequest.country")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="country"
                  type="text"
                  required
                  placeholder={t("worshipLeaderRequest.countryPlaceholder")}
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="servingPosition">
                  {t("worshipLeaderRequest.servingPosition")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="servingPosition"
                  type="text"
                  required
                  placeholder={t("worshipLeaderRequest.servingPositionPlaceholder")}
                  value={formData.servingPosition}
                  onChange={(e) => setFormData({ ...formData, servingPosition: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsServing">
                  {t("worshipLeaderRequest.yearsServing")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="yearsServing"
                  type="number"
                  required
                  min="0"
                  value={formData.yearsServing}
                  onChange={(e) => setFormData({ ...formData, yearsServing: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="introduction">
                  {t("worshipLeaderRequest.introduction")} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="introduction"
                  required
                  rows={6}
                  placeholder={t("worshipLeaderRequest.introductionPlaceholder")}
                  value={formData.introduction}
                  onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("auth.loading") : t("worshipLeaderRequest.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestWorshipLeader;
