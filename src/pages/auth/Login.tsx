import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Music, Users, FileText, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import logoDesktop from "@/assets/kworship-logo-desktop.png";
import logoMobile from "@/assets/kworship-logo-mobile.png";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const { t } = useTranslation();
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
      // Navigate to redirect URL if present, otherwise dashboard
      navigate(redirectUrl || "/");
    }
    setLoading(false);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const fadeInLeft = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5, delay: 0.2 }
  };

  const features = [
    {
      icon: Music,
      title: t("auth.loginPage.features.library.title"),
      description: t("auth.loginPage.features.library.description")
    },
    {
      icon: FileText,
      title: t("auth.loginPage.features.setBuilder.title"),
      description: t("auth.loginPage.features.setBuilder.description")
    },
    {
      icon: Users,
      title: t("auth.loginPage.features.community.title"),
      description: t("auth.loginPage.features.community.description")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header Navigation */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Center on Desktop, Left on Mobile */}
            <Link to="/" className="hidden md:block absolute left-1/2 -translate-x-1/2">
              <img src={logoDesktop} alt="K-Worship" className="h-20 w-auto cursor-pointer hover:opacity-80 transition-opacity object-contain" />
            </Link>
            <Link to="/" className="md:hidden">
              <img src={logoMobile} alt="K-Worship" className="h-16 w-auto cursor-pointer hover:opacity-80 transition-opacity object-contain" />
            </Link>
            
            {/* Language Toggle - Right */}
            <div className="ml-auto">
              <LanguageToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
          
          {/* Left Column - Informational Panel */}
          <motion.div 
            className="space-y-8"
            {...fadeInLeft}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight">
              {t("auth.loginPage.headline")}
            </h1>
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {t("auth.loginPage.betaBadge")}
                </Badge>
              </div>
            <h2 className="text-xl md:text-2xl lg:text-4xl font-bold text-foreground">
              {t("auth.loginPage.subheadline")}
            </h2>
            <p className="text-sm md:text-base lg:text-lg text-muted-foreground leading-relaxed">
              {t("auth.loginPage.description")}
            </p>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Login Card */}
          <motion.div
            {...fadeInUp}
            className="w-full"
          >
            <Card className="shadow-lg border-border/50">
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
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
