import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, CheckCircle2, Sparkles, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CurationProfileChatProps {
  existingSummary?: string | null;
  existingMessages?: ChatMessage[] | null;
  onComplete: () => void;
}

export function CurationProfileChat({ existingSummary, existingMessages, onComplete }: CurationProfileChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Start or resume conversation on mount
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    if (existingMessages && existingMessages.length > 0) {
      // Resume saved conversation
      setMessages(existingMessages);
    } else {
      // Start new conversation
      const initialMsg = existingSummary
        ? "기존 프로필을 수정하고 싶습니다."
        : "안녕하세요, 시작합니다.";
      sendMessage(initialMsg, true);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string, isInitial = false) => {
    setIsLoading(true);

    const newMessages: ChatMessage[] = isInitial
      ? [{ role: "user", content: existingSummary ? "기존 프로필을 수정하고 싶습니다." : "안녕하세요" }]
      : [...messages, { role: "user", content: text }];

    if (!isInitial) {
      setMessages(newMessages);
      setInput("");
    }

    try {
      await supabase.auth.refreshSession();
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("로그인이 필요합니다.");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-curation-profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            existingSummary: existingSummary || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "요청 실패");
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.response || "응답을 받지 못했습니다.",
      };

      setMessages(isInitial ? [assistantMsg] : [...newMessages, assistantMsg]);

      if (data.is_complete) {
        setIsComplete(true);
        setTimeout(() => onComplete(), 2000);
      }
    } catch (err: any) {
      console.error("Curation chat error:", err);
      toast.error(err.message || "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isComplete) return;
    sendMessage(input.trim());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">
          {existingSummary ? "예배 프로필 수정" : "내 예배 프로필 설정"}
        </span>
      </div>

      {/* Existing profile summary card */}
      {existingSummary && (
        <Card className="mb-3 border-primary/20 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-primary mb-1">현재 저장된 프로필</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {existingSummary}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumed conversation indicator */}
      {existingMessages && existingMessages.length > 0 && !existingSummary && (
        <Card className="mb-3 border-muted bg-muted/30">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">💬 이전 대화를 이어갑니다. 계속 답변해 주세요.</p>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="space-y-3 py-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          {isComplete && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg px-4 py-2">
                <CheckCircle2 className="w-4 h-4" />
                프로필 저장 완료. 이제 AI가 회중에 맞는 세트를 제안합니다.
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      {!isComplete && (
        <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="답변을 입력하세요..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
