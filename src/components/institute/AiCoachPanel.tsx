import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useTierFeature } from "@/hooks/useTierFeature";
import { LockedFeatureBanner } from "@/components/LockedFeatureBanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiCoachPanelProps {
  courseId: string;
  moduleId: string;
}

export function AiCoachPanel({ courseId, moduleId }: AiCoachPanelProps) {
  const { user } = useAuth();
  const { language } = useTranslation();
  const { hasFeature } = useTierFeature();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canUseCoach = hasFeature("institute_ai_coach");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset on module change
  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [moduleId]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      await supabase.auth.refreshSession();
      const { data: { session } } = await supabase.auth.getSession();

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/institute-ai-coach`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            course_id: courseId,
            module_id: moduleId,
            message: userMessage,
            conversation_history: messages,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }

      const data = await resp.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: language === "ko" ? "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요." : "Sorry, an error occurred. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canUseCoach) {
    return (
      <div className="mt-6">
        <LockedFeatureBanner
          feature="institute_ai_coach"
          message={language === "ko" ? "AI 러닝 코치" : "AI Learning Coach"}
          onUpgrade={() => navigate("/membership")}
        />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          {language === "ko" ? "AI 코치에게 질문하기" : "Ask AI Coach"}
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {isOpen && (
        <Card className="mt-2 p-4">
          <ScrollArea className="h-64 mb-3" ref={scrollRef}>
            <div className="space-y-3 pr-2">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {language === "ko"
                    ? "이 모듈에 대해 궁금한 점을 질문해보세요."
                    : "Ask any question about this module."}
                </p>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`text-sm p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-primary/10 text-foreground ml-8"
                      : "bg-muted text-foreground mr-8"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mr-8 p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === "ko" ? "생각 중..." : "Thinking..."}
                </div>
              )}
            </div>
          </ScrollArea>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === "ko" ? "질문을 입력하세요..." : "Type your question..."}
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
