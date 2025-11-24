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
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const CompleteWorshipLeaderProfileDialog = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    churchName: "",
    position: "",
    yearsServing: "",
    introduction: "",
  });

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user || !profile?.needs_worship_leader_profile) return;

      // Check if worship_leader_profile already exists
      const { data } = await supabase
        .from("worship_leader_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      // Only show dialog if profile doesn't exist and flag is set
      if (!data && profile.needs_worship_leader_profile) {
        setOpen(true);
      }
    };

    checkProfileCompletion();
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setLoading(true);

    try {
      // Create worship_leader_profile
      const { error: profileError } = await supabase
        .from("worship_leader_profiles")
        .insert({
          user_id: user.id,
          church_name: formData.churchName,
          position: formData.position,
          years_serving: parseInt(formData.yearsServing),
          introduction: formData.introduction,
        });

      if (profileError) throw profileError;

      // Clear the flag
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ needs_worship_leader_profile: false })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast({
        title: t("worshipLeaderRequest.profileComplete"),
        description: t("worshipLeaderRequest.profileCompleteDesc"),
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
    <Dialog open={open} onOpenChange={(isOpen) => !loading && setOpen(isOpen)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("worshipLeaderRequest.completeProfile")}</DialogTitle>
          <DialogDescription>
            {t("worshipLeaderRequest.completeProfileDesc")}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("worshipLeaderRequest.requiredInfo")}
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="churchName">{t("worshipLeaderRequest.churchName")}</Label>
            <Input
              id="churchName"
              type="text"
              required
              value={formData.churchName}
              onChange={(e) => setFormData({ ...formData, churchName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">{t("worshipLeaderRequest.position")}</Label>
            <Input
              id="position"
              type="text"
              required
              placeholder={t("worshipLeaderRequest.positionPlaceholder")}
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
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
