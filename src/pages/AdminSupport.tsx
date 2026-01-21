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
import { Checkbox } from "@/components/ui/checkbox";
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
  X,
  CheckSquare,
  ChevronLeft,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type FilterTab = "all" | "unread" | "flagged" | "archived";

export default function AdminSupport() {
  const { t, language } = useTranslation();
  const isMobile = useIsMobile();
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
  
  // Bulk selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

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

  // Bulk selection handlers
  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredConversations.map(c => c.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleBulkArchive = async () => {
    for (const id of selectedIds) {
      await archiveConversation.mutateAsync(id);
    }
    toast.success(language === "ko" ? `${selectedIds.size}개 대화가 보관되었습니다` : `${selectedIds.size} conversations archived`);
    clearSelection();
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteConversation.mutateAsync(id);
    }
    toast.success(language === "ko" ? `${selectedIds.size}개 대화가 삭제되었습니다` : `${selectedIds.size} conversations deleted`);
    clearSelection();
    setBulkDeleteDialogOpen(false);
  };

  const handleBulkMarkRead = async (isRead: boolean) => {
    for (const id of selectedIds) {
      await toggleReadStatus.mutateAsync({ conversationId: id, isRead });
    }
    toast.success(
      isRead 
        ? (language === "ko" ? `${selectedIds.size}개 대화를 읽음으로 표시했습니다` : `Marked ${selectedIds.size} as read`)
        : (language === "ko" ? `${selectedIds.size}개 대화를 안읽음으로 표시했습니다` : `Marked ${selectedIds.size} as unread`)
    );
    clearSelection();
  };

  return (
    <AdminLayout>
      <div className={cn(
        "flex h-[calc(100vh-8rem)]",
        isMobile ? "flex-col" : "flex-row gap-4"
      )}>
        {/* Left Panel - Conversation List */}
        <div className={cn(
          "flex flex-col border rounded-lg bg-card",
          isMobile ? "flex-1" : "w-80 flex-shrink-0",
          // Hide on mobile when a conversation is selected
          isMobile && selectedConversation && "hidden"
        )}>
          {/* Header */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Headset className="h-5 w-5" />
                {language === "ko" ? "고객 지원" : "Support"}
              </h2>
              <div className="flex items-center gap-1">
                {/* Toggle selection mode */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectMode) {
                      clearSelection();
                    } else {
                      setSelectMode(true);
                    }
                  }}
                  className="h-8 px-2"
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
                
                {/* New conversation with floating search */}
                <Popover open={showUserSearch} onOpenChange={setShowUserSearch}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <UserPlus className="h-4 w-4 mr-1" />
                      {language === "ko" ? "새 대화" : "New"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="end">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder={language === "ko" ? "사용자 검색..." : "Search users..."}
                        value={userSearchQuery}
                        onValueChange={setUserSearchQuery}
                      />
                      <CommandList className="max-h-64">
                        {userSearchQuery.length < 2 ? (
                          <CommandEmpty>
                            {language === "ko" ? "2자 이상 입력하세요" : "Type at least 2 characters"}
                          </CommandEmpty>
                        ) : !searchedUsers || searchedUsers.length === 0 ? (
                          <CommandEmpty>
                            {language === "ko" ? "사용자를 찾을 수 없습니다" : "No users found"}
                          </CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {searchedUsers.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={user.id}
                                onSelect={() => handleStartConversation(user.id)}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {(user.full_name || user.email || "U").charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{user.full_name || user.email}</p>
                                  {user.full_name && user.email && (
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Select all button when in select mode */}
            {selectMode && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedIds.size > 0 
                    ? (language === "ko" ? `${selectedIds.size}개 선택됨` : `${selectedIds.size} selected`)
                    : (language === "ko" ? "선택 모드" : "Select mode")
                  }
                </span>
                <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 text-xs">
                  {language === "ko" ? "전체 선택" : "Select All"}
                </Button>
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
                  <div
                    key={conv.id}
                    className={cn(
                      "relative group",
                      selectedConversation?.id === conv.id && "bg-muted",
                      !conv.is_read_by_admin && "bg-primary/5"
                    )}
                  >
                    {/* Checkbox for bulk selection */}
                    {selectMode && (
                      <div 
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds.has(conv.id)}
                          onCheckedChange={() => toggleSelect(conv.id)}
                        />
                      </div>
                    )}
                    
                    <button
                      onClick={() => !selectMode && setSelectedConversation(conv)}
                      className={cn(
                        "w-full p-3 text-left hover:bg-muted/50 transition-colors",
                        selectMode && "pl-10"
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
                    
                    {/* Three-dot menu - appears on hover when not in select mode */}
                    {!selectMode && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleReadStatus.mutate({ conversationId: conv.id, isRead: !conv.is_read_by_admin });
                              }}
                            >
                              {conv.is_read_by_admin ? (
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
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFlag.mutate({ conversationId: conv.id, isFlagged: !conv.is_flagged });
                              }}
                            >
                              <Flag className="h-4 w-4 mr-2" />
                              {conv.is_flagged 
                                ? (language === "ko" ? "플래그 해제" : "Unflag") 
                                : (language === "ko" ? "플래그" : "Flag")
                              }
                            </DropdownMenuItem>
                            {conv.status !== "archived" && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  archiveConversation.mutate(conv.id);
                                }}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                {language === "ko" ? "보관" : "Archive"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedConversation(conv);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {language === "ko" ? "삭제" : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Panel - Chat Window */}
        <div className={cn(
          "flex-1 flex flex-col border rounded-lg bg-card",
          // Hide on mobile when no conversation is selected
          isMobile && !selectedConversation && "hidden"
        )}>
          {selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Mobile back button */}
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedConversation(null)}
                      className="mr-1 -ml-2"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  )}
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

      {/* Floating bulk action bar */}
      {selectedIds.size > 0 && (
        <div className={cn(
          "fixed z-50",
          isMobile 
            ? "bottom-20 left-4 right-4" 
            : "bottom-6 left-1/2 -translate-x-1/2"
        )}>
          <div className={cn(
            "bg-primary text-primary-foreground rounded-lg shadow-lg px-4 py-3 flex items-center gap-4",
            isMobile && "flex-col gap-3"
          )}>
            <div className={cn(
              "flex items-center gap-4 w-full",
              isMobile && "justify-between"
            )}>
              <span className="font-medium whitespace-nowrap">
                {selectedIds.size} {language === "ko" ? "개 선택됨" : "selected"}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearSelection} 
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className={cn(
              "flex items-center gap-2",
              isMobile && "flex-wrap justify-center w-full"
            )}>
              <Button variant="secondary" size="sm" onClick={() => handleBulkMarkRead(true)}>
                <MailOpen className="h-4 w-4 mr-1" />
                {language === "ko" ? "읽음" : "Read"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleBulkMarkRead(false)}>
                <Mail className="h-4 w-4 mr-1" />
                {language === "ko" ? "안읽음" : "Unread"}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleBulkArchive}>
                <Archive className="h-4 w-4 mr-1" />
                {language === "ko" ? "보관" : "Archive"}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-1" />
                {language === "ko" ? "삭제" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog for single conversation */}
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

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ko" ? `${selectedIds.size}개 대화 삭제` : `Delete ${selectedIds.size} Conversations`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ko"
                ? "선택한 모든 대화와 메시지가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
                : "All selected conversations and messages will be permanently deleted. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "ko" ? "취소" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              {language === "ko" ? "삭제" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
