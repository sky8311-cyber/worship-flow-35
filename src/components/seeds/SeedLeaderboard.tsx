import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AvatarWithLevel } from "./AvatarWithLevel";
import { Trophy, Medal, Award } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

type TimeRange = 'weekly' | 'monthly' | 'allTime';

export const SeedLeaderboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const getLeaderboardData = async (timeRange: TimeRange) => {
    let dateFilter = '';
    if (timeRange === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = weekAgo.toISOString();
    } else if (timeRange === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = monthAgo.toISOString();
    }

    let query = supabase
      .from('seed_transactions')
      .select('user_id, seeds_earned');

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    const { data: transactions } = await query;

    if (!transactions) return [];

    // Aggregate by user
    const userTotals = transactions.reduce((acc, tx) => {
      acc[tx.user_id] = (acc[tx.user_id] || 0) + tx.seeds_earned;
      return acc;
    }, {} as Record<string, number>);

    // Get user profiles and seed info
    const userIds = Object.keys(userTotals);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    const { data: userSeeds } = await supabase
      .from('user_seeds')
      .select('user_id, current_level')
      .in('user_id', userIds);

    const leaderboard = userIds
      .map((userId) => {
        const profile = profiles?.find((p) => p.id === userId);
        const seedData = userSeeds?.find((s) => s.user_id === userId);
        return {
          userId,
          name: profile?.full_name || 'Unknown',
          avatarUrl: profile?.avatar_url,
          seeds: userTotals[userId],
          level: seedData?.current_level || 1
        };
      })
      .sort((a, b) => b.seeds - a.seeds)
      .slice(0, 10);

    return leaderboard;
  };

  const { data: weeklyData } = useQuery({
    queryKey: ['leaderboard-weekly'],
    queryFn: () => getLeaderboardData('weekly')
  });

  const { data: monthlyData } = useQuery({
    queryKey: ['leaderboard-monthly'],
    queryFn: () => getLeaderboardData('monthly')
  });

  const { data: allTimeData } = useQuery({
    queryKey: ['leaderboard-alltime'],
    queryFn: () => getLeaderboardData('allTime')
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-3.5 h-3.5 text-yellow-500" />;
      case 2:
        return <Medal className="w-3.5 h-3.5 text-gray-400" />;
      case 3:
        return <Award className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <span className="text-[10px] text-muted-foreground font-medium">#{rank}</span>;
    }
  };

  const renderLeaderboard = (data: typeof weeklyData) => {
    if (!data || data.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-4 text-xs">
          {t('seeds.noData')}
        </p>
      );
    }

    return (
      <div className="space-y-1.5">
        {data.map((entry, index) => {
          const rank = index + 1;
          const isCurrentUser = entry.userId === user?.id;

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-2 p-2 rounded-md border ${
                isCurrentUser ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-transparent'
              }`}
            >
              <div className="w-5 flex justify-center shrink-0">
                {getRankIcon(rank)}
              </div>

              <AvatarWithLevel
                userId={entry.userId}
                avatarUrl={entry.avatarUrl}
                fallback={entry.name.substring(0, 2).toUpperCase()}
                size="sm"
                showLevel={false}
              />

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate leading-tight">
                  {entry.name}
                  {isCurrentUser && (
                    <Badge variant="secondary" className="ml-1 text-[9px] px-1 py-0 h-3.5">
                      {t('seeds.me')}
                    </Badge>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Lv.{entry.level}
                </p>
              </div>

              <Badge variant="default" className="ml-auto text-[10px] px-1.5 py-0 h-4 shrink-0">
                {entry.seeds} 🌱
              </Badge>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-medium flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-yellow-500" />
          {t('seeds.leaderboard')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-7 mb-2">
            <TabsTrigger value="weekly" className="text-[10px] px-1">{t('seeds.weekly')}</TabsTrigger>
            <TabsTrigger value="monthly" className="text-[10px] px-1">{t('seeds.monthly')}</TabsTrigger>
            <TabsTrigger value="allTime" className="text-[10px] px-1">{t('seeds.allTime')}</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="mt-2">
            {renderLeaderboard(weeklyData)}
          </TabsContent>

          <TabsContent value="monthly" className="mt-2">
            {renderLeaderboard(monthlyData)}
          </TabsContent>

          <TabsContent value="allTime" className="mt-2">
            {renderLeaderboard(allTimeData)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
