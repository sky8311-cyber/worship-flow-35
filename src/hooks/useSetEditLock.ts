import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LockHolder {
  userId: string;
  name: string;
  sessionId: string;
  acquiredAt: string;
}

interface TakeoverRequester {
  userId: string;
  name: string;
  requestedAt: string;
}

type LockStatus = "unlocked" | "locked_by_me" | "locked_by_other";

export interface UseSetEditLockResult {
  lockStatus: LockStatus;
  lockHolder: LockHolder | null;
  isEditMode: boolean;
  isAcquiring: boolean;
  acquireLock: () => Promise<boolean>;
  releaseLock: () => Promise<void>;
  showWelcomeMessage: boolean;
  dismissWelcomeMessage: () => void;
  inactivityWarning: boolean;
  sessionTimeRemaining: number | null;
  // Takeover flow
  requestTakeover: () => Promise<void>;
  cancelTakeoverRequest: () => Promise<void>;
  respondToTakeover: (accept: boolean) => Promise<void>;
  isRequestingTakeover: boolean;
  takeoverCountdown: number | null;
  takeoverRequester: TakeoverRequester | null;
  isTakeoverRequested: boolean;
  takeoverResponseCountdown: number | null;
}

// Configuration
const LOCK_DURATION_MS = 2 * 60 * 1000; // 2 minutes lock expiry
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds
const INACTIVITY_WARNING_MS = 5 * 60 * 1000; // 5 minutes before warning
const INACTIVITY_TIMEOUT_MS = 6 * 60 * 1000; // 6 minutes before auto-release
const BACKGROUND_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes when tab in background
const TAKEOVER_REQUEST_TIMEOUT_MS = 30 * 1000; // 30 seconds for requester to wait
const TAKEOVER_RESPONSE_TIMEOUT_MS = 10 * 1000; // 10 seconds for editor to respond

// Generate unique session ID per tab
const getSessionId = (): string => {
  const key = "edit-session-id";
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
};

export function useSetEditLock(setId: string | undefined): UseSetEditLockResult {
  const { user, profile } = useAuth();
  const [lockStatus, setLockStatus] = useState<LockStatus>("unlocked");
  const [lockHolder, setLockHolder] = useState<LockHolder | null>(null);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);

  // Takeover states
  const [isRequestingTakeover, setIsRequestingTakeover] = useState(false);
  const [takeoverCountdown, setTakeoverCountdown] = useState<number | null>(null);
  const [takeoverRequester, setTakeoverRequester] = useState<TakeoverRequester | null>(null);
  const [isTakeoverRequested, setIsTakeoverRequested] = useState(false);
  const [takeoverResponseCountdown, setTakeoverResponseCountdown] = useState<number | null>(null);

  const sessionIdRef = useRef<string>(getSessionId());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isReleasingRef = useRef(false);
  const takeoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const takeoverResponseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const takeoverCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const responseCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const userName = profile?.full_name || user?.email || "Unknown";

  // Check current lock status from DB
  const checkLockStatus = useCallback(async () => {
    if (!setId) return;

    const { data: lock, error } = await supabase
      .from("set_edit_locks")
      .select("*")
      .eq("set_id", setId)
      .maybeSingle();

    if (error) {
      console.error("[EditLock] Error checking lock:", error);
      return;
    }

    if (!lock) {
      setLockStatus("unlocked");
      setLockHolder(null);
      setTakeoverRequester(null);
      setIsTakeoverRequested(false);
      return;
    }

    // Check if lock is expired
    const expiresAt = new Date(lock.expires_at).getTime();
    if (expiresAt < Date.now()) {
      // Lock expired, clean it up
      await supabase.from("set_edit_locks").delete().eq("id", lock.id);
      setLockStatus("unlocked");
      setLockHolder(null);
      setTakeoverRequester(null);
      setIsTakeoverRequested(false);
      return;
    }

    // Check if it's our lock
    if (lock.holder_session_id === sessionIdRef.current) {
      setLockStatus("locked_by_me");
      setLockHolder({
        userId: lock.holder_user_id,
        name: lock.holder_name,
        sessionId: lock.holder_session_id,
        acquiredAt: lock.acquired_at,
      });
      
      // Check if someone requested takeover
      if (lock.takeover_requested_by && lock.takeover_requested_by !== user?.id) {
        setTakeoverRequester({
          userId: lock.takeover_requested_by,
          name: lock.takeover_requester_name || "Someone",
          requestedAt: lock.takeover_requested_at || new Date().toISOString(),
        });
        setIsTakeoverRequested(true);
      } else {
        setTakeoverRequester(null);
        setIsTakeoverRequested(false);
      }
    } else {
      setLockStatus("locked_by_other");
      setLockHolder({
        userId: lock.holder_user_id,
        name: lock.holder_name,
        sessionId: lock.holder_session_id,
        acquiredAt: lock.acquired_at,
      });
    }
  }, [setId, user?.id]);

  // Acquire lock
  const acquireLock = useCallback(async (): Promise<boolean> => {
    if (!setId || !user) return false;
    
    setIsAcquiring(true);
    
    try {
      // First check if there's an existing lock
      const { data: existingLock } = await supabase
        .from("set_edit_locks")
        .select("*")
        .eq("set_id", setId)
        .maybeSingle();

      if (existingLock) {
        const expiresAt = new Date(existingLock.expires_at).getTime();
        
        // If it's our session, just update the heartbeat
        if (existingLock.holder_session_id === sessionIdRef.current) {
          await supabase
            .from("set_edit_locks")
            .update({
              expires_at: new Date(Date.now() + LOCK_DURATION_MS).toISOString(),
              last_activity_at: new Date().toISOString(),
            })
            .eq("id", existingLock.id);
          
          setLockStatus("locked_by_me");
          return true;
        }
        
        // If lock is expired, delete it and proceed
        if (expiresAt < Date.now()) {
          await supabase.from("set_edit_locks").delete().eq("id", existingLock.id);
        } else {
          // Lock held by someone else and not expired
          setLockStatus("locked_by_other");
          setLockHolder({
            userId: existingLock.holder_user_id,
            name: existingLock.holder_name,
            sessionId: existingLock.holder_session_id,
            acquiredAt: existingLock.acquired_at,
          });
          return false;
        }
      }

      // Try to insert new lock
      const { error: insertError } = await supabase
        .from("set_edit_locks")
        .insert({
          set_id: setId,
          holder_user_id: user.id,
          holder_session_id: sessionIdRef.current,
          holder_name: userName,
          acquired_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + LOCK_DURATION_MS).toISOString(),
          last_activity_at: new Date().toISOString(),
        });

      if (insertError) {
        // Conflict - someone else got the lock
        console.log("[EditLock] Failed to acquire lock:", insertError);
        await checkLockStatus();
        return false;
      }

      setLockStatus("locked_by_me");
      setLockHolder({
        userId: user.id,
        name: userName,
        sessionId: sessionIdRef.current,
        acquiredAt: new Date().toISOString(),
      });
      
      // Show welcome message for first-time entry
      setShowWelcomeMessage(true);
      
      // Reset takeover states
      setIsRequestingTakeover(false);
      setTakeoverCountdown(null);
      
      console.log("[EditLock] Lock acquired successfully");
      return true;
    } catch (error) {
      console.error("[EditLock] Error acquiring lock:", error);
      return false;
    } finally {
      setIsAcquiring(false);
    }
  }, [setId, user, userName, checkLockStatus]);

  // Release lock
  const releaseLock = useCallback(async () => {
    if (!setId || isReleasingRef.current) return;
    
    isReleasingRef.current = true;
    
    try {
      await supabase
        .from("set_edit_locks")
        .delete()
        .eq("set_id", setId)
        .eq("holder_session_id", sessionIdRef.current);

      setLockStatus("unlocked");
      setLockHolder(null);
      setTakeoverRequester(null);
      setIsTakeoverRequested(false);
      console.log("[EditLock] Lock released");
    } catch (error) {
      console.error("[EditLock] Error releasing lock:", error);
    } finally {
      isReleasingRef.current = false;
    }
  }, [setId]);

  // Request takeover from current editor
  const requestTakeover = useCallback(async () => {
    if (!setId || !user || lockStatus !== "locked_by_other") return;
    
    setIsRequestingTakeover(true);
    setTakeoverCountdown(30);
    
    try {
      // Update the lock with takeover request
      const { error } = await supabase
        .from("set_edit_locks")
        .update({
          takeover_requested_by: user.id,
          takeover_requested_at: new Date().toISOString(),
          takeover_requester_name: userName,
        })
        .eq("set_id", setId);

      if (error) {
        console.error("[EditLock] Failed to request takeover:", error);
        setIsRequestingTakeover(false);
        setTakeoverCountdown(null);
        toast.error("편집 요청에 실패했습니다.");
        return;
      }

      console.log("[EditLock] Takeover requested");
      
      // Start countdown for requester
      takeoverCountdownIntervalRef.current = setInterval(() => {
        setTakeoverCountdown(prev => {
          if (prev === null || prev <= 1) {
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      // Set timeout - if no response, cancel request
      takeoverTimeoutRef.current = setTimeout(async () => {
        // Check if lock is still held by others
        const { data: lock } = await supabase
          .from("set_edit_locks")
          .select("holder_session_id, takeover_requested_by")
          .eq("set_id", setId)
          .maybeSingle();

        if (lock && lock.holder_session_id !== sessionIdRef.current && lock.takeover_requested_by === user.id) {
          // Still waiting, timeout - clear request
          await supabase
            .from("set_edit_locks")
            .update({
              takeover_requested_by: null,
              takeover_requested_at: null,
              takeover_requester_name: null,
            })
            .eq("set_id", setId);
          
          toast.error("편집자가 응답하지 않습니다. 나중에 다시 시도하세요.");
        }
        
        setIsRequestingTakeover(false);
        setTakeoverCountdown(null);
        if (takeoverCountdownIntervalRef.current) {
          clearInterval(takeoverCountdownIntervalRef.current);
        }
      }, TAKEOVER_REQUEST_TIMEOUT_MS);

    } catch (error) {
      console.error("[EditLock] Error requesting takeover:", error);
      setIsRequestingTakeover(false);
      setTakeoverCountdown(null);
    }
  }, [setId, user, userName, lockStatus]);

  // Cancel takeover request
  const cancelTakeoverRequest = useCallback(async () => {
    if (!setId || !user) return;
    
    try {
      await supabase
        .from("set_edit_locks")
        .update({
          takeover_requested_by: null,
          takeover_requested_at: null,
          takeover_requester_name: null,
        })
        .eq("set_id", setId)
        .eq("takeover_requested_by", user.id);

      setIsRequestingTakeover(false);
      setTakeoverCountdown(null);
      
      if (takeoverTimeoutRef.current) {
        clearTimeout(takeoverTimeoutRef.current);
      }
      if (takeoverCountdownIntervalRef.current) {
        clearInterval(takeoverCountdownIntervalRef.current);
      }
      
      console.log("[EditLock] Takeover request cancelled");
    } catch (error) {
      console.error("[EditLock] Error cancelling takeover request:", error);
    }
  }, [setId, user]);

  // Respond to takeover request (as current editor)
  const respondToTakeover = useCallback(async (accept: boolean) => {
    if (!setId || lockStatus !== "locked_by_me") return;
    
    // Clear response countdown
    if (responseCountdownIntervalRef.current) {
      clearInterval(responseCountdownIntervalRef.current);
    }
    if (takeoverResponseTimeoutRef.current) {
      clearTimeout(takeoverResponseTimeoutRef.current);
    }
    setTakeoverResponseCountdown(null);
    
    if (accept) {
      // Hand over - release lock
      toast.info("편집 권한을 넘겨주고 있습니다...");
      await releaseLock();
      toast.success("편집 권한이 전달되었습니다.");
    } else {
      // Decline - clear takeover request
      try {
        await supabase
          .from("set_edit_locks")
          .update({
            takeover_requested_by: null,
            takeover_requested_at: null,
            takeover_requester_name: null,
          })
          .eq("set_id", setId)
          .eq("holder_session_id", sessionIdRef.current);
        
        setTakeoverRequester(null);
        setIsTakeoverRequested(false);
        toast.info("편집 요청을 거절했습니다.");
      } catch (error) {
        console.error("[EditLock] Error declining takeover:", error);
      }
    }
  }, [setId, lockStatus, releaseLock]);

  // Send heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!setId || lockStatus !== "locked_by_me") return;

    const { error } = await supabase
      .from("set_edit_locks")
      .update({
        expires_at: new Date(Date.now() + LOCK_DURATION_MS).toISOString(),
        last_activity_at: new Date(lastActivityRef.current).toISOString(),
      })
      .eq("set_id", setId)
      .eq("holder_session_id", sessionIdRef.current);

    if (error) {
      console.error("[EditLock] Heartbeat failed:", error);
      // Lost the lock somehow
      await checkLockStatus();
    }
  }, [setId, lockStatus, checkLockStatus]);

  // Reset activity timer
  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setInactivityWarning(false);
    setSessionTimeRemaining(null);

    // Clear existing timers
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set warning timer (5 min)
    warningTimerRef.current = setTimeout(() => {
      if (lockStatus === "locked_by_me") {
        setInactivityWarning(true);
        setSessionTimeRemaining(60); // 1 minute countdown
        
        // Start countdown
        const countdownInterval = setInterval(() => {
          setSessionTimeRemaining(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
        
        toast.warning("비활성 상태로 세션이 곧 종료됩니다. 계속하려면 아무 곳이나 클릭하세요.", {
          duration: 10000,
        });
      }
    }, INACTIVITY_WARNING_MS);

    // Set auto-release timer (6 min)
    inactivityTimerRef.current = setTimeout(async () => {
      if (lockStatus === "locked_by_me") {
        toast.info("비활성으로 인해 편집 세션이 종료되었습니다. 변경사항이 저장되었습니다.");
        await releaseLock();
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, [lockStatus, releaseLock]);

  // Handle visibility change (tab background)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "hidden" && lockStatus === "locked_by_me") {
      // Tab went to background, start shorter timer
      backgroundTimerRef.current = setTimeout(async () => {
        toast.info("백그라운드에서 편집 세션이 종료되었습니다.");
        await releaseLock();
      }, BACKGROUND_TIMEOUT_MS);
    } else if (document.visibilityState === "visible") {
      // Tab returned, clear background timer
      if (backgroundTimerRef.current) {
        clearTimeout(backgroundTimerRef.current);
        backgroundTimerRef.current = null;
      }
      // Reset activity on return
      resetActivityTimer();
    }
  }, [lockStatus, releaseLock, resetActivityTimer]);

  // Activity event listeners
  useEffect(() => {
    if (lockStatus !== "locked_by_me") return;

    const activityEvents = ["mousemove", "keypress", "touchstart", "scroll", "click"];
    
    const handleActivity = () => {
      resetActivityTimer();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    resetActivityTimer();

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [lockStatus, resetActivityTimer]);

  // Visibility change listener
  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (backgroundTimerRef.current) clearTimeout(backgroundTimerRef.current);
    };
  }, [handleVisibilityChange]);

  // Heartbeat interval
  useEffect(() => {
    if (lockStatus === "locked_by_me") {
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    } else {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [lockStatus, sendHeartbeat]);

  // Handle takeover request when I'm the editor
  useEffect(() => {
    if (!isTakeoverRequested || lockStatus !== "locked_by_me") return;
    
    console.log("[EditLock] Takeover request detected, starting response countdown");
    setTakeoverResponseCountdown(10);
    
    // Start countdown
    responseCountdownIntervalRef.current = setInterval(() => {
      setTakeoverResponseCountdown(prev => {
        if (prev === null || prev <= 1) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Auto-handover after timeout
    takeoverResponseTimeoutRef.current = setTimeout(async () => {
      if (isTakeoverRequested && lockStatus === "locked_by_me") {
        toast.info("편집 요청에 응답하지 않아 자동으로 넘겨줍니다.");
        await releaseLock();
      }
    }, TAKEOVER_RESPONSE_TIMEOUT_MS);
    
    return () => {
      if (responseCountdownIntervalRef.current) {
        clearInterval(responseCountdownIntervalRef.current);
      }
      if (takeoverResponseTimeoutRef.current) {
        clearTimeout(takeoverResponseTimeoutRef.current);
      }
    };
  }, [isTakeoverRequested, lockStatus, releaseLock]);

  // Realtime subscription for lock changes
  useEffect(() => {
    if (!setId) return;

    const channel = supabase
      .channel(`set-lock-${setId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "set_edit_locks",
          filter: `set_id=eq.${setId}`,
        },
        async (payload) => {
          console.log("[EditLock] Realtime event:", payload.eventType, payload);
          
          if (payload.eventType === "DELETE") {
            // Lock was released
            if (lockStatus === "locked_by_other") {
              setLockStatus("unlocked");
              setLockHolder(null);
              
              // If I was requesting takeover, try to acquire immediately
              if (isRequestingTakeover) {
                setIsRequestingTakeover(false);
                setTakeoverCountdown(null);
                if (takeoverTimeoutRef.current) clearTimeout(takeoverTimeoutRef.current);
                if (takeoverCountdownIntervalRef.current) clearInterval(takeoverCountdownIntervalRef.current);
                
                const acquired = await acquireLock();
                if (acquired) {
                  toast.success("편집 권한을 받았습니다!");
                }
              } else {
                toast.info("편집 세션이 종료되었습니다. 이제 편집할 수 있습니다.");
              }
            }
          } else if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newLock = payload.new as any;
            
            // Check for takeover request changes
            if (newLock.holder_session_id === sessionIdRef.current) {
              // I'm the editor - check if someone requested takeover
              if (newLock.takeover_requested_by && newLock.takeover_requested_by !== user?.id) {
                setTakeoverRequester({
                  userId: newLock.takeover_requested_by,
                  name: newLock.takeover_requester_name || "Someone",
                  requestedAt: newLock.takeover_requested_at || new Date().toISOString(),
                });
                setIsTakeoverRequested(true);
              } else if (!newLock.takeover_requested_by) {
                // Takeover request was cleared
                setTakeoverRequester(null);
                setIsTakeoverRequested(false);
                setTakeoverResponseCountdown(null);
              }
            } else {
              // Someone else has the lock
              if (lockStatus === "locked_by_me") {
                // Our lock was taken over (shouldn't happen normally)
                setLockStatus("locked_by_other");
                toast.warning("다른 세션에서 편집을 시작했습니다.");
              }
              setLockHolder({
                userId: newLock.holder_user_id,
                name: newLock.holder_name,
                sessionId: newLock.holder_session_id,
                acquiredAt: newLock.acquired_at,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setId, lockStatus, user?.id, isRequestingTakeover, acquireLock]);

  // Smart entry: Auto-acquire lock on mount if unlocked
  useEffect(() => {
    if (!setId || !user) return;

    const initializeLock = async () => {
      await checkLockStatus();
      
      // Small delay to get accurate lock status
      setTimeout(async () => {
        const { data: lock } = await supabase
          .from("set_edit_locks")
          .select("*")
          .eq("set_id", setId)
          .maybeSingle();

        if (!lock || new Date(lock.expires_at).getTime() < Date.now()) {
          // No lock or expired, auto-acquire
          const acquired = await acquireLock();
          if (acquired) {
            console.log("[EditLock] Auto-acquired lock on entry");
          }
        } else if (lock.holder_session_id === sessionIdRef.current) {
          // Our own lock from another component/render
          setLockStatus("locked_by_me");
        } else {
          // Someone else has the lock
          setLockStatus("locked_by_other");
          setLockHolder({
            userId: lock.holder_user_id,
            name: lock.holder_name,
            sessionId: lock.holder_session_id,
            acquiredAt: lock.acquired_at,
          });
        }
      }, 100);
    };

    initializeLock();
  }, [setId, user, checkLockStatus, acquireLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lockStatus === "locked_by_me" && setId) {
        // Release lock on unmount
        supabase
          .from("set_edit_locks")
          .delete()
          .eq("set_id", setId)
          .eq("holder_session_id", sessionIdRef.current);
      }
      
      // Clear all timers
      if (takeoverTimeoutRef.current) clearTimeout(takeoverTimeoutRef.current);
      if (takeoverCountdownIntervalRef.current) clearInterval(takeoverCountdownIntervalRef.current);
      if (responseCountdownIntervalRef.current) clearInterval(responseCountdownIntervalRef.current);
      if (takeoverResponseTimeoutRef.current) clearTimeout(takeoverResponseTimeoutRef.current);
    };
  }, [lockStatus, setId]);

  // Handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lockStatus === "locked_by_me" && setId) {
        // Use sendBeacon for reliable cleanup
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/set_edit_locks?set_id=eq.${setId}&holder_session_id=eq.${sessionIdRef.current}`;
        navigator.sendBeacon(url, "");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [lockStatus, setId]);

  const dismissWelcomeMessage = useCallback(() => {
    setShowWelcomeMessage(false);
  }, []);

  return {
    lockStatus,
    lockHolder,
    isEditMode: lockStatus === "locked_by_me",
    isAcquiring,
    acquireLock,
    releaseLock,
    showWelcomeMessage,
    dismissWelcomeMessage,
    inactivityWarning,
    sessionTimeRemaining,
    // Takeover flow
    requestTakeover,
    cancelTakeoverRequest,
    respondToTakeover,
    isRequestingTakeover,
    takeoverCountdown,
    takeoverRequester,
    isTakeoverRequested,
    takeoverResponseCountdown,
  };
}
