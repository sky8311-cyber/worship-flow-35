import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Instagram, Youtube, Home } from "lucide-react";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { CoverImageUpload } from "@/components/profile/CoverImageUpload";

export default function ProfileSettings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [ministryRole, setMinistryRole] = useState(profile?.ministry_role || "");
  const [instrument, setInstrument] = useState(profile?.instrument || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [instagramUrl, setInstagramUrl] = useState(profile?.instagram_url || "");
  const [youtubeUrl, setYoutubeUrl] = useState(profile?.youtube_url || "");

  // Update state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setLocation(profile.location || "");
      setMinistryRole(profile.ministry_role || "");
      setInstrument(profile.instrument || "");
      setBio(profile.bio || "");
      setInstagramUrl(profile.instagram_url || "");
      setYoutubeUrl(profile.youtube_url || "");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          location: location || null,
          ministry_role: ministryRole || null,
          instrument: instrument || null,
          bio: bio || null,
          instagram_url: instagramUrl || null,
          youtube_url: youtubeUrl || null,
        })
        .eq("id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: t("profile.updateSuccess") });
      navigate("/profile");
    },
    onError: () => {
      toast({
        title: t("profile.updateError"),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.backToDashboard")}
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Home className="h-4 w-4" />
            <span>/</span>
            <span>{t("profile.settings")}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">{t("profile.settings")}</h1>

      <div className="space-y-6">
        {/* Cover Image */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.coverImage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CoverImageUpload
              currentUrl={profile?.cover_image_url}
              onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ["profile"] })}
            />
          </CardContent>
        </Card>

        {/* Avatar */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.profilePicture")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AvatarUpload
              currentUrl={profile?.avatar_url}
              onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ["profile"] })}
            />
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.basicInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullName">{t("profile.fullName")}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email">{t("profile.email")}</Label>
              <Input id="email" value={profile?.email} disabled />
              <p className="text-sm text-muted-foreground mt-1">
                {t("profile.emailCannotChange")}
              </p>
            </div>

            <div>
              <Label htmlFor="phone">{t("profile.phone")}</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
              />
            </div>

            <div>
              <Label htmlFor="location">{t("profile.location")}</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("profile.locationPlaceholder")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ministry Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.ministryInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ministryRole">{t("profile.ministryRole")}</Label>
              <Input
                id="ministryRole"
                value={ministryRole}
                onChange={(e) => setMinistryRole(e.target.value)}
                placeholder={t("profile.ministryRolePlaceholder")}
              />
            </div>

            <div>
              <Label htmlFor="instrument">{t("profile.instrument")}</Label>
              <Input
                id="instrument"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                placeholder={t("profile.instrumentPlaceholder")}
              />
            </div>

            <div>
              <Label htmlFor="bio">{t("profile.bio")}</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                maxLength={500}
                placeholder={t("profile.bioPlaceholder")}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {bio.length} / 500
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.socialMedia")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <div className="flex gap-2">
                <Instagram className="w-5 h-5 text-muted-foreground mt-2" />
                <Input
                  id="instagram"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/username"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="youtube">YouTube</Label>
              <div className="flex gap-2">
                <Youtube className="w-5 h-5 text-muted-foreground mt-2" />
                <Input
                  id="youtube"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@channel"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? t("profile.saving") : t("profile.saveChanges")}
        </Button>
      </div>
      </div>
    </div>
  );
}
