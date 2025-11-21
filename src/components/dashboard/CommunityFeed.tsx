import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CommunityFeedCard } from "./CommunityFeedCard";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function CommunityFeed() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: feedItems, isLoading } = useQuery({
    queryKey: ["community-feed", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's communities
      const { data: memberData } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);

      const communityIds = memberData?.map((m) => m.community_id) || [];

      if (communityIds.length === 0) return [];

      // Get recent sets from communities (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentSets } = await supabase
        .from("service_sets")
        .select(`
          *,
          worship_communities!inner(id, name, avatar_url)
        `)
        .in("community_id", communityIds)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(20);

      if (!recentSets) return [];

      // Get song counts for each set
      const setsWithCounts = await Promise.all(
        recentSets.map(async (set) => {
          const { count } = await supabase
            .from("set_songs")
            .select("*", { count: "exact", head: true })
            .eq("service_set_id", set.id);

          return {
            id: set.id,
            type: "worship_set" as const,
            community: set.worship_communities,
            set: {
              ...set,
              song_count: count || 0,
            },
            created_at: set.created_at,
          };
        })
      );

      return setsWithCounts;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!feedItems || feedItems.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">{t("dashboard.noActivity")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {feedItems.map((item) => (
        <CommunityFeedCard key={item.id} item={item} />
      ))}
    </div>
  );
}
