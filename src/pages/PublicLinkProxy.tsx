import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { FullScreenLoader } from "@/components/layout/FullScreenLoader";
import { format } from "date-fns";

const PublicLinkProxy = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // Fetch set data for OG tags
  const { data: setData, isLoading, error } = useQuery({
    queryKey: ["public-set-og", token],
    queryFn: async () => {
      if (!token) return null;
      
      const { data, error } = await supabase
        .from("service_sets")
        .select("service_name, date, worship_leader, theme")
        .eq("public_share_token", token)
        .eq("public_share_enabled", true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!token,
    staleTime: 60000,
  });

  // Redirect to public-view after component mounts (allows OG tags to be set first)
  useEffect(() => {
    if (token && !isLoading) {
      // Small delay to allow crawlers to read OG tags
      const timer = setTimeout(() => {
        navigate(`/public-view/${token}`, { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [token, isLoading, navigate]);

  // Handle invalid token
  useEffect(() => {
    if (error || (!isLoading && !setData && token)) {
      navigate("/", { replace: true });
    }
  }, [error, isLoading, setData, token, navigate]);

  const title = setData 
    ? `${setData.service_name} - ${format(new Date(setData.date), "yyyy.MM.dd")}`
    : "예배세트 | KWorship";
  
  const description = setData
    ? `${setData.worship_leader ? `인도: ${setData.worship_leader}` : ""}${setData.theme ? ` | 주제: ${setData.theme}` : ""}`
    : "KWorship에서 공유된 예배세트입니다.";

  const ogImageUrl = "https://kworship.app/images/og-worship-set.png";
  const canonicalUrl = `https://kworship.app/link/${token}`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="KWorship" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageUrl} />
        
        {/* Kakao */}
        <meta property="og:locale" content="ko_KR" />
        
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <FullScreenLoader />
    </>
  );
};

export default PublicLinkProxy;
