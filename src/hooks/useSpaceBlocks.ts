import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface SpaceBlock {
  id: string;
  space_id: string;
  block_type: string;
  pos_x: number;
  pos_y: number;
  size_w: number;
  size_h: number;
  z_index: number;
  content: Record<string, any>;
  created_at: string | null;
  updated_at: string | null;
}

export function useSpaceBlocks(spaceId: string | undefined) {
  return useQuery({
    queryKey: ["space-blocks", spaceId],
    queryFn: async () => {
      if (!spaceId) return [];
      const { data, error } = await supabase
        .from("space_blocks")
        .select("*")
        .eq("space_id", spaceId);
      if (error) throw error;
      return data as unknown as SpaceBlock[];
    },
    enabled: !!spaceId,
  });
}

export function useCreateBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      space_id: string;
      block_type: string;
      pos_x?: number;
      pos_y?: number;
      size_w?: number;
      size_h?: number;
      content?: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from("space_blocks")
        .insert({
          ...params,
          content: (params.content ?? {}) as Json,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SpaceBlock;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["space-blocks", data.space_id] });
    },
  });
}

export function useUpdateBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      spaceId,
      ...updates
    }: {
      id: string;
      spaceId: string;
      pos_x?: number;
      pos_y?: number;
      size_w?: number;
      size_h?: number;
      z_index?: number;
      content?: Record<string, any>;
    }) => {
      const payload: Record<string, any> = { ...updates };
      if (updates.content) {
        payload.content = updates.content as Json;
      }
      delete payload.spaceId;

      const { error } = await supabase
        .from("space_blocks")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
      return spaceId;
    },
    onSuccess: (spaceId) => {
      queryClient.invalidateQueries({ queryKey: ["space-blocks", spaceId] });
    },
  });
}

export function useDeleteBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, spaceId }: { id: string; spaceId: string }) => {
      const { error } = await supabase.from("space_blocks").delete().eq("id", id);
      if (error) throw error;
      return spaceId;
    },
    onSuccess: (spaceId) => {
      queryClient.invalidateQueries({ queryKey: ["space-blocks", spaceId] });
    },
  });
}
