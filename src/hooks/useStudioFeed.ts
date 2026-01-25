import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UseStudioFeedOptions {
  filter?: string; // category key or 'all'
  includePublic?: boolean;
  limit?: number;
}

export function useStudioFeed(options: UseStudioFeedOptions = {}) {
  const { user } = useAuth();
  const { filter = "all", includePublic = true, limit = 50 } = options;
  
  return useQuery({
    queryKey: ["studio-feed", user?.id, filter, includePublic, limit],
    queryFn: async () => {
      if (!user) return [];
      
      // Get friend IDs
      const { data: friends } = await supabase
        .from("friends")
        .select("requester_user_id, addressee_user_id")
        .eq("status", "accepted")
        .or(`requester_user_id.eq.${user.id},addressee_user_id.eq.${user.id}`);
      
      const friendIds = friends?.map(f => 
        f.requester_user_id === user.id ? f.addressee_user_id : f.requester_user_id
      ) || [];
      
      // Get ambassador IDs
      const { data: ambassadors } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_ambassador", true);
      
      const ambassadorIds = ambassadors?.map(a => a.id) || [];
      
      // Combine unique IDs
      const relevantUserIds = [...new Set([...friendIds, ...ambassadorIds, user.id])];
      
      // Get rooms for these users
      const { data: rooms } = await supabase
        .from("worship_rooms")
        .select("id, owner_user_id, visibility")
        .in("owner_user_id", relevantUserIds)
        .eq("is_active", true);
      
      // Filter rooms based on visibility
      const accessibleRoomIds = rooms?.filter(room => {
        if (room.owner_user_id === user.id) return true;
        if (room.visibility === "public") return includePublic;
        if (room.visibility === "friends") return friendIds.includes(room.owner_user_id);
        return false;
      }).map(r => r.id) || [];
      
      if (accessibleRoomIds.length === 0) return [];
      
      // Build query for posts - don't filter by post_type in the DB query
      const { data, error } = await supabase
        .from("room_posts")
        .select(`
          *,
          author:profiles!author_user_id(id, full_name, avatar_url, is_ambassador),
          room:worship_rooms!room_id(id, owner_user_id)
        `)
        .in("room_id", accessibleRoomIds)
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      if (!data) return [];
      
      // Filter by category in JS if not 'all'
      const filteredData = filter !== "all" 
        ? data.filter(post => post.post_type === filter)
        : data;
      
      // Fetch reactions for posts
      const postIds = filteredData.map(p => p.id);
      if (postIds.length === 0) return [];
      
      const { data: reactions } = await supabase
        .from("room_reactions")
        .select("*")
        .in("post_id", postIds);
      
      // Group reactions by post
      const reactionsByPost = (reactions || []).reduce((acc, reaction) => {
        if (!acc[reaction.post_id]) acc[reaction.post_id] = [];
        acc[reaction.post_id].push(reaction);
        return acc;
      }, {} as Record<string, typeof reactions>);
      
      // Add reaction data to posts
      return filteredData.map(post => ({
        ...post,
        reactions: ["amen", "praying", "like"].map(type => ({
          reaction_type: type,
          count: (reactionsByPost[post.id] || []).filter((r: any) => r.reaction_type === type).length,
          user_reacted: (reactionsByPost[post.id] || []).some((r: any) => r.reaction_type === type && r.user_id === user.id),
        })),
      }));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}
