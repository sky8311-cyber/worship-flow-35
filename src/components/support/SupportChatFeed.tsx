import { useEffect, useRef } from "react";
import { useSupportChat, useSupportUnreadCount } from "@/hooks/useSupportChat";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { SupportChatInput } from "./SupportChatInput";
import { SupportChatBubble } from "./SupportChatBubble";
import { Loader2, Headset } from "lucide-react";

export function SupportChatFeed() {
  const { language } = useTranslation();
  const { user, profile } = useAuth();
  const { conversation, messages, isLoading, sendMessage, markAsRead } = useSupportChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when viewing
  useEffect(() => {
    if (conversation && !conversation.is_read_by_user) {
      markAsRead.mutate();
    }
  }, [conversation?.is_read_by_user]);

  const handleSendMessage = (content: string, imageUrls?: string[]) => {
    if (!content.trim() && (!imageUrls || imageUrls.length === 0)) return;
    sendMessage.mutate({ content, imageUrls });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 overscroll-contain">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Headset className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">{language === "ko" ? "무엇이든 물어보세요!" : "Ask us anything!"}</p>
            <p className="text-sm text-center mt-2 opacity-70">
              {language === "ko" ? "메시지를 보내 대화를 시작하세요" : "Send a message to start a conversation"}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <SupportChatBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-background">
        <SupportChatInput
          onSend={handleSendMessage}
          isLoading={sendMessage.isPending}
        />
      </div>
    </div>
  );
}
