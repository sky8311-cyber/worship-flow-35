import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StudioCategory {
  id: string;
  key: string;
  label_en: string;
  label_ko: string;
  icon: string;
  color: string;
  sort_order: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useStudioCategories() {
  return useQuery({
    queryKey: ["studio-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_post_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as StudioCategory[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useEnabledCategories() {
  return useQuery({
    queryKey: ["studio-categories-enabled"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_post_categories")
        .select("*")
        .eq("is_enabled", true)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as StudioCategory[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: Omit<StudioCategory, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("studio_post_categories")
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-categories"] });
      toast.success("Category created");
    },
    onError: () => {
      toast.error("Failed to create category");
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StudioCategory> & { id: string }) => {
      const { error } = await supabase
        .from("studio_post_categories")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-categories"] });
      toast.success("Category updated");
    },
    onError: () => {
      toast.error("Failed to update category");
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("studio_post_categories")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-categories"] });
      toast.success("Category deleted");
    },
    onError: () => {
      toast.error("Failed to delete category");
    },
  });
}
