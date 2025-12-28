import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LockHolder {
  userId: string;
  name: string;
  sessionId: string;
  acquiredAt: string;
  device?: string;
  lastActivity?: string;
  lastSaved?: string;
  expiresAt?: string;
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
  // Callbacks for autosave integration
  onBeforeRelease?: () => Promise<void>;
}

// Configuration
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes lock expiry
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds
const INACTIVITY_WARNING_MS = 5 * 60 * 1000; // 5 minutes before warning
const INACTIVITY_TIMEOUT_MS = 6 * 60 * 1000; // 6 minutes before auto-release
const BACKGROUND_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes when tab in background
const FORCE_TAKEOVER_DELAY_MS = 5 * 1000; // 5 seconds before force takeover
const TAKEOVER_RESPONSE_TIMEOUT_MS = 5 * 1000; // 5 seconds for editor to respond

// Get device info
const getDeviceInfo = (): string => {
  const ua = navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  
  let device = "Desktop";
  if (isTablet) device = "Tablet";
  else if (isMobile) device = "Mobile";
  
  let browser = "Browser";
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edge")) browser = "Edge";
  
  return `${device} · ${browser}`;
};

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

// Edge function URL
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/set-edit-lock-action`;

interface LockActionParams {
  action: 'request_takeover' | 'cancel_takeover' | 'respond_takeover' | 'force_takeover' | 'release_lock' | 'update_last_saved';
  set_id: string;
  session_id: string;
  user_id?: string;
  user_name?: string;
  device?: string;
  accept?: boolean;
}

async function invokeLockAction(params: LockActionParams): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    return await response.json();
  } catch (error) {
    console.error('[EditLock] Edge function error:', error);
    return { success: false, message: 'Network error' };
  }
}

export function useSetEditLock(
  setId: string | undefined,
  options?: { onBeforeRelease?: () => Promise<void> }
): UseSetEditLockResult {
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
  const deviceRef = useRef<string>(getDeviceInfo());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isReleasingRef = useRef(false);
  const forceTakeoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const takeoverCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const responseCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const takeoverResponseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onBeforeReleaseRef = useRef(options?.onBeforeRelease);

  // Keep ref updated
  useEffect(() => {
    onBeforeReleaseRef.current = options?.onBeforeRelease;
  }, [options?.onBeforeRelease]);

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

    // Build lock holder info
    const holderInfo: LockHolder = {
      userId: lock.holder_user_id,
      name: lock.holder_name,
      sessionId: lock.holder_session_id,
      acquiredAt: lock.acquired_at,
      device: lock.holder_device || undefined,
      lastActivity: lock.last_activity_at || undefined,
      lastSaved: lock.last_saved_at || undefined,
      expiresAt: lock.expires_at,
    };

    // Check if it's our lock
    if (lock.holder_session_id === sessionIdRef.current) {
      setLockStatus("locked_by_me");
      setLockHolder(holderInfo);
      
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
      setLockHolder(holderInfo);
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
          // Check if lock is stale (last activity > 30 seconds ago)
          const lastActivity = new Date(existingLock.last_activity_at).getTime();
          const now = Date.now();
          const isStale = now - lastActivity > 30 * 1000;
          
          if (isStale) {
            // Lock appears stale (tab closed, no heartbeat) - attempt auto-takeover
            console.log("[EditLock] Stale lock detected, attempting auto-takeover...");
            
            const forceResult = await invokeLockAction({
              action: 'force_takeover',
              set_id: setId,
              session_id: sessionIdRef.current,
              user_id: user.id,
              user_name: userName,
              device: deviceRef.current,
            });
            
            if (forceResult.success) {
              console.log("[EditLock] Auto-takeover of stale lock successful");
              setLockStatus("locked_by_me");
              setLockHolder({
                userId: user.id,
                name: userName,
                sessionId: sessionIdRef.current,
                acquiredAt: new Date().toISOString(),
                device: deviceRef.current,
              });
              setShowWelcomeMessage(true);
              setIsRequestingTakeover(false);
              setTakeoverCountdown(null);
              toast.success("이전 세션이 종료되어 편집 모드로 전환됩니다.");
              return true;
            }
            // If force takeover failed, fall through to normal failure
            console.log("[EditLock] Auto-takeover failed, showing locked status");
          }
          
          // Lock held by someone else and active
          setLockStatus("locked_by_other");
          setLockHolder({
            userId: existingLock.holder_user_id,
            name: existingLock.holder_name,
            sessionId: existingLock.holder_session_id,
            acquiredAt: existingLock.acquired_at,
            device: existingLock.holder_device || undefined,
            lastActivity: existingLock.last_activity_at || undefined,
            lastSaved: existingLock.last_saved_at || undefined,
            expiresAt: existingLock.expires_at,
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
          holder_device: deviceRef.current,
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
        device: deviceRef.current,
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

  // Release lock with beforeRelease callback
  const releaseLock = useCallback(async () => {
    if (!setId || isReleasingRef.current) return;
    
    isReleasingRef.current = true;
    
    try {
      // Call beforeRelease callback (e.g., forceSave)
      if (onBeforeReleaseRef.current) {
        try {
          await onBeforeReleaseRef.current();
        } catch (err) {
          console.error("[EditLock] onBeforeRelease error:", err);
        }
      }

      // Use edge function for reliable release
      await invokeLockAction({
        action: 'release_lock',
        set_id: setId,
        session_id: sessionIdRef.current,
        user_id: user?.id,
      });

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
  }, [setId, user?.id]);

  // Request takeover using edge function
  const requestTakeover = useCallback(async () => {
    if (!setId || !user || lockStatus !== "locked_by_other") return;
    
    setIsRequestingTakeover(true);
    setTakeoverCountdown(10); // 10 second countdown before force takeover
    
    console.log("[EditLock] Requesting takeover via edge function");
    
    const result = await invokeLockAction({
      action: 'request_takeover',
      set_id: setId,
      session_id: sessionIdRef.current,
      user_id: user.id,
      user_name: userName,
      device: deviceRef.current,
    });

    if (!result.success) {
      console.error("[EditLock] Failed to request takeover:", result.message);
      setIsRequestingTakeover(false);
      setTakeoverCountdown(null);
      toast.error("편집 요청에 실패했습니다.");
      return;
    }

    console.log("[EditLock] Takeover request sent");
    
    // Start countdown to force takeover
    takeoverCountdownIntervalRef.current = setInterval(() => {
      setTakeoverCountdown(prev => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // After 10 seconds, force takeover
    forceTakeoverTimeoutRef.current = setTimeout(async () => {
      console.log("[EditLock] Attempting force takeover...");
      
      const forceResult = await invokeLockAction({
        action: 'force_takeover',
        set_id: setId,
        session_id: sessionIdRef.current,
        user_id: user.id,
        user_name: userName,
        device: deviceRef.current,
      });

      if (takeoverCountdownIntervalRef.current) {
        clearInterval(takeoverCountdownIntervalRef.current);
      }

      if (forceResult.success) {
        console.log("[EditLock] Force takeover successful");
        setLockStatus("locked_by_me");
        setLockHolder({
          userId: user.id,
          name: userName,
          sessionId: sessionIdRef.current,
          acquiredAt: new Date().toISOString(),
          device: deviceRef.current,
        });
        setIsRequestingTakeover(false);
        setTakeoverCountdown(null);
        setShowWelcomeMessage(true);
        toast.success("편집 권한을 가져왔습니다!");
      } else {
        console.log("[EditLock] Force takeover failed:", forceResult.message);
        // Try regular acquire
        const acquired = await acquireLock();
        if (acquired) {
          toast.success("편집 권한을 가져왔습니다!");
        } else {
          toast.error("편집 권한을 가져올 수 없습니다.");
        }
        setIsRequestingTakeover(false);
        setTakeoverCountdown(null);
      }
    }, FORCE_TAKEOVER_DELAY_MS);

  }, [setId, user, userName, lockStatus, acquireLock]);

  // Cancel takeover request
  const cancelTakeoverRequest = useCallback(async () => {
    if (!setId || !user) return;
    
    // Clear timers
    if (forceTakeoverTimeoutRef.current) {
      clearTimeout(forceTakeoverTimeoutRef.current);
    }
    if (takeoverCountdownIntervalRef.current) {
      clearInterval(takeoverCountdownIntervalRef.current);
    }
    
    await invokeLockAction({
      action: 'cancel_takeover',
      set_id: setId,
      session_id: sessionIdRef.current,
      user_id: user.id,
    });

    setIsRequestingTakeover(false);
    setTakeoverCountdown(null);
    
    console.log("[EditLock] Takeover request cancelled");
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
      toast.info("편집 권한을 넘겨주고 있습니다...");
      await releaseLock();
      toast.success("편집 권한이 전달되었습니다.");
    } else {
      // Decline using edge function
      await invokeLockAction({
        action: 'respond_takeover',
        set_id: setId,
        session_id: sessionIdRef.current,
        user_id: user?.id,
        accept: false,
      });
      
      setTakeoverRequester(null);
      setIsTakeoverRequested(false);
      toast.info("편집 요청을 거절했습니다.");
    }
  }, [setId, lockStatus, releaseLock, user?.id]);

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
                if (forceTakeoverTimeoutRef.current) clearTimeout(forceTakeoverTimeoutRef.current);
                if (takeoverCountdownIntervalRef.current) clearInterval(takeoverCountdownIntervalRef.current);
                setIsRequestingTakeover(false);
                setTakeoverCountdown(null);
                
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
            
            // Check if lock holder changed (force takeover happened)
            if (lockStatus === "locked_by_me" && newLock.holder_session_id !== sessionIdRef.current) {
              // Someone took over our lock
              setLockStatus("locked_by_other");
              setLockHolder({
                userId: newLock.holder_user_id,
                name: newLock.holder_name,
                sessionId: newLock.holder_session_id,
                acquiredAt: newLock.acquired_at,
                device: newLock.holder_device || undefined,
                lastActivity: newLock.last_activity_at || undefined,
                lastSaved: newLock.last_saved_at || undefined,
                expiresAt: newLock.expires_at,
              });
              setTakeoverRequester(null);
              setIsTakeoverRequested(false);
              toast.warning("다른 세션에서 편집을 시작했습니다.");
              return;
            }
            
            // Check for takeover request changes (I'm the editor)
            if (newLock.holder_session_id === sessionIdRef.current) {
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
              // Someone else has the lock - update holder info
              setLockStatus("locked_by_other");
              setLockHolder({
                userId: newLock.holder_user_id,
                name: newLock.holder_name,
                sessionId: newLock.holder_session_id,
                acquiredAt: newLock.acquired_at,
                device: newLock.holder_device || undefined,
                lastActivity: newLock.last_activity_at || undefined,
                lastSaved: newLock.last_saved_at || undefined,
                expiresAt: newLock.expires_at,
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
            device: lock.holder_device || undefined,
            lastActivity: lock.last_activity_at || undefined,
            lastSaved: lock.last_saved_at || undefined,
            expiresAt: lock.expires_at,
          });
        }
      }, 100);
    };

    initializeLock();
  }, [setId, user, checkLockStatus, acquireLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timers
      if (forceTakeoverTimeoutRef.current) clearTimeout(forceTakeoverTimeoutRef.current);
      if (takeoverCountdownIntervalRef.current) clearInterval(takeoverCountdownIntervalRef.current);
      if (responseCountdownIntervalRef.current) clearInterval(responseCountdownIntervalRef.current);
      if (takeoverResponseTimeoutRef.current) clearTimeout(takeoverResponseTimeoutRef.current);
    };
  }, []);

  // Handle beforeunload - use sendBeacon with edge function
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lockStatus === "locked_by_me" && setId) {
        // Use sendBeacon for reliable cleanup via edge function
        const payload = JSON.stringify({
          action: 'release_lock',
          set_id: setId,
          session_id: sessionIdRef.current,
          user_id: user?.id,
        });
        navigator.sendBeacon(EDGE_FUNCTION_URL, payload);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [lockStatus, setId, user?.id]);

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
