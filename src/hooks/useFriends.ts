import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import type { Database } from "@/integrations/supabase/types";

type FriendStatus = Database["public"]["Enums"]["friend_status"];

export interface Friend {
  id: string;
  requester_user_id: string;
  addressee_user_id: string;
  status: FriendStatus;
  created_at: string;
  updated_at: string;
  friend_profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Get all friends (accepted)
export function useFriends() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["friends", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("friends")
        .select(`
          *,
          requester:profiles!requester_user_id(id, full_name, avatar_url),
          addressee:profiles!addressee_user_id(id, full_name, avatar_url)
        `)
        .eq("status", "accepted")
        .or(`requester_user_id.eq.${user.id},addressee_user_id.eq.${user.id}`);
      
      if (error) throw error;
      
      // Transform to show the "other" person as friend_profile
      return data?.map(friend => ({
        ...friend,
        friend_profile: friend.requester_user_id === user.id 
          ? friend.addressee 
          : friend.requester,
      })) as Friend[];
    },
    enabled: !!user,
  });
}

// Get pending friend requests (received)
export function usePendingFriendRequests() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["friend-requests", "pending", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("friends")
        .select(`
          *,
          requester:profiles!requester_user_id(id, full_name, avatar_url)
        `)
        .eq("addressee_user_id", user.id)
        .eq("status", "pending");
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Get friend status with a specific user
export function useFriendStatus(targetUserId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["friend-status", user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId || user.id === targetUserId) return null;
      
      const { data, error } = await supabase
        .from("friends")
        .select("*")
        .or(`and(requester_user_id.eq.${user.id},addressee_user_id.eq.${targetUserId}),and(requester_user_id.eq.${targetUserId},addressee_user_id.eq.${user.id})`)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });
}

// Send friend request
export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("friends")
        .insert({
          requester_user_id: user.id,
          addressee_user_id: targetUserId,
          status: "pending",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ["friend-status", user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success(t("rooms.friendRequestSent"));
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}

// Respond to friend request
export function useRespondToFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      const { error } = await supabase
        .from("friends")
        .update({ status: accept ? "accepted" : "declined" })
        .eq("id", requestId);
      
      if (error) throw error;
    },
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["friend-status"] });
      toast.success(accept ? t("rooms.friendRequestAccepted") : t("rooms.friendRequestDeclined"));
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}

// Remove friend
export function useRemoveFriend() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendshipId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-status"] });
      toast.success(t("rooms.friendRemoved"));
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}
