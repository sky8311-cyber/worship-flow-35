import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PlazaUser {
  roomId: string;
  ownerUserId: string;
  ownerName: string | null;
  avatarUrl: string | null;
  studioName: string | null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function usePlazaUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["plaza-users", user?.id],
    queryFn: async (): Promise<PlazaUser[]> => {
      if (!user) return [];

      // Get friend IDs to exclude
      const { data: friends } = await supabase
        .from("friends")
        .select("requester_user_id, addressee_user_id")
        .eq("status", "accepted")
        .or(`requester_user_id.eq.${user.id},addressee_user_id.eq.${user.id}`);

      const friendIds = new Set(
        friends?.map(f =>
          f.requester_user_id === user.id ? f.addressee_user_id : f.requester_user_id
        ) || []
      );

      // Get public rooms with profiles, exclude self
      const { data: rooms } = await supabase
        .from("worship_rooms")
        .select("id, owner_user_id, studio_name, owner:profiles!owner_user_id(id, full_name, avatar_url, is_ambassador)")
        .eq("is_active", true)
        .eq("visibility", "public")
        .neq("owner_user_id", user.id)
        .limit(100);

      if (!rooms || rooms.length === 0) return [];

      // Filter out friends and ambassadors client-side
      const filtered = rooms.filter(r => {
        const owner = r.owner as any;
        if (!owner) return false;
        if (friendIds.has(r.owner_user_id)) return false;
        if (owner.is_ambassador) return false;
        return true;
      });

      // Shuffle and take 20
      return shuffle(filtered).slice(0, 20).map(r => {
        const owner = r.owner as any;
        return {
          roomId: r.id,
          ownerUserId: r.owner_user_id,
          ownerName: owner?.full_name || null,
          avatarUrl: owner?.avatar_url || null,
          studioName: r.studio_name || null,
        };
      });
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
