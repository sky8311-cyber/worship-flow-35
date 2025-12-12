import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Community {
  id: string;
  name: string;
  avatar_url: string | null;
  leader_id: string;
}

interface CommunityMembership {
  community_id: string;
  role: string | null;
  worship_communities: Community | null;
}

export function useUserCommunities() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-communities-unified", user?.id],
    queryFn: async () => {
      if (!user) return {
        communityIds: [] as string[],
        communities: [] as Community[],
        memberships: [] as CommunityMembership[],
        roleMap: new Map<string, string>(),
      };

      const { data, error } = await supabase
        .from("community_members")
        .select("community_id, role, worship_communities(id, name, avatar_url, leader_id)")
        .eq("user_id", user.id);

      if (error) throw error;

      const memberships = data || [];
      const communityIds = memberships.map((m) => m.community_id);
      const communities = memberships
        .map((m) => m.worship_communities)
        .filter(Boolean) as Community[];
      const roleMap = new Map(
        memberships.map((m) => [m.community_id, m.role || "member"])
      );

      return {
        communityIds,
        communities,
        memberships,
        roleMap,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
