import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { Download, Palette, Mail, FileImage, ExternalLink, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import kworshipLogoDesktop from "@/assets/kworship-logo-desktop.png";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const Press = () => {
  const { language } = useTranslation();
  const { user } = useAuth();

  // Actual brand colors from the app's design system (index.css)
  const brandColors = [
    { name: "Primary", hex: "#2B4C7E", hsl: "220 52% 35%", description: language === "ko" ? "네이비 블루" : "Navy Blue" },
    { name: "Secondary", hex: "#F5F5F7", hsl: "240 20% 96%", description: language === "ko" ? "밝은 회색" : "Light Gray" },
    { name: "Accent", hex: "#C96B6B", hsl: "358 55% 60%", description: language === "ko" ? "코랄 핑크" : "Coral Pink" },
    { name: "Background", hex: "#FCFCFD", hsl: "240 20% 99%", description: language === "ko" ? "거의 흰색" : "Off White" },
    { name: "Foreground", hex: "#232529", hsl: "240 10% 15%", description: language === "ko" ? "짙은 회색" : "Dark Gray" },
  ];

  const content = (
    <div className="min-h-screen bg-background relative z-10">
      {/* Header for non-authenticated users */}
      {!user && <PublicPageHeader />}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {language === "ko" ? "브랜드에셋" : "Brand Assets"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === "ko" 
              ? "K-Worship 브랜드 자료"
              : "K-Worship brand resources"
            }
          </p>
        </motion.div>

        <motion.div 
          className="space-y-12"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Brand Assets Section */}
          <motion.section variants={staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  {language === "ko" ? "브랜드 에셋" : "Brand Assets"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Downloads */}
                <div className="space-y-4">
                  <h3 className="font-semibold">
                    {language === "ko" ? "로고 다운로드" : "Logo Downloads"}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <a 
                      href="/kworship-icon.png" 
                      download="kworship-icon.png"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-card hover:bg-muted transition-colors"
                    >
                      <FileImage className="h-4 w-4" />
                      <span>{language === "ko" ? "아이콘 로고 (PNG)" : "Icon Logo (PNG)"}</span>
                    </a>
                    <a 
                      href={kworshipLogoDesktop}
                      download="kworship-logo-full.png"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-card hover:bg-muted transition-colors"
                    >
                      <FileImage className="h-4 w-4" />
                      <span>{language === "ko" ? "가로형 로고 (PNG)" : "Full Logo (PNG)"}</span>
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === "ko" 
                      ? "로고 사용 시 비율을 유지해 주세요."
                      : "Please maintain aspect ratio when using the logo."
                    }
                  </p>
                </div>

                {/* Logo Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Icon Logo Preview */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {language === "ko" ? "아이콘 로고" : "Icon Logo"}
                    </p>
                    <div className="flex items-center justify-center p-8 bg-muted/30 rounded-xl border">
                      <img 
                        src="/kworship-icon.png" 
                        alt="K-Worship Icon Logo" 
                        className="h-24 w-24"
                      />
                    </div>
                  </div>

                  {/* Full Logo Preview */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {language === "ko" ? "가로형 로고" : "Full Logo"}
                    </p>
                    <div className="flex items-center justify-center p-8 bg-muted/30 rounded-xl border">
                      <img 
                        src={kworshipLogoDesktop}
                        alt="K-Worship Full Logo" 
                        className="h-16 max-w-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Brand Colors Section */}
          <motion.section variants={staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {language === "ko" ? "브랜드 컬러" : "Brand Colors"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {brandColors.map((color) => (
                    <div key={color.name} className="space-y-2">
                      <div 
                        className="h-16 rounded-lg border shadow-sm"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div>
                        <p className="font-medium text-sm">{color.name}</p>
                        <p className="text-xs text-muted-foreground">{color.description}</p>
                        <p className="text-xs text-muted-foreground font-mono">{color.hex}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* App Information Section */}
          <motion.section variants={staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "ko" ? "앱 정보" : "App Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">
                      {language === "ko" ? "앱 이름" : "App Name"}
                    </h4>
                    <p className="text-muted-foreground">K-Worship</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">
                      {language === "ko" ? "개발사" : "Developer"}
                    </h4>
                    <p className="text-muted-foreground">Goodpapa Inc.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">
                      {language === "ko" ? "카테고리" : "Category"}
                    </h4>
                    <p className="text-muted-foreground">
                      {language === "ko" ? "생산성 / 음악" : "Productivity / Music"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">
                      {language === "ko" ? "지원 언어" : "Supported Languages"}
                    </h4>
                    <p className="text-muted-foreground">
                      {language === "ko" ? "한국어, 영어" : "Korean, English"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">
                    {language === "ko" ? "앱 소개" : "App Description"}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === "ko" 
                      ? "K-Worship은 예배팀을 위한 올인원 플랫폼입니다. 찬양 곡 라이브러리, 예배 순서(콘티) 관리, 팀 협업, 워십리더 커뮤니티 기능을 제공합니다. 한국 교회 예배 문화에 최적화된 솔루션으로, 예배 준비의 모든 과정을 간소화합니다."
                      : "K-Worship is an all-in-one platform for worship teams. It provides song library management, worship set (runsheet) creation, team collaboration, and worship leader community features. Optimized for Korean church worship culture, it streamlines every aspect of worship preparation."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Media Contact Section */}
          <motion.section variants={staggerItem}>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {language === "ko" ? "미디어 연락처" : "Media Contact"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {language === "ko" 
                    ? "인터뷰, 협업, 기타 미디어 문의는 아래로 연락해 주세요."
                    : "For interviews, collaborations, and other media inquiries, please contact us."
                  }
                </p>
                <Button asChild>
                  <a href="mailto:hello@kworship.app">
                    <Mail className="h-4 w-4 mr-2" />
                    hello@kworship.app
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.section>

          {/* App History Link */}
          <motion.section 
            variants={staggerItem}
            className="text-center py-8"
          >
            <p className="text-muted-foreground mb-4">
              {language === "ko" 
                ? "K-Worship의 발자취가 궁금하신가요?"
                : "Curious about K-Worship's journey?"
              }
            </p>
            <Button variant="outline" asChild>
              <Link to="/app-history">
                {language === "ko" ? "앱 히스토리 보기" : "View App History"}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </motion.section>
        </motion.div>
      </main>

      {/* Footer */}
      {!user && <LandingFooter />}
    </div>
  );

  const breadcrumb = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/kworship-info">
              {language === "ko" ? "K-Worship 정보" : "About K-Worship"}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            {language === "ko" ? "브랜드에셋" : "Brand Assets"}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  // For authenticated users, wrap in AppLayout
  if (user) {
    return <AppLayout breadcrumb={breadcrumb}>{content}</AppLayout>;
  }

  return content;
};

export default Press;
