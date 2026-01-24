import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  created_at: string;
  metadata: any;
}

// Chat-related notification types
const CHAT_NOTIFICATION_TYPES = ['post_like', 'post_comment', 'new_member', 'invitation_accepted', 'birthday', 'collaborator_invited', 'promoted_to_owner', 'promoted_to_community_leader', 'promoted_to_worship_leader', 'demoted_to_member', 'new_feedback_post', 'new_community_post', 'support_reply', 'event_reminder'];

export function useNotifications() {
  const { user, isAdmin, isWorshipLeader } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all notifications for current user
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  
  // Count unread chat notifications specifically
  const chatUnreadCount = notifications.filter(
    (n) => !n.is_read && CHAT_NOTIFICATION_TYPES.includes(n.type)
  ).length;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark chat-related notifications as read
  const markChatNotificationsAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const unreadChatNotifications = notifications.filter(
        (n) => !n.is_read && CHAT_NOTIFICATION_TYPES.includes(n.type)
      );

      if (unreadChatNotifications.length === 0) return;

      const ids = unreadChatNotifications.map((n) => n.id);
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    notifications,
    unreadCount,
    chatUnreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    markChatNotificationsAsRead: markChatNotificationsAsReadMutation.mutate,
  };
}
