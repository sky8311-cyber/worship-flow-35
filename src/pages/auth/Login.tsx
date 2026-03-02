import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Eye, EyeOff } from "lucide-react";
import logoMobile from "@/assets/kworship-logo-mobile.png";
import { SEOHead } from "@/components/seo/SEOHead";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { signIn, signInWithGoogle, user } = useAuth();
  const { t, language } = useTranslation();
  const { isGoogleLoginEnabled } = useAppSettings();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Get redirect URL from query params or sessionStorage
  const redirectUrl = searchParams.get("redirect") || sessionStorage.getItem("redirectAfterLogin");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(formData.email, formData.password);
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success(t("auth.loginSuccess"));
      // Clear stored redirect URL
      sessionStorage.removeItem("redirectAfterLogin");
      
      // Prefetch community data in background while navigating
      // This reduces perceived dashboard load time
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        queryClient.prefetchQuery({
          queryKey: ["user-communities-unified", currentUser.id],
          queryFn: async () => {
            const { data } = await supabase
              .from("community_members")
              .select("community_id, role, worship_communities(id, name, avatar_url, leader_id, is_active)")
              .eq("user_id", currentUser.id);
            
            const memberships = data || [];
            const communityIds = memberships.map((m) => m.community_id);
            const communities = memberships
              .map((m) => m.worship_communities)
              .filter(Boolean);
            const roleMap = new Map(
              memberships.map((m) => [m.community_id, m.role || "member"])
            );
            
            return { communityIds, communities, memberships, roleMap };
          },
        });
      }
      
      // Navigate directly to dashboard (or redirect URL)
      navigate(redirectUrl || "/dashboard");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
    // If successful, OAuth will redirect automatically
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEOHead
        title="Login - K-Worship"
        titleKo="로그인 - K-Worship"
        description="Sign in to K-Worship to manage your worship songs, create setlists, and collaborate with your team."
        descriptionKo="K-Worship에 로그인하여 찬양곡을 관리하고, 콘티를 제작하고, 팀과 협업하세요."
        canonicalPath="/login"
        noIndex={true}
      />
      {/* Simple Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky safe-top-offset z-50 safe-top">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <img src={logoMobile} alt="K-Worship" className="h-10 md:h-12 w-auto" />
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Centered Login Card */}
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-md shadow-lg border-border/50">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold">{t("auth.loginPage.cardTitle")}</CardTitle>
            <CardDescription className="text-base">
              {t("auth.loginPage.cardSubtitle")}
            </CardDescription>
            <p className="text-xs text-muted-foreground pt-2">
              {t("auth.loginPage.helperText")}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="worship@church.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-11"
                />
              </div>

              {/* Password Input with Toggle */}
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label 
                    htmlFor="remember" 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {t("auth.loginPage.rememberMe")}
                  </Label>
                </div>
                <Button 
                  type="button"
                  variant="link" 
                  className="p-0 h-auto text-sm"
                  onClick={() => navigate("/forgot-password")}
                >
                  {t("auth.forgotPassword")}
                </Button>
              </div>

              {/* Login Button */}
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium"
                disabled={loading || googleLoading}
              >
                {loading ? t("auth.loginPage.loggingIn") : t("auth.login")}
              </Button>

              {/* Google Login - conditionally rendered */}
              {isGoogleLoginEnabled && (
                <>
                  {/* Divider */}
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        {t("auth.orContinueWith")}
                      </span>
                    </div>
                  </div>

                  {/* Google Login Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {googleLoading ? t("auth.loading") : t("auth.continueWithGoogle")}
                  </Button>
                </>
              )}

              {/* Sign Up Link */}
              <div className="text-center pt-2">
                <span className="text-sm text-muted-foreground">
                  {t("auth.loginPage.signUpPrompt")}{" "}
                </span>
                <Button 
                  type="button"
                  variant="link" 
                  className="p-0 h-auto text-sm font-semibold"
                  onClick={() => navigate(redirectUrl ? `/signup?redirect=${encodeURIComponent(redirectUrl)}` : "/signup")}
                >
                  {t("auth.signUp")}
                </Button>
              </div>
              
              {/* Legal Links */}
              <div className="text-center pt-2 text-xs text-muted-foreground">
                <Link to="/legal" className="hover:underline">
                  {language === "ko" ? "이용약관" : "Terms of Service"}
                </Link>
                <span className="mx-2">|</span>
                <Link to="/legal" className="hover:underline">
                  {language === "ko" ? "개인정보 처리방침" : "Privacy Policy"}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
