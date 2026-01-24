import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileSidebarCard } from "@/components/dashboard/ProfileSidebarCard";
import { CommunitiesSidebarList } from "@/components/dashboard/CommunitiesSidebarList";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { UpcomingEventsWidget } from "@/components/dashboard/UpcomingEventsWidget";
import { useUserCommunities } from "@/hooks/useUserCommunities";

const SeedLeaderboard = lazy(() => import("@/components/seeds/SeedLeaderboard").then(m => ({ default: m.SeedLeaderboard })));

interface MobileSidebarDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebarDrawer({ open, onOpenChange }: MobileSidebarDrawerProps) {
  const { user, isAdmin, isWorshipLeader, isCommunityLeaderInAnyCommunity } = useAuth();
  const { isLeaderboardEnabled, isLoading: settingsLoading } = useAppSettings();
  const { id: currentCommunityId } = useParams();
  
  const { data: communitiesData } = useUserCommunities();
  const communityIds = communitiesData?.communityIds || [];

  // Close the drawer
  const handleClose = () => {
    onOpenChange(false);
  };

  // Fetch user stats (reuses the same query key as Dashboard for caching)
  const { data: userStats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user) return { 
        sets: 0, setViews: 0, 
        communities: 0, chatMessages: 0, 
        songs: 0, songUsageCount: 0 
      };

      // 1. Created sets + total view count
      const { data: setsData } = await supabase
        .from("service_sets")
        .select("id, view_count")
        .eq("created_by", user.id);
      
      const setsCount = setsData?.length || 0;
      const setViews = setsData?.reduce((sum, s) => sum + (s.view_count || 0), 0) || 0;

      // 2. Joined communities
      const { data: communitiesData } = await supabase
        .from("community_members")
        .select("id")
        .eq("user_id", user.id);

      // 3. Chat messages (community_posts by this user)
      const { data: postsData } = await supabase
        .from("community_posts")
        .select("id")
        .eq("author_id", user.id);

      // 4. Songs contributed + usage count
      const { data: songsData } = await supabase
        .from("songs")
        .select("id")
        .eq("created_by", user.id);

      let songUsageCount = 0;
      if (songsData && songsData.length > 0) {
        const songIds = songsData.map(s => s.id);
        const { count } = await supabase
          .from("set_songs")
          .select("id", { count: "exact", head: true })
          .in("song_id", songIds);
        songUsageCount = count || 0;
      }

      return {
        sets: setsCount,
        setViews,
        communities: communitiesData?.length || 0,
        chatMessages: postsData?.length || 0,
        songs: songsData?.length || 0,
        songUsageCount
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Build joined communities from shared data
  const { data: joinedCommunities = [] } = useQuery({
    queryKey: ["joined-communities-sidebar", user?.id, communityIds],
    queryFn: async () => {
      if (!user || communityIds.length === 0) return [];

      // Batch fetch member counts
      const { data: memberCounts } = await supabase
        .from("community_members")
        .select("community_id")
        .in("community_id", communityIds);

      const countMap = (memberCounts || []).reduce((acc: Record<string, number>, curr) => {
        acc[curr.community_id] = (acc[curr.community_id] || 0) + 1;
        return acc;
      }, {});

      return (communitiesData?.communities || []).map((c) => ({
        id: c.id,
        name: c.name,
        avatar_url: c.avatar_url,
        member_count: countMap[c.id] || 0,
        user_role: communitiesData?.roleMap.get(c.id) || "member",
        leader_id: c.leader_id,
      }));
    },
    enabled: !!user && communityIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch upcoming sets
  const { data: upcomingSets = [] } = useQuery({
    queryKey: ["upcoming-sets", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const today = new Date().toISOString().split("T")[0];

      let query = supabase
        .from("service_sets")
        .select("*")
        .gte("date", today)
        .order("date", { ascending: true });

      if (!isAdmin) {
        if (isCommunityLeaderInAnyCommunity) {
          query = query.or(`status.eq.published,created_by.eq.${user.id}`);
        } else {
          query = query.eq("status", "published");
        }
      }

      const { data } = await query.limit(4);
      return data || [];
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[360px] sm:w-[380px] p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            <ProfileSidebarCard stats={userStats} onNavigate={handleClose} />
            <CommunitiesSidebarList communities={joinedCommunities} maxVisible={5} currentCommunityId={currentCommunityId} />
            <QuickActionsCard showCreateCommunity={isWorshipLeader || isAdmin} />
            <UpcomingEventsWidget 
              sets={upcomingSets} 
              maxVisible={3}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              isCommunityLeader={isCommunityLeaderInAnyCommunity}
            />
            {!settingsLoading && isLeaderboardEnabled && (
              <Suspense fallback={<Skeleton className="h-64 rounded-lg" />}>
                <SeedLeaderboard />
              </Suspense>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
