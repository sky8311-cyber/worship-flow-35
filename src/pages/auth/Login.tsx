import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Eye, EyeOff } from "lucide-react";
import logoMobile from "@/assets/kworship-logo-mobile.png";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
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
    } else {
      toast.success(t("auth.loginSuccess"));
      // Clear stored redirect URL
      sessionStorage.removeItem("redirectAfterLogin");
      // Navigate directly to dashboard (or redirect URL)
      navigate(redirectUrl || "/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Simple Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
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
                disabled={loading}
              >
                {loading ? t("auth.loginPage.loggingIn") : t("auth.login")}
              </Button>

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
