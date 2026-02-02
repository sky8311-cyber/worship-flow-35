import { Link } from "react-router-dom";
import { ExternalLink, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface NewsPost {
  id: string;
  title: string;
  title_ko?: string | null;
  slug: string;
  excerpt?: string | null;
  excerpt_ko?: string | null;
  category: string;
  cover_image_url?: string | null;
  external_url?: string | null;
  published_at?: string | null;
}

interface NewsCardProps {
  post: NewsPost;
  variant?: "default" | "compact";
}

const categoryConfig: Record<string, { label: string; labelKo: string; color: string }> = {
  news: { label: "News", labelKo: "뉴스", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  update: { label: "Update", labelKo: "업데이트", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  blog: { label: "Blog", labelKo: "블로그", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  press: { label: "Press", labelKo: "보도자료", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

export const NewsCard = ({ post, variant = "default" }: NewsCardProps) => {
  const { language } = useTranslation();
  
  const title = language === "ko" && post.title_ko ? post.title_ko : post.title;
  const excerpt = language === "ko" && post.excerpt_ko ? post.excerpt_ko : post.excerpt;
  const category = categoryConfig[post.category] || categoryConfig.news;
  const isExternal = !!post.external_url;
  
  const formattedDate = post.published_at 
    ? format(new Date(post.published_at), language === "ko" ? "yyyy년 M월 d일" : "MMM d, yyyy", { locale: language === "ko" ? ko : undefined })
    : null;

  const content = (
    <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 group border-border/50">
      {post.cover_image_url && variant === "default" && (
        <div className="aspect-video overflow-hidden bg-muted">
          <img 
            src={post.cover_image_url} 
            alt={title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <CardContent className={variant === "compact" ? "p-4" : "p-5"}>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className={`text-xs font-medium ${category.color}`}>
            {language === "ko" ? category.labelKo : category.label}
          </Badge>
          {isExternal && (
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        
        <h3 className={`font-semibold line-clamp-2 group-hover:text-primary transition-colors ${variant === "compact" ? "text-base" : "text-lg mb-2"}`}>
          {title}
        </h3>
        
        {excerpt && variant === "default" && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {excerpt}
          </p>
        )}
        
        {formattedDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isExternal) {
    return (
      <a 
        href={post.external_url!} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block h-full"
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={`/news/${post.slug}`} className="block h-full">
      {content}
    </Link>
  );
};
