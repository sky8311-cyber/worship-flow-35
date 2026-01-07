import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LegalDocumentDialog } from "@/components/legal/LegalDocumentDialog";
import { getReferralCode, clearReferralCode } from "@/pages/ReferralRedirect";
import { useQuery } from "@tanstack/react-query";

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
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

  // Fetch active legal documents for recording acceptance
  const { data: legalDocuments } = useQuery({
    queryKey: ["legal-docs-signup", language],
    queryFn: async () => {
      const { data } = await supabase
        .from("legal_documents")
        .select("type, version")
        .eq("language", language)
        .eq("is_active", true)
        .in("type", ["terms", "privacy"]);
      return data || [];
    },
  });

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

  // Record legal acceptance
  const recordLegalAcceptance = async (userId: string) => {
    if (!legalDocuments?.length) return;
    
    try {
      for (const doc of legalDocuments) {
        await supabase.from("legal_acceptances").insert({
          user_id: userId,
          document_type: doc.type,
          version: doc.version,
          language: language as "ko" | "en",
          ip_address: null,
        });
      }
    } catch (error) {
      console.error("Error recording legal acceptance:", error);
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
    
    // Get the user ID for referral processing and legal acceptance
    const { data: { user: newUser } } = await supabase.auth.getUser();
    
    // Record legal acceptance
    if (newUser?.id) {
      await recordLegalAcceptance(newUser.id);
    }
    
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
            
            {/* Legal Consent Checkbox */}
            <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-0.5"
              />
              <div className="text-sm">
                <Label htmlFor="terms" className="cursor-pointer leading-relaxed">
                  {language === "ko" 
                    ? "본인은 Kworship " 
                    : "I agree to the Kworship "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => setTermsDialogOpen(true)}
                  >
                    {language === "ko" ? "이용약관" : "Terms of Service"}
                  </button>
                  {language === "ko" ? " 및 " : " and "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => setPrivacyDialogOpen(true)}
                  >
                    {language === "ko" ? "개인정보 처리방침" : "Privacy Policy"}
                  </button>
                  {language === "ko" ? "에 동의합니다." : "."}
                </Label>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading || !agreedToTerms}>
              {loading ? t("auth.loading") : t("auth.signUp")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Button variant="link" onClick={() => navigate("/login")}>
              {t("auth.hasAccount")}
            </Button>
          </div>
          <div className="mt-2 text-center text-xs text-muted-foreground">
            <Link to="/legal" className="hover:underline">
              {language === "ko" ? "약관 및 정책 보기" : "View Terms & Policies"}
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* Legal Document Dialogs */}
      <LegalDocumentDialog
        open={termsDialogOpen}
        onOpenChange={setTermsDialogOpen}
        documentType="terms"
      />
      <LegalDocumentDialog
        open={privacyDialogOpen}
        onOpenChange={setPrivacyDialogOpen}
        documentType="privacy"
      />
    </div>
  );
};

export default SignUp;
