import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getReferralCode, clearReferralCode } from "@/pages/ReferralRedirect";

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    birthDate: "",
  });

  // Get redirect URL from query params or sessionStorage
  const redirectUrl = searchParams.get("redirect") || sessionStorage.getItem("redirectAfterLogin");
  
  // Get stored referral code
  const [storedReferralCode, setStoredReferralCode] = useState<string | null>(null);
  
  useEffect(() => {
    const code = getReferralCode();
    if (code) {
      setStoredReferralCode(code);
      console.log("Found referral code:", code);
    }
  }, []);

  // Process referral after successful signup
  const processReferral = async (userId: string) => {
    if (!storedReferralCode) return;
    
    try {
      console.log("Processing referral for user:", userId, "with code:", storedReferralCode);
      
      const response = await supabase.functions.invoke("process-referral", {
        body: {
          referralCode: storedReferralCode,
          referredUserId: userId,
          source: "link"
        }
      });
      
      if (response.data?.success) {
        console.log("Referral processed successfully");
      } else {
        console.log("Referral processing result:", response.data);
      }
    } catch (error) {
      console.error("Error processing referral:", error);
    } finally {
      // Always clear the referral code after attempting to process
      clearReferralCode();
    }
  };

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
    const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.phone, formData.birthDate);
    
    if (error) {
      // Check if user already exists - treat as successful login
      if (error.message?.includes("already registered") || error.message?.includes("already been registered")) {
        toast({
          title: t("auth.success"),
          description: t("auth.alreadyRegisteredLoggedIn"),
        });
        setLoading(false);
        // Clear stored redirect URL
        sessionStorage.removeItem("redirectAfterLogin");
        // Navigate to redirect URL if present, otherwise dashboard
        navigate(redirectUrl || "/dashboard");
        return;
      }
      
      // Real error - show destructive toast
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    // Success - new signup (auto-confirm enabled, redirect immediately)
    toast({
      title: t("auth.success"),
      description: t("auth.accountCreated"),
    });
    
    // Get the user ID for referral processing
    const { data: { user: newUser } } = await supabase.auth.getUser();
    
    // Process referral if exists
    if (newUser?.id && storedReferralCode) {
      await processReferral(newUser.id);
    }
    
    // Send welcome email
    try {
      await supabase.functions.invoke('send-welcome-email', {
        body: { email: formData.email, name: formData.fullName }
      });
    } catch (emailError) {
      console.log('Welcome email failed, but signup succeeded:', emailError);
    }
    
    setLoading(false);
    // Clear stored redirect URL
    sessionStorage.removeItem("redirectAfterLogin");
    // Navigate to redirect URL if present, otherwise dashboard
    navigate(redirectUrl || "/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.signUp")}</CardTitle>
          <CardDescription>{t("auth.signUpDescription")}</CardDescription>
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
              <Label htmlFor="birthDate">{t("auth.birthDate")}</Label>
              <Input
                id="birthDate"
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.loading") : t("auth.signUp")}
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

export default SignUp;
