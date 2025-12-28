import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowLeft } from "lucide-react";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

const RequestWorshipLeader = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    communityName: "",
    website: "",
    country: "",
    servingPosition: "",
    yearsServing: "",
    introduction: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setLoading(true);

    try {
      // Check if already applied
      const { data: existing } = await supabase
        .from("worship_leader_applications")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .single();

      if (existing) {
        toast({
          title: t("worshipLeaderRequest.alreadyApplied"),
          description: t("worshipLeaderRequest.alreadyAppliedDesc"),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

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

      navigate("/dashboard");
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
