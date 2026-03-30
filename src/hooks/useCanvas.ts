import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { BlockType, WorkflowStage } from "@/hooks/useStudioPosts";

export interface CanvasBlock {
  id: string;
  canvas_id: string;
  block_type: BlockType;
  position: number;
  content: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Canvas {
  id: string;
  title: string | null;
  workflow_stage: WorkflowStage;
  block_type: BlockType;
  room_id: string;
  created_at: string;
}

export function useCanvas(canvasId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch canvas (room_post)
  const { data: canvas, isLoading: canvasLoading } = useQuery({
    queryKey: ["canvas", canvasId],
    queryFn: async () => {
      if (!canvasId) return null;
      const { data, error } = await supabase
        .from("room_posts")
        .select("id, title, workflow_stage, block_type, room_id, created_at")
        .eq("id", canvasId)
        .single();
      if (error) throw error;
      return data as Canvas;
    },
    enabled: !!canvasId,
  });

  // Fetch blocks
  const { data: blocks = [], isLoading: blocksLoading } = useQuery({
    queryKey: ["canvas-blocks", canvasId],
    queryFn: async () => {
      if (!canvasId) return [];
      const { data, error } = await supabase
        .from("canvas_blocks")
        .select("*")
        .eq("canvas_id", canvasId)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data || []) as CanvasBlock[];
    },
    enabled: !!canvasId,
  });

  // Update canvas title
  const updateTitle = useMutation({
    mutationFn: async (title: string) => {
      if (!canvasId) return;
      const { error } = await supabase
        .from("room_posts")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", canvasId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas", canvasId] });
    },
  });

  // Update canvas stage
  const updateStage = useMutation({
    mutationFn: async (stage: WorkflowStage) => {
      if (!canvasId) return;
      const { error } = await supabase
        .from("room_posts")
        .update({ 
          workflow_stage: stage, 
          is_draft: stage === "draft",
          updated_at: new Date().toISOString() 
        })
        .eq("id", canvasId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas", canvasId] });
    },
  });

  // Add block
  const addBlock = useMutation({
    mutationFn: async (blockType: BlockType) => {
      if (!canvasId) return;
      const maxPos = blocks.length > 0 ? Math.max(...blocks.map(b => b.position)) + 1 : 0;
      const { data, error } = await supabase
        .from("canvas_blocks")
        .insert({
          canvas_id: canvasId,
          block_type: blockType,
          position: maxPos,
          content: {},
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", canvasId] });
    },
  });

  // Update block content
  const updateBlock = useMutation({
    mutationFn: async ({ blockId, content, blockType }: { blockId: string; content?: Record<string, any>; blockType?: BlockType }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (content !== undefined) updates.content = content;
      if (blockType !== undefined) updates.block_type = blockType;
      const { error } = await supabase
        .from("canvas_blocks")
        .update(updates)
        .eq("id", blockId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", canvasId] });
    },
  });

  // Remove block
  const removeBlock = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from("canvas_blocks")
        .delete()
        .eq("id", blockId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-blocks", canvasId] });
    },
  });

  // Reorder blocks
  const reorderBlocks = useCallback(async (reorderedBlocks: CanvasBlock[]) => {
    // Optimistic update
    queryClient.setQueryData(["canvas-blocks", canvasId], reorderedBlocks);
    
    // Batch update positions
    const updates = reorderedBlocks.map((block, index) => 
      supabase
        .from("canvas_blocks")
        .update({ position: index })
        .eq("id", block.id)
    );
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ["canvas-blocks", canvasId] });
  }, [canvasId, queryClient]);

  // Publish canvas
  const publishCanvas = useMutation({
    mutationFn: async () => {
      if (!canvasId) return;
      const { error } = await supabase
        .from("room_posts")
        .update({ 
          workflow_stage: "published", 
          is_draft: false,
          updated_at: new Date().toISOString() 
        })
        .eq("id", canvasId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas", canvasId] });
      queryClient.invalidateQueries({ queryKey: ["studio-posts"] });
      toast.success("발행되었습니다");
      navigate("/atelier");
    },
  });

  // Create new canvas
  const createCanvas = useMutation({
    mutationFn: async ({ roomId, blockType, title }: { roomId: string; blockType: BlockType; title?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("room_posts")
        .insert({
          room_id: roomId,
          author_user_id: user.id,
          title: title || null,
          content: "",
          blocks: [],
          block_type: blockType,
          workflow_stage: "draft",
          is_draft: true,
          post_type: "general",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        navigate(`/studio/canvas/${data.id}`);
      }
    },
  });

  return {
    canvas,
    blocks,
    isLoading: canvasLoading || blocksLoading,
    updateTitle: updateTitle.mutate,
    updateStage: updateStage.mutate,
    addBlock: addBlock.mutate,
    updateBlock: updateBlock.mutate,
    removeBlock: removeBlock.mutate,
    reorderBlocks,
    publishCanvas: publishCanvas.mutate,
    createCanvas: createCanvas.mutate,
    isCreating: createCanvas.isPending,
  };
}
