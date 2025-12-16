import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

export const CompleteWorshipLeaderProfileDialog = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    communityName: "",
    website: "",
    country: "",
    servingPosition: "",
    yearsServing: "",
    introduction: "",
  });

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user || !profile?.needs_worship_leader_profile) return;

      // Check if worship leader fields are already filled in profiles table
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("church_name, serving_position")
        .eq("id", user.id)
        .single();

      if (existingProfile?.church_name && existingProfile?.serving_position) {
        // Profile already has worship leader data, clear the flag
        await supabase
          .from("profiles")
          .update({ needs_worship_leader_profile: false })
          .eq("id", user.id);
        await refreshProfile();
        return;
      }

      // Check if there's an approved application to use for pre-fill
      const { data: approvedApplication } = await supabase
        .from("worship_leader_applications")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .single();

      if (approvedApplication) {
        // Auto-fill profile from approved application
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            church_name: approvedApplication.church_name,
            church_website: approvedApplication.church_website,
            country: approvedApplication.country,
            serving_position: approvedApplication.position,
            years_serving: approvedApplication.years_serving,
            worship_leader_intro: approvedApplication.introduction,
            needs_worship_leader_profile: false,
          })
          .eq("id", user.id);

        if (!updateError) {
          toast({
            title: t("worshipLeaderRequest.profileUpdated"),
            description: t("worshipLeaderRequest.profileUpdatedDesc"),
          });
          
          await refreshProfile();
          return;
        }
      }

      // Check if there's a pending application to pre-fill from
      const { data: pendingApplication } = await supabase
        .from("worship_leader_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (pendingApplication) {
        // Pre-fill form with existing application data
        setFormData({
          communityName: pendingApplication.church_name || "",
          website: pendingApplication.church_website || "",
          country: pendingApplication.country || "",
          servingPosition: pendingApplication.position || "",
          yearsServing: pendingApplication.years_serving?.toString() || "",
          introduction: pendingApplication.introduction || "",
        });
      }

      setOpen(true);
    };

    checkProfileCompletion();
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setLoading(true);

    try {
      // Update profiles table with worship leader fields
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          church_name: formData.communityName,
          church_website: formData.website,
          country: formData.country,
          serving_position: formData.servingPosition,
          years_serving: parseInt(formData.yearsServing) || null,
          worship_leader_intro: formData.introduction,
          needs_worship_leader_profile: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast({
        title: t("worshipLeaderRequest.profileUpdated"),
        description: t("worshipLeaderRequest.profileUpdatedDesc"),
      });

      setOpen(false);
      await refreshProfile();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("worshipLeaderRequest.editProfile")}</DialogTitle>
          <DialogDescription>
            {t("worshipLeaderRequest.editProfileDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("worshipLeaderRequest.photo")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("worshipLeaderRequest.photoDesc")}
            </p>
            <AvatarUpload 
              currentUrl={profile?.avatar_url} 
              onUploadSuccess={() => refreshProfile()} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="communityName">{t("worshipLeaderRequest.communityName")}</Label>
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
              type="url"
              required
              placeholder={t("worshipLeaderRequest.websitePlaceholder")}
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">{t("worshipLeaderRequest.country")}</Label>
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
            <Label htmlFor="servingPosition">{t("worshipLeaderRequest.servingPosition")}</Label>
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
            <Label htmlFor="yearsServing">{t("worshipLeaderRequest.yearsServing")}</Label>
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
            <Label htmlFor="introduction">{t("worshipLeaderRequest.introduction")}</Label>
            <Textarea
              id="introduction"
              required
              rows={6}
              placeholder={t("worshipLeaderRequest.introductionPlaceholder")}
              value={formData.introduction}
              onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? t("auth.loading") : t("worshipLeaderRequest.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
