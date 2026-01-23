import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, UserPlus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { ProfileDialog } from "@/components/dashboard/ProfileDialog";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";

type TimeRange = 'monthly' | 'allTime' | 'newMembers';

// Exclude admin users from leaderboard
const EXCLUDED_USER_IDS = ['3d927691-b9a8-4fe0-a1ba-7919ed00a0ec'];

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
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;
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

  const getLeaderboardData = async (timeRange: 'monthly' | 'allTime') => {
    let dateFilter = '';
    if (timeRange === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = monthAgo.toISOString();
    }

    // 1. Fetch only user_id and seeds_earned (minimal data)
    let query = supabase
      .from('seed_transactions')
      .select('user_id, seeds_earned');

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    const { data: transactions } = await query;
    if (!transactions) return [];

    // 2. Aggregate in JS, excluding admins during aggregation
    const userTotals = transactions.reduce((acc, tx) => {
      if (!EXCLUDED_USER_IDS.includes(tx.user_id)) {
        acc[tx.user_id] = (acc[tx.user_id] || 0) + tx.seeds_earned;
      }
      return acc;
    }, {} as Record<string, number>);

    // 3. Get only top 10 user IDs (buffer for edge cases)
    const topUserIds = Object.entries(userTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    if (topUserIds.length === 0) return [];

    // 4. Fetch profiles and seed levels only for top 10 users (60+ → 10)
    const [{ data: profiles }, { data: userSeeds }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', topUserIds),
      supabase
        .from('user_seeds')
        .select('user_id, current_level')
        .in('user_id', topUserIds)
    ]);

    // 5. Return final top 5
    return topUserIds.slice(0, 5).map((userId) => {
      const profile = profiles?.find((p) => p.id === userId);
      const seedData = userSeeds?.find((s) => s.user_id === userId);
      return {
        userId,
        name: profile?.full_name || 'Unknown',
        avatarUrl: profile?.avatar_url,
        seeds: userTotals[userId],
        level: seedData?.current_level || 1
      };
    });
  };

  const getNewMembersData = async () => {
    // Fetch newest members, excluding admins
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, created_at')
      .order('created_at', { ascending: false })
      .limit(10); // Fetch a bit more to account for exclusions

    if (!profiles) return [];

    const filteredProfiles = profiles.filter(p => !EXCLUDED_USER_IDS.includes(p.id)).slice(0, 5);
    const userIds = filteredProfiles.map(p => p.id);

    // Get seed info for these users
    const { data: userSeeds } = await supabase
      .from('user_seeds')
      .select('user_id, current_level')
      .in('user_id', userIds);

    return filteredProfiles.map((profile) => {
      const seedData = userSeeds?.find((s) => s.user_id === profile.id);
      return {
        userId: profile.id,
        name: profile.full_name || 'Unknown',
        avatarUrl: profile.avatar_url,
        createdAt: profile.created_at,
        level: seedData?.current_level || 1
      };
    });
  };

  const { data: monthlyData } = useQuery({
    queryKey: ['leaderboard-monthly'],
    queryFn: () => getLeaderboardData('monthly'),
    staleTime: 5 * 60 * 1000, // 5 minutes - leaderboard doesn't need real-time updates
  });

  const { data: allTimeData } = useQuery({
    queryKey: ['leaderboard-alltime'],
    queryFn: () => getLeaderboardData('allTime'),
    staleTime: 10 * 60 * 1000, // 10 minutes - all-time data changes slowly
  });

  const { data: newMembersData } = useQuery({
    queryKey: ['leaderboard-newmembers'],
    queryFn: getNewMembersData,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  const renderLeaderboard = (data: typeof monthlyData) => {
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

  const renderNewMembers = (data: typeof newMembersData) => {
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
          const isCurrentUser = entry.userId === user?.id;

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
              }`}
            >
              <div className="w-6 flex justify-center shrink-0">
                <UserPlus className="w-4 h-4 text-green-500" />
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

              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(entry.createdAt), { 
                  addSuffix: false, 
                  locale: dateLocale 
                })}
              </span>
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
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8 mb-3">
            <TabsTrigger value="monthly" className="text-xs">{t('seeds.monthly')}</TabsTrigger>
            <TabsTrigger value="allTime" className="text-xs">{t('seeds.allTime')}</TabsTrigger>
            <TabsTrigger value="newMembers" className="text-xs">{t('seeds.newMembers')}</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-0">
            {renderLeaderboard(monthlyData)}
          </TabsContent>

          <TabsContent value="allTime" className="mt-0">
            {renderLeaderboard(allTimeData)}
          </TabsContent>

          <TabsContent value="newMembers" className="mt-0">
            {renderNewMembers(newMembersData)}
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
