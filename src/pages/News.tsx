import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SEOHead } from "@/components/seo/SEOHead";
import { NewsCard } from "@/components/news/NewsCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Rss } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import logoMobile from "@/assets/kworship-logo-mobile.png";
import logoDesktop from "@/assets/kworship-logo-desktop.png";

const categories = [
  { value: "all", labelKo: "전체", labelEn: "All" },
  { value: "news", labelKo: "뉴스", labelEn: "News" },
  { value: "update", labelKo: "업데이트", labelEn: "Updates" },
  { value: "blog", labelKo: "블로그", labelEn: "Blog" },
  { value: "press", labelKo: "보도자료", labelEn: "Press" },
];

const News = () => {
  const { language } = useTranslation();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["news-posts", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("news_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      
      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const newsListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": language === "ko" ? "K-Worship 뉴스" : "K-Worship News",
    "description": language === "ko" 
      ? "K-Worship의 최신 소식, 업데이트, 보도자료를 확인하세요"
      : "Latest news, updates, and press releases from K-Worship",
    "url": "https://kworship.app/news",
  };

  const content = (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="News"
        titleKo="뉴스"
        description="Latest news, updates, and press releases from K-Worship - the all-in-one worship team platform."
        descriptionKo="K-Worship의 최신 소식, 기능 업데이트, 보도자료를 확인하세요."
        keywords="K-Worship news, worship app updates, K-Worship blog, press releases"
        keywordsKo="K-Worship 뉴스, 케이워십 업데이트, 블로그, 보도자료"
        canonicalPath="/news"
        jsonLd={newsListSchema}
      />

      {/* Header for non-authenticated users */}
      {!user && (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/">
              <img src={logoMobile} alt="K-Worship" className="h-10 md:hidden" />
              <img src={logoDesktop} alt="K-Worship" className="hidden md:block h-12" />
            </Link>
            <LanguageToggle />
          </div>
        </header>
      )}

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Page Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {language === "ko" ? "뉴스" : "News"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === "ko" 
              ? "K-Worship의 최신 소식과 업데이트를 확인하세요"
              : "Stay updated with the latest from K-Worship"
            }
          </p>
          
          {/* RSS Feed Link */}
          <div className="mt-6">
            <Button variant="outline" size="sm" asChild>
              <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className="gap-2">
                <Rss className="h-4 w-4" />
                RSS Feed
              </a>
            </Button>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="w-full max-w-xl mx-auto grid grid-cols-5">
              {categories.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value} className="text-sm">
                  {language === "ko" ? cat.labelKo : cat.labelEn}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {posts.map((post) => (
              <motion.div key={post.id} variants={staggerItem}>
                <NewsCard post={post} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {language === "ko" ? "아직 게시된 소식이 없습니다." : "No posts yet."}
            </p>
          </div>
        )}
      </main>

      {!user && <LandingFooter />}
    </div>
  );

  return user ? <AppLayout>{content}</AppLayout> : content;
};

export default News;
