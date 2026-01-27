import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator, 
  BreadcrumbPage 
} from "@/components/ui/breadcrumb";
import { 
  Home, 
  Newspaper, 
  Sparkles, 
  Palette, 
  FileText, 
  History, 
  ChevronRight,
  Instagram,
  Youtube,
  AtSign,
  Mail
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const infoLinks = [
  {
    path: "/news",
    icon: Newspaper,
    titleKo: "뉴스",
    titleEn: "News",
    descriptionKo: "최신 소식과 업데이트를 확인하세요",
    descriptionEn: "Check latest news and updates",
  },
  {
    path: "/features",
    icon: Sparkles,
    titleKo: "주요 기능",
    titleEn: "Key Features",
    descriptionKo: "K-Worship의 핵심 기능을 알아보세요",
    descriptionEn: "Discover K-Worship's core features",
  },
  {
    path: "/press",
    icon: Palette,
    titleKo: "브랜드에셋",
    titleEn: "Brand Assets",
    descriptionKo: "로고, 컬러 등 브랜드 자료",
    descriptionEn: "Logo, colors, and brand materials",
  },
  {
    path: "/legal",
    icon: FileText,
    titleKo: "약관 및 정책",
    titleEn: "Terms & Policies",
    descriptionKo: "이용약관, 개인정보처리방침",
    descriptionEn: "Terms of service, privacy policy",
  },
  {
    path: "/app-history",
    icon: History,
    titleKo: "앱 히스토리",
    titleEn: "App History",
    descriptionKo: "K-Worship의 발자취",
    descriptionEn: "K-Worship's journey",
  },
];

const socialLinks = [
  {
    href: "https://www.instagram.com/kworship.app",
    icon: Instagram,
    label: "Instagram",
  },
  {
    href: "https://www.threads.net/@kworship.app",
    icon: AtSign,
    label: "Threads",
  },
  {
    href: "https://youtube.com/@kworship.app",
    icon: Youtube,
    label: "YouTube",
  },
  {
    href: "mailto:hello@kworship.app",
    icon: Mail,
    label: "Email",
  },
];

const KWorshipInfo = () => {
  const { language } = useTranslation();

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
          <BreadcrumbPage>
            {language === "ko" ? "K-Worship 정보" : "About K-Worship"}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <AppLayout breadcrumb={breadcrumb}>
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {language === "ko" ? "K-Worship 정보" : "About K-Worship"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ko" 
              ? "K-Worship에 대해 알아보세요" 
              : "Learn more about K-Worship"}
          </p>
        </div>

        {/* Info Links */}
        <Card>
          <CardContent className="p-0">
            {infoLinks.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.path}>
                  <Link 
                    to={item.path}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {language === "ko" ? item.titleKo : item.titleEn}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === "ko" ? item.descriptionKo : item.descriptionEn}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                  {index < infoLinks.length - 1 && <Separator />}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              {language === "ko" ? "팔로우하기" : "Follow Us"}
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target={social.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={social.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Copyright */}
        <div className="text-center text-xs text-muted-foreground space-y-1 pt-4">
          <p>© {new Date().getFullYear()} Goodpapa Inc. All rights reserved.</p>
          <p>K-Worship™ is a trademark of Goodpapa Inc.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default KWorshipInfo;
