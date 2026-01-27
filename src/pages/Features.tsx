import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, revealViewportOptions } from "@/lib/animations";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  Music,
  ListMusic,
  Maximize,
  Printer,
  Calendar,
  PlayCircle,
  Newspaper,
  MessageCircle,
  Users,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Features = () => {
  const { language } = useTranslation();
  const { user } = useAuth();

  const features = [
    {
      icon: Music,
      titleEn: "Song Library",
      titleKo: "곡 라이브러리",
      descriptionEn: "Manage your worship song database with lyrics, scores, YouTube references, and usage history.",
      descriptionKo: "가사, 악보, YouTube 레퍼런스, 사용 이력을 포함한 찬양 곡 데이터베이스를 관리하세요.",
    },
    {
      icon: ListMusic,
      titleEn: "Set Builder",
      titleKo: "세트 빌더",
      descriptionEn: "Create worship sets with drag-and-drop interface. Add songs, prayers, scripture readings, and more.",
      descriptionKo: "드래그 앤 드롭으로 예배 순서를 구성하세요. 곡, 기도, 성경 봉독 등을 추가할 수 있습니다.",
    },
    {
      icon: Maximize,
      titleEn: "Tablet Fullscreen (Pinch to Zoom)",
      titleKo: "태블릿 전체화면 (핀치 투 줌)",
      descriptionEn: "View scores in fullscreen mode on tablets. Pinch to zoom for detailed viewing during worship.",
      descriptionKo: "태블릿에서 악보를 전체화면으로 보세요. 예배 중 핀치 투 줌으로 세밀하게 확인할 수 있습니다.",
    },
    {
      icon: Printer,
      titleEn: "One-Click Print",
      titleKo: "원클릭 인쇄",
      descriptionEn: "Print your worship set order, scores, and notes with a single click. Perfect for rehearsals.",
      descriptionKo: "예배 순서지, 악보, 노트를 원클릭으로 인쇄하세요. 리허설에 완벽합니다.",
    },
    {
      icon: Calendar,
      titleEn: "Recurring Templates",
      titleKo: "반복 템플릿",
      descriptionEn: "Create recurring schedules for regular worship services. Sets are automatically generated from templates.",
      descriptionKo: "정기 예배를 위한 반복 일정을 만드세요. 템플릿에서 자동으로 세트가 생성됩니다.",
    },
    {
      icon: PlayCircle,
      titleEn: "Music Player",
      titleKo: "뮤직 플레이어",
      descriptionEn: "Play your worship set as a playlist. Listen to reference tracks while preparing or during practice.",
      descriptionKo: "예배 콘티를 플레이리스트로 재생하세요. 준비나 연습 중에 레퍼런스 트랙을 들을 수 있습니다.",
    },
    {
      icon: Newspaper,
      titleEn: "Community Newsfeed",
      titleKo: "공동체 뉴스피드",
      descriptionEn: "Share updates, announcements, and encouragements with your worship team through the community feed.",
      descriptionKo: "커뮤니티 피드를 통해 예배팀과 업데이트, 공지, 격려를 나누세요.",
    },
    {
      icon: MessageCircle,
      titleEn: "Chat",
      titleKo: "채팅 기능",
      descriptionEn: "Real-time team communication within your worship community. Coordinate rehearsals and share ideas.",
      descriptionKo: "예배 공동체 내 실시간 팀 커뮤니케이션. 리허설을 조율하고 아이디어를 공유하세요.",
    },
    {
      icon: Users,
      titleEn: "Team Collaboration",
      titleKo: "팀 협업",
      descriptionEn: "Assign roles, invite collaborators, and work together on worship sets with real-time sync.",
      descriptionKo: "역할을 배정하고, 협력자를 초대하고, 실시간 동기화로 함께 예배 세트를 만드세요.",
    },
    {
      icon: Building2,
      titleEn: "Multi-Community",
      titleKo: "멀티 커뮤니티",
      descriptionEn: "Join and manage multiple worship communities. Reference setlists from other worship leaders.",
      descriptionKo: "여러 예배 공동체에 참여하고 관리하세요. 다른 워십리더들의 콘티를 참고할 수 있습니다.",
    },
  ];

  // Feature list JSON-LD for rich results
  const featuresJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": language === "ko" ? "K-Worship 주요 기능" : "K-Worship Key Features",
    "numberOfItems": features.length,
    "itemListElement": features.map((feature, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": language === "ko" ? feature.titleKo : feature.titleEn,
      "description": language === "ko" ? feature.descriptionKo : feature.descriptionEn
    }))
  };

  const content = (
    <div className="min-h-screen bg-background relative z-10">
      <SEOHead
        title="K-Worship Features - All-in-One Worship Team Tools"
        titleKo="K-Worship 기능 소개 - 예배팀을 위한 모든 도구"
        description="Discover K-Worship features: Song Library, Set Builder, Team Collaboration, Music Player, Print, and more. Everything for worship preparation."
        descriptionKo="K-Worship의 주요 기능을 알아보세요. 곡 라이브러리, 세트 빌더, 팀 협업, 뮤직 플레이어, 인쇄 기능 등 예배 준비의 모든 것."
        keywords="K-Worship features, worship software, church software, setlist builder, song library, team collaboration"
        keywordsKo="K-Worship 기능, 예배 소프트웨어, 교회 소프트웨어, 콘티 제작, 곡 라이브러리, 팀 협업"
        canonicalPath="/features"
        jsonLd={featuresJsonLd}
      />
      {/* Header for non-authenticated users */}
      {!user && <PublicPageHeader />}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {language === "ko" ? "주요 기능" : "Key Features"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === "ko" 
              ? "예배 준비의 모든 과정을 하나의 플랫폼에서"
              : "Everything you need for worship preparation in one platform"
            }
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              viewport={revealViewportOptions}
              whileInView="visible"
              initial="hidden"
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10 text-primary">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {language === "ko" ? feature.titleKo : feature.titleEn}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {language === "ko" ? feature.descriptionKo : feature.descriptionEn}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center mt-16 py-12 bg-muted/30 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {language === "ko" ? "지금 바로 시작하세요" : "Get Started Today"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {language === "ko" 
              ? "무료로 K-Worship의 모든 기능을 경험해 보세요"
              : "Experience all features of K-Worship for free"
            }
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            {language === "ko" ? "무료로 시작하기" : "Start for Free"}
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      {!user && <LandingFooter />}
    </div>
  );

  // For authenticated users, wrap in AppLayout
  if (user) {
    return <AppLayout>{content}</AppLayout>;
  }

  return content;
};

export default Features;