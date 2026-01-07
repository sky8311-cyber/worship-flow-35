import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { useTranslation } from "@/hooks/useTranslation";
import { TierLevel, TIER_CONFIG, TierFeature } from "@/hooks/useTierFeature";
import { TierBadge } from "@/components/admin/TierBadge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  BarChart3, 
  Bot, 
  Calendar, 
  Building2, 
  Palette, 
  Shield, 
  HeadphonesIcon,
  Layers
} from "lucide-react";

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; label: string; labelKo: string }> = {
  analytics: { icon: BarChart3, label: "Analytics", labelKo: "분석" },
  ai: { icon: Bot, label: "AI Features", labelKo: "AI 기능" },
  scheduling: { icon: Calendar, label: "Scheduling", labelKo: "스케줄링" },
  management: { icon: Building2, label: "Management", labelKo: "관리" },
  branding: { icon: Palette, label: "Branding", labelKo: "브랜딩" },
  permissions: { icon: Shield, label: "Permissions", labelKo: "권한" },
  support: { icon: HeadphonesIcon, label: "Support", labelKo: "지원" },
};

const TIERS: TierLevel[] = ["member", "worship_leader", "premium", "church"];

export default function AdminFeatures() {
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data: features = [], isLoading } = useQuery({
    queryKey: ["admin-tier-features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tier_features")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as TierFeature[];
    },
  });

  const updateFeatureMutation = useMutation({
    mutationFn: async ({ 
      featureId, 
      tier, 
      enabled 
    }: { 
      featureId: string; 
      tier: TierLevel; 
      enabled: boolean;
    }) => {
      const tierColumn = `tier_${tier}` as keyof Pick<TierFeature, 'tier_member' | 'tier_worship_leader' | 'tier_premium' | 'tier_church'>;
      
      const { error } = await supabase
        .from("tier_features")
        .update({ [tierColumn]: enabled })
        .eq("id", featureId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tier-features"] });
      queryClient.invalidateQueries({ queryKey: ["tier-features"] });
      toast.success(language === "ko" ? "기능이 업데이트되었습니다" : "Feature updated");
    },
    onError: (error) => {
      console.error("Error updating feature:", error);
      toast.error(language === "ko" ? "업데이트 실패" : "Update failed");
    },
  });

  const toggleFeatureActive = useMutation({
    mutationFn: async ({ featureId, isActive }: { featureId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("tier_features")
        .update({ is_active: isActive })
        .eq("id", featureId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tier-features"] });
      queryClient.invalidateQueries({ queryKey: ["tier-features"] });
      toast.success(language === "ko" ? "기능 상태가 변경되었습니다" : "Feature status updated");
    },
  });

  const categories = ["all", ...Object.keys(CATEGORY_CONFIG)];
  
  const filteredFeatures = activeCategory === "all" 
    ? features 
    : features.filter(f => f.category === activeCategory);

  const getTierValue = (feature: TierFeature, tier: TierLevel): boolean => {
    switch (tier) {
      case "member": return feature.tier_member;
      case "worship_leader": return feature.tier_worship_leader;
      case "premium": return feature.tier_premium;
      case "church": return feature.tier_church;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Layers className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">
              {language === "ko" ? "티어별 기능 관리" : "Tier Feature Management"}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {language === "ko" 
              ? "각 티어에서 사용할 수 있는 기능을 관리합니다"
              : "Manage which features are available for each subscription tier"}
          </p>
        </div>

        {/* Tier Legend */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === "ko" ? "티어 범례" : "Tier Legend"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {TIERS.map((tier) => (
                <div key={tier} className="flex items-center gap-2">
                  <TierBadge tier={tier} size="md" />
                  <span className="text-xs text-muted-foreground">
                    {language === "ko" ? TIER_CONFIG[tier].labelKo : TIER_CONFIG[tier].label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="text-xs">
              {language === "ko" ? "전체" : "All"}
            </TabsTrigger>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger key={key} value={key} className="text-xs gap-1">
                  <Icon className="w-3 h-3" />
                  {language === "ko" ? config.labelKo : config.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFeatures.map((feature) => {
                  const categoryConfig = CATEGORY_CONFIG[feature.category];
                  const CategoryIcon = categoryConfig?.icon || Layers;
                  
                  return (
                    <Card key={feature.id} className={!feature.is_active ? "opacity-50" : ""}>
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Feature Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                              <h3 className="font-medium truncate">
                                {language === "ko" && feature.feature_name_ko 
                                  ? feature.feature_name_ko 
                                  : feature.feature_name}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {feature.feature_key}
                              </Badge>
                              {!feature.is_active && (
                                <Badge variant="secondary" className="text-xs">
                                  {language === "ko" ? "비활성" : "Inactive"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {language === "ko" && feature.description_ko 
                                ? feature.description_ko 
                                : feature.description}
                            </p>
                          </div>

                          {/* Tier Toggles */}
                          <div className="flex items-center gap-4 lg:gap-6">
                            {TIERS.map((tier) => (
                              <div key={tier} className="flex flex-col items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {language === "ko" ? TIER_CONFIG[tier].labelKo : TIER_CONFIG[tier].label}
                                </span>
                                <Switch
                                  checked={getTierValue(feature, tier)}
                                  onCheckedChange={(checked) =>
                                    updateFeatureMutation.mutate({
                                      featureId: feature.id,
                                      tier,
                                      enabled: checked,
                                    })
                                  }
                                  disabled={updateFeatureMutation.isPending}
                                />
                              </div>
                            ))}
                            
                            {/* Active Toggle */}
                            <div className="flex flex-col items-center gap-1 border-l pl-4">
                              <span className="text-xs text-muted-foreground">
                                {language === "ko" ? "활성" : "Active"}
                              </span>
                              <Switch
                                checked={feature.is_active}
                                onCheckedChange={(checked) =>
                                  toggleFeatureActive.mutate({
                                    featureId: feature.id,
                                    isActive: checked,
                                  })
                                }
                                disabled={toggleFeatureActive.isPending}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {filteredFeatures.length === 0 && (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      {language === "ko" 
                        ? "이 카테고리에 기능이 없습니다"
                        : "No features in this category"}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Stats Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">
              {language === "ko" ? "기능 통계" : "Feature Statistics"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TIERS.map((tier) => {
                const count = features.filter(f => getTierValue(f, tier) && f.is_active).length;
                return (
                  <div key={tier} className="text-center p-3 rounded-lg bg-muted/30">
                    <TierBadge tier={tier} size="sm" className="mb-2" />
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground">
                      {language === "ko" ? "기능" : "features"}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
