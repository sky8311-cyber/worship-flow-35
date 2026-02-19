import { Helmet } from "react-helmet-async";
import { useTranslation } from "@/hooks/useTranslation";

interface BreadcrumbItem {
  name: string;
  nameKo?: string;
  url: string;
}

interface SEOHeadProps {
  title: string;
  titleKo?: string;
  description: string;
  descriptionKo?: string;
  keywords?: string;
  keywordsKo?: string;
  canonicalPath?: string;
  type?: "website" | "article" | "product";
  image?: string;
  noIndex?: boolean;
  jsonLd?: object | object[];
  breadcrumbs?: BreadcrumbItem[];
}

const BASE_URL = "https://kworship.app";
const DEFAULT_IMAGE = "/kworship-icon.png";

export const SEOHead = ({
  title,
  titleKo,
  description,
  descriptionKo,
  keywords,
  keywordsKo,
  canonicalPath = "",
  type = "website",
  image = DEFAULT_IMAGE,
  noIndex = false,
  jsonLd,
  breadcrumbs,
}: SEOHeadProps) => {
  const { language } = useTranslation();
  
  const localizedTitle = language === "ko" && titleKo ? titleKo : title;
  const localizedDescription = language === "ko" && descriptionKo ? descriptionKo : description;
  const localizedKeywords = language === "ko" && keywordsKo ? keywordsKo : keywords;
  
  const fullTitle = localizedTitle.includes("K-Worship") 
    ? localizedTitle 
    : `${localizedTitle} | K-Worship`;
  
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;
  const imageUrl = image.startsWith("http") ? image : `${BASE_URL}${image}`;

  // Default Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "K-Worship",
    "url": BASE_URL,
    "logo": `${BASE_URL}/kworship-icon.png`,
    "description": language === "ko" 
      ? "예배팀을 위한 통합 관리 플랫폼" 
      : "All-in-one worship team management platform",
    "sameAs": []
  };

  // Default SoftwareApplication schema
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "K-Worship",
    "applicationCategory": "ReligiousSoftware",
    "operatingSystem": "Web",
    "description": localizedDescription,
    "url": BASE_URL,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "100"
    }
  };

  // BreadcrumbList schema
  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": language === "ko" && item.nameKo ? item.nameKo : item.name,
      "item": item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`
    }))
  } : null;

  // Combine schemas
  const allSchemas: object[] = [organizationSchema, softwareSchema];
  if (breadcrumbSchema) allSchemas.push(breadcrumbSchema);
  if (jsonLd) {
    if (Array.isArray(jsonLd)) {
      allSchemas.push(...jsonLd);
    } else {
      allSchemas.push(jsonLd);
    }
  }

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <html lang={language} />
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={localizedDescription} />
      {localizedKeywords && <meta name="keywords" content={localizedKeywords} />}
      <meta name="author" content="K-Worship" />
      
      {/* Robots */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <meta name="googlebot" content={noIndex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"} />
      
      {/* Canonical & Alternates */}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="ko" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={localizedDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="K-Worship" />
      <meta property="og:locale" content={language === "ko" ? "ko_KR" : "en_US"} />
      <meta property="og:locale:alternate" content={language === "ko" ? "en_US" : "ko_KR"} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={localizedDescription} />
      <meta name="twitter:image" content={imageUrl} />
      
      {/* JSON-LD Structured Data */}
      {allSchemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};
