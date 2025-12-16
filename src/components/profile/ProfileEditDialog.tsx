import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Instagram, Youtube, Church } from "lucide-react";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const { user, profile, refreshProfile, isWorshipLeader } = useAuth();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();

  // Basic profile fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [ministryRole, setMinistryRole] = useState("");
  const [instrument, setInstrument] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  // Worship leader fields (stored in profiles table)
  const [churchName, setChurchName] = useState("");
  const [churchWebsite, setChurchWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [servingPosition, setServingPosition] = useState("");
  const [yearsServing, setYearsServing] = useState("");
  const [worshipLeaderIntro, setWorshipLeaderIntro] = useState("");

  useEffect(() => {
    if (profile) {
      // Basic profile
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setBirthDate(profile.birth_date || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setMinistryRole(profile.ministry_role || "");
      setInstrument(profile.instrument || "");
      setInstagramUrl(profile.instagram_url || "");
      setYoutubeUrl(profile.youtube_url || "");

      // Worship leader fields (now in profiles table)
      setChurchName((profile as any).church_name || "");
      setChurchWebsite((profile as any).church_website || "");
      setCountry((profile as any).country || "");
      setServingPosition((profile as any).serving_position || "");
      setYearsServing((profile as any).years_serving?.toString() || "");
      setWorshipLeaderIntro((profile as any).worship_leader_intro || "");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const updateData: any = {
        full_name: fullName,
        phone: phone,
        birth_date: birthDate || null,
        bio: bio,
        location: location,
        ministry_role: ministryRole,
        instrument: instrument,
        instagram_url: instagramUrl,
        youtube_url: youtubeUrl,
        updated_at: new Date().toISOString(),
      };

      // Include worship leader fields if user is worship leader
      if (isWorshipLeader) {
        updateData.church_name = churchName || null;
        updateData.church_website = churchWebsite || null;
        updateData.country = country || null;
        updateData.serving_position = servingPosition || null;
        updateData.years_serving = yearsServing ? parseInt(yearsServing) : null;
        updateData.worship_leader_intro = worshipLeaderIntro || null;
        // Clear the needs_worship_leader_profile flag if worship leader is saving their profile
        updateData.needs_worship_leader_profile = false;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user?.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      await refreshProfile();
      toast({
        title: t("profile.updateSuccess"),
        description: t("profile.updateSuccessDescription"),
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("profile.updateError"),
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("profile.editProfile")}</DialogTitle>
          <DialogDescription>{t("profile.editProfileDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t("profile.basicInfo")}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("profile.fullName")}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("profile.fullNamePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("profile.phone")}</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("profile.phonePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">{t("profile.birthDate")}</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t("profile.bio")}</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("profile.bioPlaceholder")}
                rows={4}
              />
            </div>
          </div>

          {/* Ministry Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t("profile.ministryInfo")}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="location">{t("profile.location")}</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("profile.locationPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ministryRole">{t("profile.ministryRole")}</Label>
              <Input
                id="ministryRole"
                value={ministryRole}
                onChange={(e) => setMinistryRole(e.target.value)}
                placeholder={t("profile.ministryRolePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instrument">{t("profile.instrument")}</Label>
              <Input
                id="instrument"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                placeholder={t("profile.instrumentPlaceholder")}
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t("profile.socialLinks")}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="instagram">
                <Instagram className="inline w-4 h-4 mr-2" />
                {t("profile.instagram")}
              </Label>
              <Input
                id="instagram"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtube">
                <Youtube className="inline w-4 h-4 mr-2" />
                {t("profile.youtube")}
              </Label>
              <Input
                id="youtube"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/@username"
              />
            </div>
          </div>

          {/* Worship Leader Info - Only shown for worship leaders */}
          {isWorshipLeader && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Church className="h-4 w-4" />
                {language === "ko" ? "예배인도자 정보" : "Worship Leader Info"}
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="churchName">
                  {language === "ko" ? "사역 공동체 이름" : "Community/Church Name"}
                </Label>
                <Input
                  id="churchName"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  placeholder={language === "ko" ? "예: 새생명교회 찬양팀" : "e.g., New Life Church Worship Team"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="churchWebsite">
                  {language === "ko" ? "웹사이트" : "Website"}
                </Label>
                <Input
                  id="churchWebsite"
                  type="url"
                  value={churchWebsite}
                  onChange={(e) => setChurchWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">
                  {language === "ko" ? "국가" : "Country"}
                </Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder={language === "ko" ? "예: 대한민국" : "e.g., South Korea"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="servingPosition">
                  {language === "ko" ? "섬기는 포지션" : "Serving Position"}
                </Label>
                <Input
                  id="servingPosition"
                  value={servingPosition}
                  onChange={(e) => setServingPosition(e.target.value)}
                  placeholder={language === "ko" ? "예: 예배인도자, 보컬리더" : "e.g., Worship Leader, Vocal Leader"}
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
                  value={yearsServing}
                  onChange={(e) => setYearsServing(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="worshipLeaderIntro">
                  {language === "ko" ? "예배인도자 소개" : "Worship Leader Introduction"}
                </Label>
                <Textarea
                  id="worshipLeaderIntro"
                  value={worshipLeaderIntro}
                  onChange={(e) => setWorshipLeaderIntro(e.target.value)}
                  placeholder={language === "ko" 
                    ? "예배인도자로서의 비전, 경험, 사역 소개를 적어주세요" 
                    : "Share your vision, experience, and ministry as a worship leader"}
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? t("profile.saving") : t("profile.saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
