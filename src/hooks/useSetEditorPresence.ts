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
    if (!setId || !user) {
      console.log("[Presence] No setId or user, skipping presence setup");
      setOtherEditors([]);
      setIsBlocked(false);
      return;
    }

    // Initialize session ID for this set
    sessionIdRef.current = getSessionId(setId);
    const userName = profile?.full_name || user.email || "Unknown";

    console.log("[Presence] Setting up presence for set:", setId, "sessionId:", sessionIdRef.current);

    const channelName = `set-editor-presence-${setId}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    const processPresenceState = () => {
      const state = channel.presenceState();
      console.log("[Presence] Raw state:", JSON.stringify(state, null, 2));
      
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

      console.log("[Presence] All editors:", allEditors);
      console.log("[Presence] My sessionId:", sessionIdRef.current);

      // Filter out self
      const others = allEditors.filter(
        (e) => e.sessionId !== sessionIdRef.current
      );
      setOtherEditors(others);

      // Check if this session should be blocked (joined later than any other)
      const myJoinedAt = joinedAtRef.current;
      const shouldBlock = others.some((e) => e.joinedAt < myJoinedAt);
      
      console.log("[Presence] Other editors:", others.length, "isBlocked:", shouldBlock);
      setIsBlocked(shouldBlock);
    };

    channel
      .on("presence", { event: "sync" }, () => {
        console.log("[Presence] Sync event received");
        processPresenceState();
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("[Presence] Join event:", key, newPresences);
        processPresenceState();
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("[Presence] Leave event:", key, leftPresences);
        processPresenceState();
      })
      .subscribe(async (status) => {
        console.log("[Presence] Subscription status:", status);
        if (status === "SUBSCRIBED") {
          const trackData = {
            sessionId: sessionIdRef.current,
            oderId: user.id,
            userName: userName,
            joinedAt: joinedAtRef.current,
          };
          console.log("[Presence] Tracking:", trackData);
          const result = await channel.track(trackData);
          console.log("[Presence] Track result:", result);
        }
      });

    return () => {
      console.log("[Presence] Cleaning up channel:", channelName);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [setId, user?.id]); // Removed profile from dependencies to prevent re-subscription

  return {
    otherEditors,
    isBlocked,
    sessionId: sessionIdRef.current,
  };
}
