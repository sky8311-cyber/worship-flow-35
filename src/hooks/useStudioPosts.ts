import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import type { Database } from "@/integrations/supabase/types";
import type { Json } from "@/integrations/supabase/types";

type RoomPostType = Database["public"]["Enums"]["room_post_type"];
type RoomVisibility = Database["public"]["Enums"]["room_visibility"];
type RoomReactionType = Database["public"]["Enums"]["room_reaction_type"];

export type DisplayType = "list" | "card" | "gallery";
export type WorkflowStage = "draft" | "in_progress" | "refined" | "published";
export type BlockType = "song" | "worship_set" | "scripture" | "prayer_note" | "audio" | "note";

export interface BlockContent {
  id: string;
  type: "heading" | "paragraph" | "bullet-list" | "numbered-list" | "quote" | "divider" | "song" | "worship-set" | "image";
  attrs?: {
    level?: 1 | 2 | 3;
    songId?: string;
    setId?: string;
    imageUrl?: string;
  };
  content?: string;
}

export interface StudioPost {
  id: string;
  room_id: string;
  author_user_id: string;
  post_type: RoomPostType;
  content: string;
  title: string | null;
  blocks: BlockContent[];
  display_type: DisplayType;
  cover_image_url: string | null;
  is_draft: boolean;
  visibility: RoomVisibility | null;
  is_pinned: boolean;
  workflow_stage: WorkflowStage;
  block_type: BlockType;
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

// Fetch posts for a studio with new block structure
export function useStudioPosts(roomId?: string, includeDrafts = false) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["studio-posts", roomId, includeDrafts],
    queryFn: async () => {
      if (!roomId) return [];
      
      let query = supabase
        .from("room_posts")
        .select(`
          *,
          author:profiles!author_user_id(id, full_name, avatar_url)
        `)
        .eq("room_id", roomId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (!includeDrafts) {
        query = query.eq("is_draft", false);
      }
      
      const { data, error } = await query;
      
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
      }, {} as Record<string, any[]>);
      
      // Add reaction counts to posts and parse blocks
      return data?.map(post => {
        const postReactions = reactionsByPost[post.id] || [];
        const reactionTypes: RoomReactionType[] = ["amen", "praying", "like"];
        
        // Safely parse blocks - could be array or object
        let parsedBlocks: BlockContent[] = [];
        if (Array.isArray(post.blocks)) {
          parsedBlocks = post.blocks as unknown as BlockContent[];
        }
        
        return {
          ...post,
          blocks: parsedBlocks,
          display_type: (post.display_type as DisplayType) || "card",
          workflow_stage: (post.workflow_stage as WorkflowStage) || "draft",
          block_type: (post.block_type as BlockType) || "note",
          reactions: reactionTypes.map(type => ({
            reaction_type: type,
            count: postReactions.filter((r: any) => r.reaction_type === type).length,
            user_reacted: postReactions.some((r: any) => r.reaction_type === type && r.user_id === user?.id),
          })),
        };
      }) as StudioPost[];
    },
    enabled: !!roomId,
  });
}

// Create a new studio post with blocks
export function useCreateStudioPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t, language } = useTranslation();
  
  return useMutation({
    mutationFn: async (post: {
      room_id: string;
      title?: string;
      content?: string;
      blocks?: BlockContent[];
      display_type?: DisplayType;
      cover_image_url?: string;
      is_draft?: boolean;
      post_type?: RoomPostType;
      visibility?: RoomVisibility | null;
      workflow_stage?: WorkflowStage;
      block_type?: BlockType;
    }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("room_posts")
        .insert({
          room_id: post.room_id,
          author_user_id: user.id,
          title: post.title || null,
          content: post.content || "",
          blocks: (post.blocks || []) as unknown as Json,
          display_type: post.display_type || "card",
          cover_image_url: post.cover_image_url || null,
          is_draft: post.is_draft ?? false,
          post_type: post.post_type || "general",
          visibility: post.visibility || null,
          workflow_stage: post.workflow_stage || "draft",
          block_type: post.block_type || "note",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["studio-posts", variables.room_id] });
      queryClient.invalidateQueries({ queryKey: ["room-posts", variables.room_id] });
      toast.success(language === "ko" ? "게시물이 저장되었습니다" : "Post saved");
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}

// Update an existing studio post
export function useUpdateStudioPost() {
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();
  
  return useMutation({
    mutationFn: async ({ 
      postId, 
      roomId,
      updates 
    }: { 
      postId: string; 
      roomId: string;
      updates: Partial<{
        title: string;
        content: string;
        blocks: BlockContent[];
        display_type: DisplayType;
        cover_image_url: string;
        is_draft: boolean;
        workflow_stage: WorkflowStage;
        block_type: BlockType;
      }>;
    }) => {
      const { error } = await supabase
        .from("room_posts")
        .update({
          ...updates,
          blocks: updates.blocks as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["studio-posts", variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ["room-posts", variables.roomId] });
      toast.success(language === "ko" ? "저장되었습니다" : "Saved");
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}

// Delete a studio post
export function useDeleteStudioPost() {
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();
  
  return useMutation({
    mutationFn: async ({ postId, roomId }: { postId: string; roomId: string }) => {
      const { error } = await supabase
        .from("room_posts")
        .delete()
        .eq("id", postId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["studio-posts", variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ["room-posts", variables.roomId] });
      toast.success(language === "ko" ? "삭제되었습니다" : "Deleted");
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}
