import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SupportConversation {
  id: string;
  user_id: string;
  status: "open" | "archived" | "closed";
  is_read_by_admin: boolean;
  is_read_by_user: boolean;
  is_flagged: boolean;
  last_message_at: string | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
  last_message?: {
    content: string | null;
    sender_type: string;
  };
}

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "user" | "admin";
  content: string | null;
  image_urls: string[];
  created_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Hook for users to manage their support conversation
export function useSupportChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get or create user's conversation
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ["support-conversation", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Try to get existing conversation
      const { data: existing, error: fetchError } = await supabase
        .from("support_conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (existing) return existing as SupportConversation;

      // Create new conversation if none exists
      const { data: newConvo, error: createError } = await supabase
        .from("support_conversations")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (createError) throw createError;
      return newConvo as SupportConversation;
    },
    enabled: !!user?.id,
  });

  // Fetch messages for the conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["support-messages", conversation?.id],
    queryFn: async () => {
      if (!conversation?.id) return [];

      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Fetch profiles separately
      const senderIds = [...new Set((data || []).map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", senderIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return (data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as "user" | "admin",
        profiles: profileMap.get(msg.sender_id),
      })) as SupportMessage[];
    },
    enabled: !!conversation?.id,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ content, imageUrls }: { content: string; imageUrls?: string[] }) => {
      if (!conversation?.id || !user?.id) throw new Error("No conversation");

      const { data, error } = await supabase
        .from("support_messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: "user",
          content,
          image_urls: imageUrls || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-messages", conversation?.id] });
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  // Mark as read mutation (for user)
  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!conversation?.id) return;

      const { error } = await supabase
        .from("support_conversations")
        .update({ is_read_by_user: true })
        .eq("id", conversation.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-conversation", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["support-unread-count"] });
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`support-messages-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["support-messages", conversation.id] });
          queryClient.invalidateQueries({ queryKey: ["support-conversation", user?.id] });
          queryClient.invalidateQueries({ queryKey: ["support-unread-count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id, queryClient, user?.id]);

  return {
    conversation,
    messages: messages || [],
    isLoading: conversationLoading || messagesLoading,
    sendMessage,
    markAsRead,
  };
}

// Hook for getting unread support count (for users)
export function useSupportUnreadCount() {
  const { user } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["support-unread-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from("support_conversations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read_by_user", false);

      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  return unreadCount;
}

// Hook for admin to manage all support conversations
export function useAdminSupportChat() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all conversations for admin
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["admin-support-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_conversations")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Fetch profiles for all users
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from("support_messages")
            .select("content, sender_type")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...conv,
            status: conv.status as "open" | "archived" | "closed",
            profiles: profileMap.get(conv.user_id),
            last_message: lastMsg,
          } as SupportConversation;
        })
      );

      return conversationsWithLastMessage;
    },
    enabled: isAdmin,
  });

  // Fetch messages for a specific conversation
  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    
    // Fetch profiles separately
    const senderIds = [...new Set((data || []).map(m => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", senderIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    return (data || []).map(msg => ({
      ...msg,
      sender_type: msg.sender_type as "user" | "admin",
      profiles: profileMap.get(msg.sender_id),
    })) as SupportMessage[];
  };

  // Send message as admin
  const sendAdminMessage = useMutation({
    mutationFn: async ({
      conversationId,
      content,
      imageUrls,
      userId,
    }: {
      conversationId: string;
      content: string;
      imageUrls?: string[];
      userId: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Insert message
      const { data: message, error: msgError } = await supabase
        .from("support_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: "admin",
          content,
          image_urls: imageUrls || [],
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Create notification for user
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: userId,
        type: "support_reply",
        title: "Support Reply",
        message: content.slice(0, 100),
        related_id: conversationId,
        related_type: "support_conversation",
      });

      // Log error but don't fail the message send
      if (notifError) {
        console.error("Failed to create support_reply notification:", notifError);
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  // Toggle flag
  const toggleFlag = useMutation({
    mutationFn: async ({ conversationId, isFlagged }: { conversationId: string; isFlagged: boolean }) => {
      const { error } = await supabase
        .from("support_conversations")
        .update({ is_flagged: isFlagged })
        .eq("id", conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
    },
  });

  // Toggle read status
  const toggleReadStatus = useMutation({
    mutationFn: async ({ conversationId, isRead }: { conversationId: string; isRead: boolean }) => {
      const { error } = await supabase
        .from("support_conversations")
        .update({ is_read_by_admin: isRead })
        .eq("id", conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-support-unread-count"] });
    },
  });

  // Archive conversation
  const archiveConversation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from("support_conversations")
        .update({ status: "archived" })
        .eq("id", conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
      toast.success("Conversation archived");
    },
  });

  // Delete conversation
  const deleteConversation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from("support_conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
      toast.success("Conversation deleted");
    },
  });

  // Create conversation for a user (admin initiates)
  const createConversationForUser = useMutation({
    mutationFn: async (userId: string) => {
      // Check if open conversation exists
      const { data: existing } = await supabase
        .from("support_conversations")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "open")
        .maybeSingle();

      if (existing) return existing.id;

      // Create new conversation
      const { data, error } = await supabase
        .from("support_conversations")
        .insert({ user_id: userId })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel("admin-support-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_conversations",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
          queryClient.invalidateQueries({ queryKey: ["admin-support-unread-count"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
          queryClient.invalidateQueries({ queryKey: ["admin-support-unread-count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient]);

  return {
    conversations: conversations || [],
    isLoading: conversationsLoading,
    fetchMessages,
    sendAdminMessage,
    toggleFlag,
    toggleReadStatus,
    archiveConversation,
    deleteConversation,
    createConversationForUser,
  };
}

// Hook for admin unread count
export function useAdminSupportUnreadCount() {
  const { isAdmin } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["admin-support-unread-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("support_conversations")
        .select("*", { count: "exact", head: true })
        .eq("is_read_by_admin", false)
        .eq("status", "open");

      if (error) return 0;
      return count || 0;
    },
    enabled: isAdmin,
    staleTime: 30000,
  });

  return unreadCount;
}
