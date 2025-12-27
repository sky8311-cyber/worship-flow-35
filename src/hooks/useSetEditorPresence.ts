import { useEffect, useState, useRef } from "react";
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

// Get or create a persistent session ID for this tab
const getSessionId = (setId: string): string => {
  const key = `editor-session-${setId}`;
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
};

/**
 * Hook to detect multiple tabs/devices editing the same worship set.
 * Uses Supabase Realtime Presence to track active editors.
 * The later-joined session is blocked to prevent conflicts.
 */
export function useSetEditorPresence(setId: string | undefined): UseSetEditorPresenceResult {
  const { user, profile } = useAuth();
  const [otherEditors, setOtherEditors] = useState<EditorInfo[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const sessionIdRef = useRef<string>("");
  const joinedAtRef = useRef<string>(new Date().toISOString());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Always log when useEffect triggers for debugging
    console.log("[Presence] useEffect triggered - setId:", setId, "user:", !!user, "userId:", user?.id);

    if (!setId) {
      console.log("[Presence] No setId, skipping presence setup");
      setOtherEditors([]);
      setIsBlocked(false);
      return;
    }

    if (!user) {
      console.log("[Presence] Waiting for user to load...");
      setOtherEditors([]);
      setIsBlocked(false);
      return;
    }

    // Initialize session ID for this set
    sessionIdRef.current = getSessionId(setId);
    joinedAtRef.current = new Date().toISOString();
    const userName = profile?.full_name || user.email || "Unknown";

    console.log("[Presence] Setting up presence channel for set:", setId);
    console.log("[Presence] My sessionId:", sessionIdRef.current);
    console.log("[Presence] My joinedAt:", joinedAtRef.current);

    const channelName = `set-editor-presence-${setId}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    const processPresenceState = () => {
      const state = channel.presenceState();
      console.log("[Presence] Raw presence state:", JSON.stringify(state, null, 2));
      
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

      console.log("[Presence] All editors found:", allEditors.length, allEditors);

      // Filter out self
      const others = allEditors.filter(
        (e) => e.sessionId !== sessionIdRef.current
      );
      
      console.log("[Presence] Other editors (excluding self):", others.length, others);

      // Check if this session should be blocked (joined later than any other)
      const myJoinedAt = joinedAtRef.current;
      const shouldBlock = others.some((e) => {
        const isEarlier = e.joinedAt < myJoinedAt;
        console.log("[Presence] Comparing joinedAt - other:", e.joinedAt, "mine:", myJoinedAt, "blocked:", isEarlier);
        return isEarlier;
      });
      
      console.log("[Presence] Final state - otherEditors:", others.length, "isBlocked:", shouldBlock);
      
      setOtherEditors(others);
      setIsBlocked(shouldBlock);
    };

    channel
      .on("presence", { event: "sync" }, () => {
        console.log("[Presence] ===== SYNC EVENT =====");
        processPresenceState();
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("[Presence] ===== JOIN EVENT =====", key, newPresences);
        processPresenceState();
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("[Presence] ===== LEAVE EVENT =====", key, leftPresences);
        processPresenceState();
      })
      .subscribe(async (status) => {
        console.log("[Presence] Channel subscription status:", status);
        if (status === "SUBSCRIBED") {
          const trackData = {
            sessionId: sessionIdRef.current,
            oderId: user.id,
            userName: userName,
            joinedAt: joinedAtRef.current,
          };
          console.log("[Presence] Tracking presence with data:", trackData);
          const result = await channel.track(trackData);
          console.log("[Presence] Track result:", result);
        } else if (status === "CHANNEL_ERROR") {
          console.error("[Presence] Channel error occurred");
        } else if (status === "TIMED_OUT") {
          console.error("[Presence] Channel subscription timed out");
        }
      });

    return () => {
      console.log("[Presence] Cleaning up channel:", channelName);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [setId, user]); // Include full user object to re-run when user loads

  return {
    otherEditors,
    isBlocked,
    sessionId: sessionIdRef.current,
  };
}
