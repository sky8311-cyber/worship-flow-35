import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SongUsageItem {
  service_set_id: string;
  date: string;
  service_name: string;
  worship_leader: string | null;
  community_id: string | null;
  community_name: string | null;
  position: number;
  status: 'draft' | 'published';
  view_count: number;
  is_same_community: boolean;
  can_edit: boolean;
}

export interface SongUsageData {
  usage_count: number;
  last_used_at: string | null;
  last_used_service_name: string | null;
  usage_history: SongUsageItem[];
}

export const useSongUsage = (songId: string) => {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["song-usage", songId, user?.id],
    queryFn: async (): Promise<SongUsageData> => {
      // Get user's communities
      const { data: userCommunities } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user?.id || "");

      const userCommunityIds = new Set(userCommunities?.map(c => c.community_id) || []);

      // Fetch usage data
      const { data: usageData, error } = await supabase
        .from("set_songs")
        .select(`
          service_set_id,
          position,
          service_sets!inner(
            id,
            date,
            service_name,
            worship_leader,
            status,
            community_id,
            created_by,
            view_count,
            worship_communities(name)
          )
        `)
        .eq("song_id", songId)
        .order("service_sets(date)", { ascending: false });

      if (error) throw error;

      // Process usage data - OPTIMIZED with batch queries
      const history: SongUsageItem[] = [];
      let totalCount = 0;

      // Collect all set IDs and community IDs for batch queries
      const setIds = (usageData || []).map(item => item.service_sets?.id).filter(Boolean) as string[];
      const communityIds = [...new Set((usageData || [])
        .map(item => item.service_sets?.community_id)
        .filter(id => id && userCommunityIds.has(id))
      )] as string[];

      // Batch fetch collaborator status for all sets
      const { data: collaborators } = await supabase
        .from("set_collaborators")
        .select("service_set_id")
        .in("service_set_id", setIds)
        .eq("user_id", user?.id || "");

      const collaboratorSetIds = new Set(collaborators?.map(c => c.service_set_id) || []);

      // Batch fetch community leader status for all communities
      const { data: memberRoles } = await supabase
        .from("community_members")
        .select("community_id, role")
        .in("community_id", communityIds)
        .eq("user_id", user?.id || "");

      const leaderCommunityIds = new Set(
        memberRoles?.filter(m => m.role === "community_leader").map(m => m.community_id) || []
      );

      // Process each usage item using cached data
      for (const item of usageData || []) {
        const set = item.service_sets;
        if (!set) continue;

        const isSameCommunity = set.community_id && userCommunityIds.has(set.community_id);
        const isCreator = set.created_by === user?.id;

        // Filter logic: show all sets from same community, only published from other communities
        if (isSameCommunity || set.status === 'published') {
          // Check if user can edit using cached data
          let canEdit = false;
          if (isAdmin || isCreator) {
            canEdit = true;
          } else if (set.community_id && isSameCommunity) {
            canEdit = collaboratorSetIds.has(set.id) || leaderCommunityIds.has(set.community_id);
          }

          history.push({
            service_set_id: set.id,
            date: set.date,
            service_name: set.service_name,
            worship_leader: set.worship_leader,
            community_id: set.community_id,
            community_name: (set.worship_communities as any)?.name || null,
            position: item.position,
            status: set.status,
            view_count: set.view_count || 0,
            is_same_community: isSameCommunity,
            can_edit: canEdit,
          });
        }

        totalCount++;
      }

      // Get most recent usage
      const mostRecent = history[0];

      return {
        usage_count: totalCount,
        last_used_at: mostRecent?.date || null,
        last_used_service_name: mostRecent?.service_name || null,
        usage_history: history,
      };
    },
    enabled: !!songId && !!user,
  });
};
