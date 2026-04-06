import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SEOHead } from "@/components/seo/SEOHead";
import { Mail, MessageCircle, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const Support = () => {
  const { language } = useTranslation();
  const { user } = useAuth();

  const content = (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={language === "ko" ? "고객 지원 | K-Worship" : "Customer Support | K-Worship"}
        description={language === "ko"
          ? "K-Worship 고객 지원 페이지입니다. 이메일 또는 앱 내 채팅으로 문의하세요."
          : "K-Worship customer support. Contact us via email or in-app chat."}
        canonicalPath="/support"
        breadcrumbs={[
          { name: "Home", nameKo: "홈", url: "/" },
          { name: "Support", nameKo: "고객 지원", url: "/support" },
        ]}
      />

      {!user && <PublicPageHeader />}

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {language === "ko" ? "고객 지원" : "Customer Support"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === "ko"
              ? "궁금한 점이 있으시면 언제든 연락해 주세요"
              : "We're here to help — reach out anytime"}
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Email Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
              <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">
                  {language === "ko" ? "이메일 문의" : "Email Us"}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {language === "ko"
                    ? "이메일로 문의해 주시면 영업일 기준 24시간 이내에 답변드리겠습니다."
                    : "Send us an email and we'll get back to you within 24 business hours."}
                </p>
                <a
                  href="mailto:hello@kworship.app"
                  className="text-primary font-medium hover:underline text-lg"
                >
                  hello@kworship.app
                </a>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chat Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
              <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">
                  {language === "ko" ? "실시간 채팅 상담" : "Live Chat Support"}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {language === "ko"
                    ? "로그인 후 앱 내 채팅으로 실시간 고객상담을 이용하실 수 있습니다."
                    : "Log in to access real-time chat support within the app."}
                </p>
                {user ? (
                  <Button asChild>
                    <Link to="/dashboard">
                      {language === "ko" ? "대시보드로 이동" : "Go to Dashboard"}
                    </Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/login">
                      {language === "ko" ? "로그인하기" : "Log In"}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Response Info */}
        <motion.div
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p>
            {language === "ko"
              ? "운영 시간: 월–금 09:00–18:00 (KST) | 주말 및 공휴일 이메일 접수 가능"
              : "Hours: Mon–Fri 9 AM – 6 PM (KST) | Emails accepted on weekends & holidays"}
          </p>
        </motion.div>
      </main>

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
          <BreadcrumbPage>
            {language === "ko" ? "고객 지원" : "Customer Support"}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  if (user) {
    return <AppLayout breadcrumb={breadcrumb}>{content}</AppLayout>;
  }

  return content;
};

export default Support;
