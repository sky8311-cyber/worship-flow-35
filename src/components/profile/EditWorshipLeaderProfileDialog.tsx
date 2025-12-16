import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface EditWorshipLeaderProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditWorshipLeaderProfileDialog = ({ open, onOpenChange }: EditWorshipLeaderProfileDialogProps) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    communityName: "",
    website: "",
    country: "",
    position: "",
    yearsServing: "",
    introduction: "",
  });

  // Fetch existing worship leader profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["worship-leader-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("worship_leader_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user && open,
  });

  // Populate form with existing data
  useEffect(() => {
    if (profile) {
      setFormData({
        communityName: profile.church_name || "",
        website: profile.church_website || "",
        country: profile.country || "",
        position: profile.position || "",
        yearsServing: profile.years_serving?.toString() || "",
        introduction: profile.introduction || "",
      });
    }
  }, [profile]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("worship_leader_profiles")
        .update({
          church_name: formData.communityName,
          church_website: formData.website,
          country: formData.country,
          position: formData.position,
          years_serving: parseInt(formData.yearsServing) || 0,
          introduction: formData.introduction,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "프로필이 저장되었습니다" : "Profile saved successfully");
      queryClient.invalidateQueries({ queryKey: ["worship-leader-profile"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "ko" ? "예배인도자 프로필 변경" : "Edit Worship Leader Profile"}
          </DialogTitle>
          <DialogDescription>
            {language === "ko" ? "예배인도자 프로필 정보를 수정합니다" : "Update your worship leader profile information"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : !profile ? (
          <div className="py-8 text-center text-muted-foreground">
            {language === "ko" ? "프로필을 찾을 수 없습니다" : "Profile not found"}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="communityName">
                {language === "ko" ? "사역 공동체 이름" : "Community Name"}
              </Label>
              <Input
                id="communityName"
                value={formData.communityName}
                onChange={(e) => setFormData({ ...formData, communityName: e.target.value })}
                placeholder={language === "ko" ? "교회/사역단체 이름" : "Church/Organization name"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">
                {language === "ko" ? "웹사이트" : "Website"}
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">
                {language === "ko" ? "국가" : "Country"}
              </Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder={language === "ko" ? "대한민국" : "South Korea"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">
                {language === "ko" ? "담당 사역" : "Position"}
              </Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder={language === "ko" ? "예: 예배인도자, 찬양사역자" : "e.g. Worship Leader"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsServing">
                {language === "ko" ? "섬긴 기간 (년)" : "Years Serving"}
              </Label>
              <Input
                id="yearsServing"
                type="number"
                min="0"
                value={formData.yearsServing}
                onChange={(e) => setFormData({ ...formData, yearsServing: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="introduction">
                {language === "ko" ? "소개" : "Introduction"}
              </Label>
              <Textarea
                id="introduction"
                rows={4}
                value={formData.introduction}
                onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                placeholder={language === "ko" ? "간단한 자기 소개를 작성해주세요" : "Write a brief introduction about yourself"}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "..." : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
