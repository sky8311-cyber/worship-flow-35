import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sprout, TrendingUp, Trophy, Calendar } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";

export default function SeedHistory() {
  const { user } = useAuth();
  const { t, language } = useTranslation();

  const { data: seedData } = useQuery({
    queryKey: ['user-seeds-full', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: userSeed } = await supabase
        .from('user_seeds')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!userSeed) {
        await supabase.from('user_seeds').insert({ user_id: user.id });
        return {
          totalSeeds: 0,
          currentLevel: 1,
          levelInfo: null,
          nextLevel: null,
          progress: 0
        };
      }

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
        currentLevel: userSeed.current_level,
        levelInfo: currentLevel,
        nextLevel,
        progress: Math.min(progress, 100)
      };
    },
    enabled: !!user?.id
  });

  const { data: transactions } = useQuery({
    queryKey: ['seed-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from('seed_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      return data || [];
    },
    enabled: !!user?.id
  });

  const { data: achievements } = useQuery({
    queryKey: ['seed-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from('seed_achievements')
        .select('*')
        .eq('user_id', user.id);

      return data || [];
    },
    enabled: !!user?.id
  });

  const { data: dailyCaps } = useQuery({
    queryKey: ['seed-daily-caps', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('seed_daily_caps')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_date', today);

      return data || [];
    },
    enabled: !!user?.id
  });

  const oneTimeAchievements = [
    { type: 'profile_setup', seeds: 50, nameKey: 'profileSetup' },
    { type: 'avatar_upload', seeds: 30, nameKey: 'avatarUpload' },
    { type: 'first_song_added', seeds: 30, nameKey: 'firstSongAdded' },
    { type: 'first_set_created', seeds: 30, nameKey: 'firstSetCreated' },
    { type: 'first_set_published', seeds: 40, nameKey: 'firstSetPublished' },
    { type: 'first_team_invite', seeds: 40, nameKey: 'firstTeamInvite' },
    { type: 'first_community_post', seeds: 20, nameKey: 'firstCommunityPost' }
  ];

  const dailyActivities = [
    { type: 'song_added', seeds: 10, cap: 5, nameKey: 'songAdded' },
    { type: 'song_edited', seeds: 3, cap: 10, nameKey: 'songEdited' },
    { type: 'worship_set_created', seeds: 15, cap: 3, nameKey: 'worshipSetCreated' },
    { type: 'worship_set_published', seeds: 10, cap: 3, nameKey: 'worshipSetPublished' },
    { type: 'community_post', seeds: 5, cap: 3, nameKey: 'communityPost' },
    { type: 'score_uploaded', seeds: 8, cap: 10, nameKey: 'scoreUploaded' },
    { type: 'lyrics_added', seeds: 5, cap: 10, nameKey: 'lyricsAdded' }
  ];

  if (!seedData) return null;

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Sprout className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t('seeds.history')}</h1>
            <p className="text-sm text-muted-foreground">{t('seeds.historySubtitle')}</p>
          </div>
        </div>

        {/* Current Level Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{seedData.levelInfo?.emoji}</span>
                <div>
                  <CardTitle className="text-xl">
                    {language === 'ko' ? seedData.levelInfo?.name_ko : seedData.levelInfo?.name_en}
                  </CardTitle>
                  <CardDescription>
                    {t('seeds.totalSeeds')}: {seedData.totalSeeds} K-Seeds
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-base px-3 py-1">
                Lv. {seedData.currentLevel}
              </Badge>
            </div>
          </CardHeader>
          {seedData.nextLevel && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('seeds.nextLevel')}</span>
                  <span className="font-medium">
                    {seedData.nextLevel.min_seeds - seedData.totalSeeds} {t('seeds.seedsToNextLevel')}
                  </span>
                </div>
                <Progress value={seedData.progress} className="h-2" />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history" className="text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('seeds.history')}</span>
              <span className="sm:hidden">{language === 'ko' ? '내역' : 'History'}</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs sm:text-sm">
              <Trophy className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('seeds.achievements')}</span>
              <span className="sm:hidden">{language === 'ko' ? '업적' : 'Badge'}</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="text-xs sm:text-sm">
              <Calendar className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('seeds.dailyProgress')}</span>
              <span className="sm:hidden">{language === 'ko' ? '오늘' : 'Today'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Transaction History */}
          <TabsContent value="history" className="space-y-3 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('seeds.history')}</CardTitle>
                <CardDescription>{t('seeds.recentHistory')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {transactions && transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(tx.created_at), {
                            addSuffix: true,
                            locale: language === 'ko' ? ko : undefined
                          })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-3 text-xs">
                        +{tx.seeds_earned} 🌱
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    {t('seeds.noActivityYet')}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements */}
          <TabsContent value="achievements" className="space-y-3 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('seeds.achievements')}</CardTitle>
                <CardDescription>{t('seeds.oneTimeAchievements')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 md:grid-cols-2">
                {oneTimeAchievements.map((achievement) => {
                  const earned = achievements?.some((a) => a.achievement_type === achievement.type);
                  return (
                    <div
                      key={achievement.type}
                      className={`p-3 rounded-lg border ${
                        earned ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {t(`seeds.activities.${achievement.nameKey}` as any)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            +{achievement.seeds} 🌱
                          </p>
                        </div>
                        {earned && <Trophy className="w-4 h-4 text-primary" />}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Progress */}
          <TabsContent value="daily" className="space-y-3 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('seeds.dailyProgress')}</CardTitle>
                <CardDescription>{t('seeds.todayProgress')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dailyActivities.map((activity) => {
                  const capData = dailyCaps?.find((c) => c.activity_type === activity.type);
                  const count = capData?.count || 0;
                  const remaining = activity.cap - count;

                  return (
                    <div key={activity.type} className="p-3 rounded-lg bg-muted/30 border">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">
                          {t(`seeds.activities.${activity.nameKey}` as any)}
                        </p>
                        <Badge variant={remaining > 0 ? 'default' : 'secondary'} className="text-xs">
                          {count}/{activity.cap}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>+{activity.seeds} 🌱 {t('seeds.perActivity')}</span>
                        <span>
                          {remaining > 0
                            ? `${remaining} ${t('seeds.remainingToday')}`
                            : t('seeds.dailyLimitReached')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
