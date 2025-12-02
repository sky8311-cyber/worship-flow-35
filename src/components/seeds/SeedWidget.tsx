import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

export const SeedWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: seedData } = useQuery({
    queryKey: ['user-seeds-widget', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: userSeed } = await supabase
        .from('user_seeds')
        .select('total_seeds, current_level')
        .eq('user_id', user.id)
        .single();

      if (!userSeed) return null;

      const { data: currentLevel } = await supabase
        .from('seed_levels')
        .select('*')
        .eq('level', userSeed.current_level)
        .single();

      const { data: nextLevel } = await supabase
        .from('seed_levels')
        .select('*')
        .eq('level', userSeed.current_level + 1)
        .single();

      const progress = nextLevel
        ? ((userSeed.total_seeds - currentLevel!.min_seeds) / (nextLevel.min_seeds - currentLevel!.min_seeds)) * 100
        : 100;

      return {
        totalSeeds: userSeed.total_seeds,
        currentLevel: currentLevel!,
        nextLevel,
        progress: Math.min(progress, 100)
      };
    },
    enabled: !!user?.id
  });

  if (!seedData) return null;

  return (
    <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{seedData.currentLevel.emoji}</span>
          <div>
            <p className="text-sm font-medium">
              {t('seeds.currentLevel')}: {seedData.currentLevel.name_ko}
            </p>
            <p className="text-xs text-muted-foreground">
              {seedData.totalSeeds} {t('seeds.title')}
            </p>
          </div>
        </div>
      </div>

      {seedData.nextLevel && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('seeds.nextLevel')}</span>
            <span>
              {seedData.nextLevel.min_seeds - seedData.totalSeeds} {t('seeds.seedsToNextLevel')}
            </span>
          </div>
          <Progress value={seedData.progress} className="h-2" />
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => navigate('/seeds')}
      >
        <Sprout className="w-4 h-4 mr-2" />
        {t('seeds.history')}
      </Button>
    </div>
  );
};
