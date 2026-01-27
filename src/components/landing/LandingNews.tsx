import { Link } from "react-router-dom";
import { ArrowRight, Newspaper } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { NewsCard } from "@/components/news/NewsCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

export const LandingNews = () => {
  const { language } = useTranslation();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["landing-news-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("id, title, title_ko, slug, excerpt, excerpt_ko, category, cover_image_url, external_url, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
  });

  // Don't render section if no posts
  if (!isLoading && (!posts || posts.length === 0)) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-6xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Section Header */}
          <motion.div 
            className="flex items-center justify-between mb-10"
            variants={staggerItem}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Newspaper className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  {language === "ko" ? "최신 소식" : "What's New"}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {language === "ko" ? "K-Worship의 새로운 소식을 확인하세요" : "Stay updated with K-Worship news"}
                </p>
              </div>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/news" className="gap-2">
                {language === "ko" ? "더보기" : "View All"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Posts Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerItem}
            >
              {posts?.map((post) => (
                <NewsCard key={post.id} post={post} />
              ))}
            </motion.div>
          )}

          {/* Mobile View All Button */}
          <motion.div 
            className="mt-8 text-center sm:hidden"
            variants={staggerItem}
          >
            <Button variant="outline" asChild>
              <Link to="/news" className="gap-2">
                {language === "ko" ? "모든 소식 보기" : "View All News"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
