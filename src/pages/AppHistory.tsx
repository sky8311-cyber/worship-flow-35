import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { Rocket, Sparkles, Flag, ArrowUpCircle, Wrench, Home } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, revealViewportOptions } from "@/lib/animations";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const AppHistory = () => {
  const { language } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"highlights" | "all">("highlights");

  // Query for highlights (visible only)
  const { data: highlightMilestones, isLoading: isLoadingHighlights } = useQuery({
    queryKey: ["public-milestones", "highlights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_milestones")
        .select("*")
        .eq("is_visible", true)
        .order("event_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Query for all updates (including bugfix, ignoring is_visible)
  const { data: allMilestones, isLoading: isLoadingAll } = useQuery({
    queryKey: ["public-milestones", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_milestones")
        .select("*")
        .order("event_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "launch":
        return <Rocket className="h-5 w-5" />;
      case "feature":
        return <Sparkles className="h-5 w-5" />;
      case "milestone":
        return <Flag className="h-5 w-5" />;
      case "update":
        return <ArrowUpCircle className="h-5 w-5" />;
      case "bugfix":
        return <Wrench className="h-5 w-5" />;
      default:
        return <Flag className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "launch":
        return "bg-primary text-primary-foreground";
      case "feature":
        return "bg-accent text-accent-foreground";
      case "milestone":
        return "bg-primary/80 text-primary-foreground";
      case "update":
        return "bg-muted-foreground text-background";
      case "bugfix":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { ko: string; en: string }> = {
      launch: { ko: "출시", en: "Launch" },
      feature: { ko: "기능", en: "Feature" },
      milestone: { ko: "마일스톤", en: "Milestone" },
      update: { ko: "업데이트", en: "Update" },
      bugfix: { ko: "버그수정", en: "Bug Fix" },
    };
    return labels[category]?.[language] || category;
  };

  const renderTimeline = (milestones: typeof highlightMilestones, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="space-y-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!milestones || milestones.length === 0) {
      return (
        <motion.div 
          className="text-center py-12 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {language === "ko" ? "아직 등록된 히스토리가 없습니다." : "No history entries yet."}
        </motion.div>
      );
    }

    return (
      <div className="relative">
        {/* Timeline line */}
        <motion.div 
          className="absolute left-5 top-0 bottom-0 w-0.5 bg-border origin-top"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        <motion.div 
          className="space-y-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {milestones.map((milestone, index) => (
            <motion.div 
              key={milestone.id} 
              className="relative flex gap-4"
              variants={staggerItem}
              viewport={revealViewportOptions}
              whileInView="visible"
              initial="hidden"
            >
              {/* Icon circle */}
              <motion.div 
                className={`relative z-10 flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${getCategoryColor(milestone.category)}`}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 20,
                  delay: index * 0.1 
                }}
              >
                {getCategoryIcon(milestone.category)}
              </motion.div>

              {/* Content */}
              <motion.div 
                className="flex-1 pb-8"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1 + 0.1 
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(milestone.event_date), "yyyy.MM.dd")}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(milestone.category)}`}>
                    {getCategoryLabel(milestone.category)}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  {language === "ko" ? milestone.title_ko : milestone.title_en}
                </h3>
                {(language === "ko" ? milestone.description_ko : milestone.description_en) && (
                  <p className="text-muted-foreground">
                    {language === "ko" ? milestone.description_ko : milestone.description_en}
                  </p>
                )}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  };

  const timelineContent = (
    <>
      {/* Header */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {language === "ko" ? "K-Worship 히스토리" : "K-Worship History"}
        </h1>
        <p className="text-muted-foreground text-lg">
          {language === "ko" ? "우리의 여정" : "Our Journey"}
        </p>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "highlights" | "all")} className="mb-8">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="highlights">
            {language === "ko" ? "주요 기능" : "Highlights"}
          </TabsTrigger>
          <TabsTrigger value="all">
            {language === "ko" ? "전체 기록" : "All Updates"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="highlights" className="mt-8">
          {renderTimeline(highlightMilestones, isLoadingHighlights)}
        </TabsContent>

        <TabsContent value="all" className="mt-8">
          {renderTimeline(allMilestones, isLoadingAll)}
        </TabsContent>
      </Tabs>
    </>
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
          <BreadcrumbLink asChild>
            <Link to="/kworship-info">
              {language === "ko" ? "K-Worship 정보" : "About K-Worship"}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            {language === "ko" ? "앱 히스토리" : "App History"}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  // For authenticated users, use AppLayout
  if (user) {
    return (
      <AppLayout breadcrumb={breadcrumb}>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {timelineContent}
        </div>
      </AppLayout>
    );
  }

  // For public users, use minimal header + footer like Legal page
  return (
    <div className="min-h-screen bg-background relative z-10">
      {/* Header */}
      <PublicPageHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {timelineContent}
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default AppHistory;
