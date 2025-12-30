import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { ProfileDialog } from "@/components/dashboard/ProfileDialog";

type TimeRange = 'weekly' | 'monthly' | 'allTime';

interface SelectedProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  ministry_role: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  location: string | null;
  instrument: string | null;
}

export const SeedLeaderboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedProfile, setSelectedProfile] = useState<SelectedProfile | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const [profileStats, setProfileStats] = useState<{ sets: number; communities: number; songs: number } | undefined>();

  const handleAvatarClick = async (userId: string) => {
    // Fetch profile and stats in parallel
    const [profileRes, setsRes, communitiesRes, songsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, bio, ministry_role, instagram_url, youtube_url, location, instrument')
        .eq('id', userId)
        .single(),
      supabase
        .from('service_sets')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId),
      supabase
        .from('community_members')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('songs')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId)
    ]);
    
    if (profileRes.data) {
      setSelectedProfile(profileRes.data);
      setProfileStats({
        sets: setsRes.count || 0,
        communities: communitiesRes.count || 0,
        songs: songsRes.count || 0
      });
      setProfileDialogOpen(true);
    }
  };

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
      .slice(0, 3);

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
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="text-xs text-muted-foreground font-medium">#{rank}</span>;
    }
  };

  const renderLeaderboard = (data: typeof weeklyData) => {
    if (!data || data.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-6 text-sm">
          {t('seeds.noData')}
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {data.map((entry, index) => {
          const rank = index + 1;
          const isCurrentUser = entry.userId === user?.id;

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
              }`}
            >
              <div className="w-6 flex justify-center shrink-0">
                {getRankIcon(rank)}
              </div>

              <Avatar 
                className="w-8 h-8 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                onClick={() => handleAvatarClick(entry.userId)}
              >
                <AvatarImage src={entry.avatarUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {entry.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{entry.name}</p>
                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {t('seeds.me')}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Lv.{entry.level}</p>
              </div>

              <Badge variant="outline" className="text-xs shrink-0">
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
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          {t('seeds.leaderboard')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8 mb-3">
            <TabsTrigger value="weekly" className="text-xs">{t('seeds.weekly')}</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">{t('seeds.monthly')}</TabsTrigger>
            <TabsTrigger value="allTime" className="text-xs">{t('seeds.allTime')}</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="mt-0">
            {renderLeaderboard(weeklyData)}
          </TabsContent>

          <TabsContent value="monthly" className="mt-0">
            {renderLeaderboard(monthlyData)}
          </TabsContent>

          <TabsContent value="allTime" className="mt-0">
            {renderLeaderboard(allTimeData)}
          </TabsContent>
        </Tabs>
      </CardContent>

      <ProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        profileOverride={selectedProfile || undefined}
        stats={profileStats}
      />
    </Card>
  );
};
