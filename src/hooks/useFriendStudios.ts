import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FriendStudio {
  id: string;
  owner_user_id: string;
  visibility: "private" | "friends" | "public";
  theme_config: unknown;
  bgm_song_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_ambassador: boolean | null;
  };
  bgm_song?: {
    id: string;
    title: string;
    artist: string | null;
    youtube_url: string | null;
  } | null;
  latestPostAt?: string | null;
  hasNewPosts?: boolean;
}

export function useFriendStudios() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["friend-studios", user?.id],
    queryFn: async (): Promise<FriendStudio[]> => {
      if (!user) return [];
      
      // Get accepted friends
      const { data: friends } = await supabase
        .from("friends")
        .select("requester_user_id, addressee_user_id")
        .eq("status", "accepted")
        .or(`requester_user_id.eq.${user.id},addressee_user_id.eq.${user.id}`);
      
      const friendIds = friends?.map(f =>
        f.requester_user_id === user.id ? f.addressee_user_id : f.requester_user_id
      ) || [];
      
      if (friendIds.length === 0) return [];
      
      // Get friend rooms with owner info
      const { data: rooms, error } = await supabase
        .from("worship_rooms")
        .select(`
          *,
          owner:profiles!owner_user_id(id, full_name, avatar_url, is_ambassador),
          bgm_song:songs!bgm_song_id(id, title, artist, youtube_url)
        `)
        .in("owner_user_id", friendIds)
        .eq("is_active", true);
      
      if (error) throw error;
      if (!rooms) return [];
      
      // Get latest post time for each room
      const roomIds = rooms.map(r => r.id);
      if (roomIds.length === 0) return rooms as unknown as FriendStudio[];
      
      const { data: latestPosts } = await supabase
        .from("room_posts")
        .select("room_id, created_at")
        .in("room_id", roomIds)
        .order("created_at", { ascending: false });
      
      // Create map of room -> latest post time
      const latestPostMap = new Map<string, string>();
      latestPosts?.forEach(post => {
        if (!latestPostMap.has(post.room_id)) {
          latestPostMap.set(post.room_id, post.created_at);
        }
      });
      
      // Add latest post info to rooms
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      
      const enrichedRooms = rooms.map(room => ({
        ...room,
        latestPostAt: latestPostMap.get(room.id) || null,
        hasNewPosts: latestPostMap.has(room.id) && 
          new Date(latestPostMap.get(room.id)!) > twoDaysAgo,
      })) as unknown as FriendStudio[];
      
      // Sort by latest post time
      return enrichedRooms.sort((a, b) => {
        if (!a.latestPostAt && !b.latestPostAt) return 0;
        if (!a.latestPostAt) return 1;
        if (!b.latestPostAt) return -1;
        return new Date(b.latestPostAt).getTime() - new Date(a.latestPostAt).getTime();
      });
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
