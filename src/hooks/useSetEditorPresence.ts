import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface EditorInfo {
  sessionId: string;
  oderId: string;
  userName: string;
  joinedAt: string;
}

interface UseSetEditorPresenceResult {
  otherEditors: EditorInfo[];
  isBlocked: boolean;
  sessionId: string;
}

/**
 * Hook to detect multiple tabs/devices editing the same worship set.
 * Uses Supabase Realtime Presence to track active editors.
 * The later-joined session is blocked to prevent conflicts.
 */
export function useSetEditorPresence(setId: string | undefined): UseSetEditorPresenceResult {
  const { user, profile } = useAuth();
  const [otherEditors, setOtherEditors] = useState<EditorInfo[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const joinedAtRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    if (!setId || !user) {
      setOtherEditors([]);
      setIsBlocked(false);
      return;
    }

    const channelName = `set-editor-presence-${setId}`;
    const channel = supabase.channel(channelName);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const allEditors: EditorInfo[] = [];

        // Flatten presence state
        Object.values(state).forEach((presences) => {
          if (Array.isArray(presences)) {
            presences.forEach((p: any) => {
              if (p.sessionId && p.joinedAt) {
                allEditors.push({
                  sessionId: p.sessionId,
                  oderId: p.oderId || "",
                  userName: p.userName || "Unknown",
                  joinedAt: p.joinedAt,
                });
              }
            });
          }
        });

        // Filter out self
        const others = allEditors.filter(
          (e) => e.sessionId !== sessionIdRef.current
        );
        setOtherEditors(others);

        // Check if this session should be blocked (joined later than any other)
        const myJoinedAt = joinedAtRef.current;
        const shouldBlock = others.some((e) => e.joinedAt < myJoinedAt);
        setIsBlocked(shouldBlock);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            sessionId: sessionIdRef.current,
            oderId: user.id,
            userName: profile?.full_name || user.email || "Unknown",
            joinedAt: joinedAtRef.current,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setId, user, profile]);

  return {
    otherEditors,
    isBlocked,
    sessionId: sessionIdRef.current,
  };
}
