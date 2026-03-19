import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LucideIcon, Home, Calendar, Music, DoorOpen, MessageCircle, Heart, Music2, Share2, Bell, Settings, HelpCircle, Gift, Scale, History, Users, FileText, Star, Bookmark, Search, Plus, Edit, Trash2, Eye, EyeOff, GripVertical, GraduationCap } from "lucide-react";

export type NavigationLocation = "bottom" | "top" | "profile_menu";

export interface NavigationItem {
  id: string;
  key: string;
  location: NavigationLocation;
  label_key: string;
  icon: string;
  path: string | null;
  match_pattern: string | null;
  enabled: boolean;
  order_index: number;
  role_required: string[] | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

// Icon mapping from string name to Lucide component
export const iconMap: Record<string, LucideIcon> = {
  Home,
  Calendar,
  Music,
  DoorOpen,
  MessageCircle,
  Heart,
  Music2,
  Share2,
  Bell,
  Settings,
  HelpCircle,
  Gift,
  Scale,
  History,
  Users,
  FileText,
  Star,
  Bookmark,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  GraduationCap,
};

export function useNavigationItems(location?: NavigationLocation) {
  return useQuery({
    queryKey: ["navigation-items", location],
    queryFn: async () => {
      let query = supabase
        .from("navigation_items")
        .select("*")
        .order("order_index", { ascending: true });

      if (location) {
        query = query.eq("location", location);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as NavigationItem[];
    },
    staleTime: 60000, // Cache for 1 minute
  });
}

export function useEnabledNavigationItems(location: NavigationLocation) {
  return useQuery({
    queryKey: ["navigation-items", location, "enabled"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("navigation_items")
        .select("*")
        .eq("location", location)
        .eq("enabled", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return (data || []) as NavigationItem[];
    },
    staleTime: 60000,
  });
}

export function useNavigationMutations() {
  const queryClient = useQueryClient();

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("navigation_items")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
    },
  });

  const updateOrder = useMutation({
    mutationFn: async (items: { id: string; order_index: number }[]) => {
      const updates = items.map(item => 
        supabase
          .from("navigation_items")
          .update({ order_index: item.order_index, updated_at: new Date().toISOString() })
          .eq("id", item.id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
    },
  });

  const createItem = useMutation({
    mutationFn: async (item: Omit<NavigationItem, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase
        .from("navigation_items")
        .insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("navigation_items")
        .delete()
        .eq("id", id)
        .eq("is_system", false); // Only allow deleting non-system items
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<NavigationItem> }) => {
      const { error } = await supabase
        .from("navigation_items")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
    },
  });

  return {
    toggleEnabled,
    updateOrder,
    createItem,
    deleteItem,
    updateItem,
  };
}
