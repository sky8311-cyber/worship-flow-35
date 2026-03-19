import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useTierFeature } from "@/hooks/useTierFeature";
import { Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  courseId: string;
  moduleId: string;
}

export function InstituteAiCoach({ courseId, moduleId }: Props) {
  const { user } = useAuth();
  const { language } = useTranslation();
  const { hasFeature } = useTierFeature();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLocked, setShowLocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canUseCoach = hasFeature("institute_ai_coach");

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setIsOpen(false);
  }, [moduleId]);

  const handleClick = () => {
    if (!canUseCoach) {
      setShowLocked(true);
      return;
    }
    setIsOpen(!isOpen);
  };

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
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/institute-ai-coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ user_id: user.id, course_id: courseId, module_id: moduleId, message: userMessage, conversation_history: messages }),
      });
      if (!resp.ok) throw new Error("Failed");
      const data = await resp.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: language === "ko" ? "죄송합니다. 오류가 발생했습니다." : "Sorry, an error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* AI Coach button */}
      <button
        onClick={handleClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          background: "var(--inst-surface)",
          border: "1px solid var(--inst-gold-bdr)",
          borderRadius: 10,
          padding: "12px 16px",
          boxShadow: "0 2px 10px rgba(184,144,42,0.08)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            background: "linear-gradient(135deg, var(--inst-gold), var(--inst-gold-lt))",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 9,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          AI
        </div>
        <span style={{ fontSize: 12, color: "var(--inst-ink2)", flex: 1 }}>
          {language === "ko" ? "AI 코치에게 질문하기" : "Ask AI Coach"}
        </span>
        <span className="inst-badge-certified" style={{ marginLeft: "auto" }}>
          {language === "ko" ? "정식멤버" : "Full Member"}
        </span>
      </button>

      {/* Locked notice */}
      {showLocked && !canUseCoach && (
        <div
          style={{
            background: "var(--inst-gold-bg)",
            border: "1px solid var(--inst-gold-bdr)",
            borderRadius: 10,
            padding: "12px 16px",
            marginTop: 8,
            fontSize: 12,
            color: "var(--inst-ink2)",
            lineHeight: 1.6,
          }}
        >
          {language === "ko"
            ? "AI 코치는 정식멤버(Full Member) 이상에서 이용 가능합니다."
            : "AI Coach is available for Full Member and above."}
          <button
            onClick={() => navigate("/membership")}
            style={{
              display: "block",
              marginTop: 8,
              fontSize: 11,
              fontWeight: 700,
              color: "var(--inst-gold)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {language === "ko" ? "멤버십 보기 →" : "View Membership →"}
          </button>
        </div>
      )}

      {/* Chat panel */}
      {isOpen && canUseCoach && (
        <div
          style={{
            background: "var(--inst-surface)",
            border: "1px solid var(--inst-border)",
            borderRadius: "0 0 10px 10px",
            marginTop: -1,
            height: 300,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--inst-ink3)", fontSize: 12 }}>
                {language === "ko" ? "이 모듈에 대해 궁금한 점을 질문해보세요." : "Ask any question about this module."}
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.role === "user" ? "inst-chat-user" : "inst-chat-ai"}>
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{msg.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="inst-chat-ai" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{language === "ko" ? "생각 중..." : "Thinking..."}</span>
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            style={{
              display: "flex",
              gap: 8,
              padding: "8px 12px 12px",
              borderTop: "1px solid var(--inst-border)",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === "ko" ? "질문을 입력하세요..." : "Type your question..."}
              disabled={isLoading}
              style={{
                flex: 1,
                background: "var(--inst-surface2)",
                border: "1px solid var(--inst-border)",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                outline: "none",
                color: "var(--inst-ink)",
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                background: "linear-gradient(135deg, var(--inst-gold), var(--inst-gold-lt))",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                opacity: isLoading || !input.trim() ? 0.5 : 1,
                flexShrink: 0,
              }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
