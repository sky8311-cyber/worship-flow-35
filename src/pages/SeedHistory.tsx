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
    <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Sprout className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t('seeds.history')}</h1>
          <p className="text-muted-foreground">{t('seeds.title')} {t('common.and')} {t('seeds.achievements')}</p>
        </div>
      </div>

      {/* Current Level Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-5xl">{seedData.levelInfo?.emoji}</span>
              <div>
                <CardTitle className="text-2xl">
                  {language === 'ko' ? seedData.levelInfo?.name_ko : seedData.levelInfo?.name_en}
                </CardTitle>
                <CardDescription className="text-lg">
                  {t('seeds.totalSeeds')}: {seedData.totalSeeds}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Lv. {seedData.currentLevel}
            </Badge>
          </div>
        </CardHeader>
        {seedData.nextLevel && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('seeds.nextLevel')}</span>
                <span className="font-medium">
                  {seedData.nextLevel.min_seeds - seedData.totalSeeds} {t('seeds.seedsToNextLevel')}
                </span>
              </div>
              <Progress value={seedData.progress} className="h-3" />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t('seeds.history')}
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="w-4 h-4 mr-2" />
            {t('seeds.achievements')}
          </TabsTrigger>
          <TabsTrigger value="daily">
            <Calendar className="w-4 h-4 mr-2" />
            {t('seeds.dailyProgress')}
          </TabsTrigger>
        </TabsList>

        {/* Transaction History */}
        <TabsContent value="history" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>{t('seeds.history')}</CardTitle>
              <CardDescription>최근 씨앗 획득 내역</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {transactions && transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div className="flex-1">
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(tx.created_at), {
                          addSuffix: true,
                          locale: language === 'ko' ? ko : undefined
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-3">
                      +{tx.seeds_earned} 🌱
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  아직 활동 내역이 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>{t('seeds.achievements')}</CardTitle>
              <CardDescription>일회성 업적</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
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
                        <p className="font-medium">
                          {t(`seeds.activities.${achievement.nameKey}` as any)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          +{achievement.seeds} 🌱
                        </p>
                      </div>
                      {earned && <Trophy className="w-5 h-5 text-primary" />}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Progress */}
        <TabsContent value="daily" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>{t('seeds.dailyProgress')}</CardTitle>
              <CardDescription>오늘의 활동 현황</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dailyActivities.map((activity) => {
                const capData = dailyCaps?.find((c) => c.activity_type === activity.type);
                const count = capData?.count || 0;
                const remaining = activity.cap - count;

                return (
                  <div key={activity.type} className="p-3 rounded-lg bg-muted/30 border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">
                        {t(`seeds.activities.${activity.nameKey}` as any)}
                      </p>
                      <Badge variant={remaining > 0 ? 'default' : 'secondary'}>
                        {count}/{activity.cap}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>+{activity.seeds} 🌱 per activity</span>
                      <span>
                        {remaining > 0
                          ? `${remaining} ${t('seeds.remainingToday')}`
                          : '일일 한도 도달'}
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
  );
}
