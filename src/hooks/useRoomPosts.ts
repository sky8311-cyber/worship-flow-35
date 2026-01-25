import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import type { Database } from "@/integrations/supabase/types";

type RoomPostType = Database["public"]["Enums"]["room_post_type"];
type RoomVisibility = Database["public"]["Enums"]["room_visibility"];
type RoomReactionType = Database["public"]["Enums"]["room_reaction_type"];

export interface RoomPost {
  id: string;
  room_id: string;
  author_user_id: string;
  post_type: RoomPostType;
  content: string;
  visibility: RoomVisibility | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  reactions?: {
    reaction_type: RoomReactionType;
    count: number;
    user_reacted: boolean;
  }[];
}

export interface RoomReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: RoomReactionType;
  created_at: string;
}

// Fetch posts for a room
export function useRoomPosts(roomId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["room-posts", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from("room_posts")
        .select(`
          *,
          author:profiles!author_user_id(id, full_name, avatar_url)
        `)
        .eq("room_id", roomId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Fetch reactions for each post
      const postIds = data?.map(p => p.id) || [];
      if (postIds.length === 0) return [];
      
      const { data: reactions } = await supabase
        .from("room_reactions")
        .select("*")
        .in("post_id", postIds);
      
      // Group reactions by post and type
      const reactionsByPost = (reactions || []).reduce((acc, reaction) => {
        if (!acc[reaction.post_id]) acc[reaction.post_id] = [];
        acc[reaction.post_id].push(reaction);
        return acc;
      }, {} as Record<string, RoomReaction[]>);
      
      // Add reaction counts to posts
      return data?.map(post => {
        const postReactions = reactionsByPost[post.id] || [];
        const reactionTypes: RoomReactionType[] = ["amen", "praying", "like"];
        
        return {
          ...post,
          reactions: reactionTypes.map(type => ({
            reaction_type: type,
            count: postReactions.filter(r => r.reaction_type === type).length,
            user_reacted: postReactions.some(r => r.reaction_type === type && r.user_id === user?.id),
          })),
        };
      }) as RoomPost[];
    },
    enabled: !!roomId,
  });
}

// Create a new post
export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async (post: {
      room_id: string;
      post_type: RoomPostType;
      content: string;
      visibility?: RoomVisibility | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("room_posts")
        .insert({
          room_id: post.room_id,
          author_user_id: user.id,
          post_type: post.post_type,
          content: post.content,
          visibility: post.visibility || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["room-posts", variables.room_id] });
      toast.success(t("studio.postCreated"));
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}

// Delete a post
export function useDeletePost() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async ({ postId, roomId }: { postId: string; roomId: string }) => {
      const { error } = await supabase
        .from("room_posts")
        .delete()
        .eq("id", postId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["room-posts", variables.roomId] });
      toast.success(t("common.deleteSuccess"));
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}

// Toggle reaction
export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      postId, 
      roomId,
      reactionType,
      hasReacted 
    }: { 
      postId: string;
      roomId: string; 
      reactionType: RoomReactionType;
      hasReacted: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");
      
      if (hasReacted) {
        // Remove reaction
        const { error } = await supabase
          .from("room_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionType);
        
        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from("room_reactions")
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["room-posts", variables.roomId] });
    },
  });
}

// Toggle pinned status
export function useTogglePinPost() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async ({ postId, roomId, isPinned }: { postId: string; roomId: string; isPinned: boolean }) => {
      const { error } = await supabase
        .from("room_posts")
        .update({ is_pinned: !isPinned })
        .eq("id", postId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["room-posts", variables.roomId] });
      toast.success(t("common.saveSuccess"));
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}
