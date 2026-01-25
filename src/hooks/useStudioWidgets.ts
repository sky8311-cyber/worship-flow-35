import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

export type WidgetType = 
  | "text" 
  | "heading" 
  | "quote" 
  | "callout" 
  | "image" 
  | "video" 
  | "post" 
  | "todo" 
  | "numbered-list" 
  | "bullet-list" 
  | "divider";

export interface WidgetContent {
  text?: string;
  level?: 1 | 2 | 3;
  imageUrl?: string;
  alt?: string;
  videoUrl?: string;
  platform?: "youtube" | "vimeo";
  icon?: string;
  backgroundColor?: string;
  items?: { id: string; text: string; checked?: boolean }[];
  listType?: "bullet" | "numbered" | "todo";
}

export interface StudioWidget {
  id: string;
  room_id: string;
  widget_type: WidgetType;
  content: WidgetContent;
  grid_column: number;
  grid_row: number;
  column_span: number;
  row_span: number;
  post_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Fetch widgets for a room
export function useStudioWidgets(roomId?: string) {
  return useQuery({
    queryKey: ["studio-widgets", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from("studio_widgets")
        .select("*")
        .eq("room_id", roomId)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as StudioWidget[];
    },
    enabled: !!roomId,
  });
}

// Create widget
export function useCreateWidget() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async (widget: {
      room_id: string;
      widget_type: WidgetType;
      content?: WidgetContent;
      grid_column?: number;
      grid_row?: number;
      column_span?: number;
      row_span?: number;
      post_id?: string;
      sort_order?: number;
    }) => {
      const insertData: Record<string, unknown> = {
        room_id: widget.room_id,
        widget_type: widget.widget_type,
        content: widget.content || {},
        grid_column: widget.grid_column || 1,
        grid_row: widget.grid_row || 1,
        column_span: widget.column_span || 1,
        row_span: widget.row_span || 1,
        post_id: widget.post_id || null,
        sort_order: widget.sort_order || 0,
      };
      
      const { data, error } = await supabase
        .from("studio_widgets")
        .insert(insertData as any)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as StudioWidget;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["studio-widgets", variables.room_id] });
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}

// Update widget
export function useUpdateWidget() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      roomId,
      ...updates 
    }: {
      id: string;
      roomId: string;
      widget_type?: WidgetType;
      content?: WidgetContent;
      grid_column?: number;
      grid_row?: number;
      column_span?: number;
      row_span?: number;
      post_id?: string | null;
      sort_order?: number;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (updates.widget_type !== undefined) updateData.widget_type = updates.widget_type;
      if (updates.content !== undefined) updateData.content = updates.content as unknown as Record<string, unknown>;
      if (updates.grid_column !== undefined) updateData.grid_column = updates.grid_column;
      if (updates.grid_row !== undefined) updateData.grid_row = updates.grid_row;
      if (updates.column_span !== undefined) updateData.column_span = updates.column_span;
      if (updates.row_span !== undefined) updateData.row_span = updates.row_span;
      if (updates.post_id !== undefined) updateData.post_id = updates.post_id;
      if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order;
      
      const { error } = await supabase
        .from("studio_widgets")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["studio-widgets", variables.roomId] });
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}

// Delete widget
export function useDeleteWidget() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async ({ id, roomId }: { id: string; roomId: string }) => {
      const { error } = await supabase
        .from("studio_widgets")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["studio-widgets", variables.roomId] });
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}

// Reorder widgets (batch update sort_order)
export function useReorderWidgets() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async ({ 
      roomId, 
      widgetIds 
    }: { 
      roomId: string; 
      widgetIds: string[]; 
    }) => {
      // Update each widget's sort_order based on position in array
      const updates = widgetIds.map((id, index) => 
        supabase
          .from("studio_widgets")
          .update({ sort_order: index })
          .eq("id", id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["studio-widgets", variables.roomId] });
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}
