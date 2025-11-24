import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Badge } from "@/components/ui/badge";
import { Music, Users, FileText, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import logoDesktop from "@/assets/kworship-logo-desktop.png";
import logoMobile from "@/assets/kworship-logo-mobile.png";

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(formData.email, formData.password);
    
    if (error) {
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t("auth.success"),
        description: t("auth.loginSuccess"),
      });
      navigate("/");
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
      title: "곡 라이브러리 저장 및 공유",
      description: "YouTube 링크와 악보가 연결된 체계적인 곡 관리"
    },
    {
      icon: FileText,
      title: "워십세트(콘티) 제작",
      description: "예배 흐름을 고려한 곡 선곡과 팀원 초대"
    },
    {
      icon: Users,
      title: "예배공동체 협업",
      description: "워십리더 커뮤니티에서 콘티 공유 및 참고"
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
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight">
                  예배 공동체를 위한
                </h1>
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  베타 서비스
                </Badge>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                워십리더 통합 플랫폼
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                K-Worship은 곡 라이브러리, 워십세트(콘티), 예배공동체와 커뮤니티를 한 곳에서 관리할 수 있는 예배 준비 올인원 앱입니다.
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
                <CardTitle className="text-2xl font-bold">로그인</CardTitle>
                <CardDescription className="text-base">
                  K-Worship 계정으로 예배 준비를 시작하세요
                </CardDescription>
                <p className="text-xs text-muted-foreground pt-2">
                  예배공동체에서 초대받은 이메일로 로그인해 주세요
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
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
                    <Label htmlFor="password">비밀번호</Label>
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
                        로그인 상태 유지
                      </Label>
                    </div>
                    <Button 
                      type="button"
                      variant="link" 
                      className="p-0 h-auto text-sm"
                      onClick={() => navigate("/forgot-password")}
                    >
                      비밀번호를 잊으셨나요?
                    </Button>
                  </div>

                  {/* Login Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-medium"
                    disabled={loading}
                  >
                    {loading ? "로그인 중..." : "로그인"}
                  </Button>

                  {/* Sign Up Link */}
                  <div className="text-center pt-2">
                    <span className="text-sm text-muted-foreground">
                      계정이 없으신가요?{" "}
                    </span>
                    <Button 
                      type="button"
                      variant="link" 
                      className="p-0 h-auto text-sm font-semibold"
                      onClick={() => navigate("/signup")}
                    >
                      회원가입
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
