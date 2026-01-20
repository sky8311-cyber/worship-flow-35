import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminSupportChat, type SupportMessage, type SupportConversation } from "@/hooks/useSupportChat";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SupportChatBubble } from "@/components/support/SupportChatBubble";
import { SupportChatInput } from "@/components/support/SupportChatInput";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Search,
  Flag,
  Archive,
  Trash2,
  MailOpen,
  Mail,
  Loader2,
  MessageSquare,
  Headset,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type FilterTab = "all" | "unread" | "flagged" | "archived";

export default function AdminSupport() {
  const { t, language } = useTranslation();
  const {
    conversations,
    isLoading,
    fetchMessages,
    sendAdminMessage,
    toggleFlag,
    toggleReadStatus,
    archiveConversation,
    deleteConversation,
    createConversationForUser,
  } = useAdminSupportChat();

  const [filter, setFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // Filter by tab
    if (filter === "unread" && conv.is_read_by_admin) return false;
    if (filter === "flagged" && !conv.is_flagged) return false;
    if (filter === "archived" && conv.status !== "archived") return false;
    if (filter !== "archived" && conv.status === "archived") return false;

    // Filter by search
    if (searchQuery) {
      const name = conv.profiles?.full_name?.toLowerCase() || "";
      const email = conv.profiles?.email?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      return name.includes(query) || email.includes(query);
    }

    return true;
  });

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);
    fetchMessages(selectedConversation.id)
      .then((msgs) => {
        setMessages(msgs);
        // Mark as read
        if (!selectedConversation.is_read_by_admin) {
          toggleReadStatus.mutate({
            conversationId: selectedConversation.id,
            isRead: true,
          });
        }
      })
      .finally(() => setMessagesLoading(false));
  }, [selectedConversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Search users for starting new conversation
  const { data: searchedUsers } = useQuery({
    queryKey: ["admin-user-search", userSearchQuery],
    queryFn: async () => {
      if (!userSearchQuery || userSearchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .or(`full_name.ilike.%${userSearchQuery}%,email.ilike.%${userSearchQuery}%`)
        .limit(10);

      if (error) return [];
      return data;
    },
    enabled: userSearchQuery.length >= 2,
  });

  const handleSendMessage = (content: string, imageUrls?: string[]) => {
    if (!selectedConversation) return;

    sendAdminMessage.mutate(
      {
        conversationId: selectedConversation.id,
        content,
        imageUrls,
        userId: selectedConversation.user_id,
      },
      {
        onSuccess: () => {
          // Refresh messages
          fetchMessages(selectedConversation.id).then(setMessages);
        },
      }
    );
  };

  const handleStartConversation = async (userId: string) => {
    const conversationId = await createConversationForUser.mutateAsync(userId);
    setShowUserSearch(false);
    setUserSearchQuery("");

    // Find and select the conversation
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv) {
      setSelectedConversation(conv);
    } else {
      // Refetch and then select
      setTimeout(() => {
        const newConv = conversations.find((c) => c.user_id === userId);
        if (newConv) setSelectedConversation(newConv);
      }, 500);
    }
  };

  const formatTime = (date: string | null) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: language === "ko" ? ko : undefined,
    });
  };

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Left Panel - Conversation List */}
        <div className="w-80 flex-shrink-0 flex flex-col border rounded-lg bg-card">
          {/* Header */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Headset className="h-5 w-5" />
                {language === "ko" ? "고객 지원" : "Support"}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUserSearch(!showUserSearch)}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                {language === "ko" ? "새 대화" : "New"}
              </Button>
            </div>

            {/* User search for new conversation */}
            {showUserSearch && (
              <div className="space-y-2">
                <Input
                  placeholder={language === "ko" ? "사용자 검색..." : "Search users..."}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="h-8"
                />
                {searchedUsers && searchedUsers.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-auto">
                    {searchedUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleStartConversation(user.id)}
                        className="w-full p-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {(user.full_name || user.email || "U").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="truncate">
                          <p className="font-medium truncate">{user.full_name || user.email}</p>
                          {user.full_name && user.email && (
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "ko" ? "대화 검색..." : "Search conversations..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Filter tabs */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
              <TabsList className="w-full grid grid-cols-4 h-8">
                <TabsTrigger value="all" className="text-xs px-2">
                  {language === "ko" ? "전체" : "All"}
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-xs px-2">
                  {language === "ko" ? "안읽음" : "Unread"}
                </TabsTrigger>
                <TabsTrigger value="flagged" className="text-xs px-2">
                  <Flag className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger value="archived" className="text-xs px-2">
                  <Archive className="h-3 w-3" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Conversation list */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">{language === "ko" ? "대화가 없습니다" : "No conversations"}</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      "w-full p-3 text-left hover:bg-muted/50 transition-colors",
                      selectedConversation?.id === conv.id && "bg-muted",
                      !conv.is_read_by_admin && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={conv.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {(conv.profiles?.full_name || conv.profiles?.email || "U").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("font-medium truncate", !conv.is_read_by_admin && "font-semibold")}>
                            {conv.profiles?.full_name || conv.profiles?.email || "Unknown"}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {conv.is_flagged && <Flag className="h-3 w-3 text-destructive" />}
                            {!conv.is_read_by_admin && (
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_message?.content || (language === "ko" ? "메시지 없음" : "No messages")}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatTime(conv.last_message_at || conv.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Panel - Chat Window */}
        <div className="flex-1 flex flex-col border rounded-lg bg-card">
          {selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(selectedConversation.profiles?.full_name || "U").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedConversation.profiles?.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.profiles?.email}
                    </p>
                  </div>
                  {selectedConversation.is_flagged && (
                    <Badge variant="destructive" className="text-xs">
                      <Flag className="h-3 w-3 mr-1" />
                      {language === "ko" ? "플래그" : "Flagged"}
                    </Badge>
                  )}
                  {selectedConversation.status === "archived" && (
                    <Badge variant="secondary" className="text-xs">
                      <Archive className="h-3 w-3 mr-1" />
                      {language === "ko" ? "보관됨" : "Archived"}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        toggleReadStatus.mutate({
                          conversationId: selectedConversation.id,
                          isRead: !selectedConversation.is_read_by_admin,
                        })
                      }
                    >
                      {selectedConversation.is_read_by_admin ? (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          {language === "ko" ? "안읽음으로 표시" : "Mark Unread"}
                        </>
                      ) : (
                        <>
                          <MailOpen className="h-4 w-4 mr-2" />
                          {language === "ko" ? "읽음으로 표시" : "Mark Read"}
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        toggleFlag.mutate({
                          conversationId: selectedConversation.id,
                          isFlagged: !selectedConversation.is_flagged,
                        })
                      }
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      {selectedConversation.is_flagged
                        ? language === "ko"
                          ? "플래그 해제"
                          : "Unflag"
                        : language === "ko"
                        ? "플래그"
                        : "Flag"}
                    </DropdownMenuItem>
                    {selectedConversation.status !== "archived" && (
                      <DropdownMenuItem
                        onClick={() => archiveConversation.mutate(selectedConversation.id)}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        {language === "ko" ? "보관" : "Archive"}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {language === "ko" ? "삭제" : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                    <p>{language === "ko" ? "메시지가 없습니다" : "No messages yet"}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <SupportChatBubble
                        key={msg.id}
                        message={msg}
                        isOwn={msg.sender_type === "admin"}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              {selectedConversation.status !== "archived" && (
                <div className="border-t">
                  <SupportChatInput
                    onSend={handleSendMessage}
                    isLoading={sendAdminMessage.isPending}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Headset className="h-12 w-12 mb-4 opacity-50" />
              <p>{language === "ko" ? "대화를 선택하세요" : "Select a conversation"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ko" ? "대화 삭제" : "Delete Conversation"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ko"
                ? "이 대화와 모든 메시지가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
                : "This conversation and all messages will be permanently deleted. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "ko" ? "취소" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (selectedConversation) {
                  deleteConversation.mutate(selectedConversation.id);
                  setSelectedConversation(null);
                }
                setDeleteDialogOpen(false);
              }}
            >
              {language === "ko" ? "삭제" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
