import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import type { Database } from "@/integrations/supabase/types";

type RoomVisibility = Database["public"]["Enums"]["room_visibility"];

export interface ThemeConfig {
  wallpaper: "default" | "nature" | "worship" | "minimal" | "gradient";
  backgroundColor: string;
  floorStyle: "wood" | "marble" | "carpet" | "stone";
  decorations: string[];
}

export interface WorshipRoom {
  id: string;
  owner_user_id: string;
  visibility: RoomVisibility;
  theme_config: ThemeConfig;
  bgm_song_id: string | null;
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
}

// Fetch room by owner user ID
export function useWorshipRoom(ownerUserId?: string) {
  const { t } = useTranslation();
  
  const query = useQuery({
    queryKey: ["worship-room", "owner", ownerUserId],
    queryFn: async () => {
      if (!ownerUserId) return null;
      
      const { data, error } = await supabase
        .from("worship_rooms")
        .select(`
          *,
          owner:profiles!owner_user_id(id, full_name, avatar_url, is_ambassador),
          bgm_song:songs!bgm_song_id(id, title, artist, youtube_url)
        `)
        .eq("owner_user_id", ownerUserId)
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as WorshipRoom | null;
    },
    enabled: !!ownerUserId,
  });

  return {
    room: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Fetch room by room ID
export function useWorshipRoomById(roomId?: string) {
  const query = useQuery({
    queryKey: ["worship-room", roomId],
    queryFn: async () => {
      if (!roomId) return null;
      
      const { data, error } = await supabase
        .from("worship_rooms")
        .select(`
          *,
          owner:profiles!owner_user_id(id, full_name, avatar_url, is_ambassador),
          bgm_song:songs!bgm_song_id(id, title, artist, youtube_url)
        `)
        .eq("id", roomId)
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as WorshipRoom | null;
    },
    enabled: !!roomId,
  });

  return {
    room: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Update room settings
export function useUpdateRoom() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async (updates: {
      roomId: string;
      visibility?: RoomVisibility;
      theme_config?: ThemeConfig;
      bgm_song_id?: string | null;
    }) => {
      const { roomId, ...data } = updates;
      
      const updateData: Record<string, unknown> = {};
      if (data.visibility !== undefined) updateData.visibility = data.visibility;
      if (data.theme_config !== undefined) updateData.theme_config = data.theme_config;
      if (data.bgm_song_id !== undefined) updateData.bgm_song_id = data.bgm_song_id;
      
      const { error } = await supabase
        .from("worship_rooms")
        .update(updateData)
        .eq("id", roomId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["worship-room"] });
      toast.success(t("common.saveSuccess"));
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}

// Fetch public rooms
export function usePublicRooms(searchQuery?: string) {
  return useQuery({
    queryKey: ["public-rooms", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("worship_rooms")
        .select(`
          *,
          owner:profiles!owner_user_id(id, full_name, avatar_url, is_ambassador)
        `)
        .eq("visibility", "public")
        .order("updated_at", { ascending: false })
        .limit(50);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as WorshipRoom[];
    },
  });
}

// Fetch ambassador rooms - optimized single query
export function useAmbassadorRooms() {
  return useQuery({
    queryKey: ["ambassador-rooms"],
    queryFn: async () => {
      // Single query with join - filter in JS since Supabase doesn't support filtering on joined tables easily
      const { data, error } = await supabase
        .from("worship_rooms")
        .select(`
          *,
          owner:profiles!owner_user_id(id, full_name, avatar_url, is_ambassador)
        `)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      
      // Filter to only ambassador-owned rooms
      return (data?.filter(room => room.owner?.is_ambassador === true) || []) as unknown as WorshipRoom[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
