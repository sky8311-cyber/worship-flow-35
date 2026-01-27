import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SEOHead } from "@/components/seo/SEOHead";
import { NewsShareButtons } from "@/components/news/NewsShareButtons";
import { NewsCard } from "@/components/news/NewsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import DOMPurify from "dompurify";
import logoMobile from "@/assets/kworship-logo-mobile.png";
import logoDesktop from "@/assets/kworship-logo-desktop.png";

const categoryConfig: Record<string, { label: string; labelKo: string; color: string }> = {
  news: { label: "News", labelKo: "뉴스", color: "bg-blue-100 text-blue-700" },
  update: { label: "Update", labelKo: "업데이트", color: "bg-green-100 text-green-700" },
  blog: { label: "Blog", labelKo: "블로그", color: "bg-purple-100 text-purple-700" },
  press: { label: "Press", labelKo: "보도자료", color: "bg-amber-100 text-amber-700" },
};

const NewsDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["news-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Increment view count
  useEffect(() => {
    if (post?.id) {
      supabase.rpc("increment_news_view_count", { post_id: post.id });
    }
  }, [post?.id]);

  // Fetch related posts
  const { data: relatedPosts } = useQuery({
    queryKey: ["related-news", post?.category, post?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("id, title, title_ko, slug, excerpt, excerpt_ko, category, cover_image_url, external_url, published_at")
        .eq("is_published", true)
        .eq("category", post!.category)
        .neq("id", post!.id)
        .order("published_at", { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
    enabled: !!post?.id,
  });

  if (error) {
    navigate("/news");
    return null;
  }

  const title = post && (language === "ko" && post.title_ko ? post.title_ko : post.title);
  const content = post && (language === "ko" && post.content_ko ? post.content_ko : post.content);
  const excerpt = post && (language === "ko" && post.excerpt_ko ? post.excerpt_ko : post.excerpt);
  const category = post ? (categoryConfig[post.category] || categoryConfig.news) : null;
  
  const formattedDate = post?.published_at 
    ? format(new Date(post.published_at), language === "ko" ? "yyyy년 M월 d일" : "MMMM d, yyyy", { locale: language === "ko" ? ko : undefined })
    : null;

  const articleSchema = post ? {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "description": excerpt,
    "datePublished": post.published_at,
    "dateModified": post.updated_at,
    "author": {
      "@type": "Organization",
      "name": "K-Worship"
    },
    "publisher": {
      "@type": "Organization",
      "name": "K-Worship",
      "logo": {
        "@type": "ImageObject",
        "url": "https://kworship.app/kworship-icon.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://kworship.app/news/${slug}`
    },
    ...(post.cover_image_url && { "image": post.cover_image_url })
  } : undefined;

  const pageContent = (
    <div className="min-h-screen bg-background">
      {post && (
        <SEOHead
          title={title || "News"}
          titleKo={post.title_ko || undefined}
          description={excerpt || "Read the latest from K-Worship"}
          descriptionKo={post.excerpt_ko || undefined}
          canonicalPath={`/news/${slug}`}
          type="article"
          image={post.cover_image_url || undefined}
          jsonLd={articleSchema}
        />
      )}

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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/news">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === "ko" ? "뉴스 목록" : "Back to News"}
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : post ? (
          <article className="space-y-6">
            {/* Header */}
            <header className="space-y-4">
              <div className="flex items-center gap-3">
                {category && (
                  <Badge variant="secondary" className={category.color}>
                    {language === "ko" ? category.labelKo : category.label}
                  </Badge>
                )}
                {formattedDate && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formattedDate}</span>
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                {title}
              </h1>

              {excerpt && (
                <p className="text-xl text-muted-foreground">
                  {excerpt}
                </p>
              )}

              {/* Share Buttons */}
              <div className="flex items-center gap-4 pt-2">
                <NewsShareButtons url={`/news/${slug}`} title={title || ""} />
                
                {post.external_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={post.external_url} target="_blank" rel="noopener noreferrer">
                      {language === "ko" ? "원문 보기" : "View Original"}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
            </header>

            {/* Cover Image */}
            {post.cover_image_url && (
              <div className="rounded-xl overflow-hidden">
                <img 
                  src={post.cover_image_url} 
                  alt={title || ""} 
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Content */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content || "") }}
            />
          </article>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {language === "ko" ? "게시물을 찾을 수 없습니다." : "Post not found."}
            </p>
          </div>
        )}

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-6">
              {language === "ko" ? "관련 소식" : "Related Posts"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <NewsCard key={relatedPost.id} post={relatedPost} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </main>

      {!user && <LandingFooter />}
    </div>
  );

  return user ? <AppLayout>{pageContent}</AppLayout> : pageContent;
};

export default NewsDetail;
