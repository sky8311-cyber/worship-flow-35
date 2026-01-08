import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { Rocket, Sparkles, Flag, ArrowUpCircle } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, revealViewportOptions } from "@/lib/animations";

const AppHistory = () => {
  const { language } = useTranslation();

  const { data: milestones, isLoading } = useQuery({
    queryKey: ["public-milestones"],
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
      default:
        return <Flag className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "launch":
        return "bg-green-500 text-white";
      case "feature":
        return "bg-blue-500 text-white";
      case "milestone":
        return "bg-purple-500 text-white";
      case "update":
        return "bg-orange-500 text-white";
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
    };
    return labels[category]?.[language] || category;
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
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

        {/* Timeline */}
        {isLoading ? (
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
        ) : milestones && milestones.length > 0 ? (
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
        ) : (
          <motion.div 
            className="text-center py-12 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {language === "ko" ? "아직 등록된 히스토리가 없습니다." : "No history entries yet."}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default AppHistory;
