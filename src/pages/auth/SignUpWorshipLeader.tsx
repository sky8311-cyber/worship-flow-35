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
import { LanguageToggle } from "@/components/LanguageToggle";

const SignUpWorshipLeader = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    communityName: "",
    communityDescription: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t("auth.error"),
        description: t("auth.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // First, sign up the user
    const { error: signUpError } = await signUp(formData.email, formData.password, formData.fullName, formData.phone);
    
    if (signUpError) {
      toast({
        title: t("auth.error"),
        description: signUpError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: t("auth.error"),
        description: "Failed to get user information",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Add worship_leader role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role: "worship_leader" });

    if (roleError) {
      toast({
        title: t("auth.error"),
        description: roleError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Create the worship community
    const { error: communityError } = await supabase
      .from("worship_communities")
      .insert({
        name: formData.communityName,
        description: formData.communityDescription,
        leader_id: user.id,
      });

    if (communityError) {
      toast({
        title: t("auth.error"),
        description: communityError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: t("auth.success"),
      description: t("auth.worshipLeaderSuccess"),
    });
    
    navigate("/");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.signUpWorshipLeader")}</CardTitle>
          <CardDescription>{t("auth.worshipLeaderDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("auth.fullName")}</Label>
              <Input
                id="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("auth.phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-4">{t("auth.communityInfo")}</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="communityName">{t("auth.communityName")}</Label>
                  <Input
                    id="communityName"
                    type="text"
                    required
                    value={formData.communityName}
                    onChange={(e) => setFormData({ ...formData, communityName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="communityDescription">{t("auth.communityDescription")}</Label>
                  <Textarea
                    id="communityDescription"
                    value={formData.communityDescription}
                    onChange={(e) => setFormData({ ...formData, communityDescription: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.loading") : t("auth.signUpWorshipLeader")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Button variant="link" onClick={() => navigate("/login")}>
              {t("auth.hasAccount")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpWorshipLeader;
