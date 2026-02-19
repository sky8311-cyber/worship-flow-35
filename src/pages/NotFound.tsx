import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { SEOHead } from "@/components/seo/SEOHead";
import { Home, HelpCircle, Newspaper } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { language } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const isKo = language === "ko";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <SEOHead
        title="Page Not Found"
        titleKo="페이지를 찾을 수 없습니다"
        description="The page you are looking for does not exist."
        descriptionKo="요청하신 페이지를 찾을 수 없습니다."
        noIndex={true}
      />
      <div className="text-center px-4">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-2 text-xl font-semibold">
          {isKo ? "페이지를 찾을 수 없습니다" : "Page Not Found"}
        </p>
        <p className="mb-8 text-muted-foreground">
          {isKo 
            ? "요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다." 
            : "The page you're looking for doesn't exist or may have been moved."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            {isKo ? "홈으로 돌아가기" : "Go Home"}
          </Link>
          <Link
            to="/help"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-accent transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            {isKo ? "도움말" : "Help Center"}
          </Link>
          <Link
            to="/news"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-accent transition-colors"
          >
            <Newspaper className="h-4 w-4" />
            {isKo ? "뉴스" : "News"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
