import { useEffect, useState, useRef, useCallback } from "react";

interface UseLocalTabLockResult {
  isLocked: boolean;
  lockHolder: string | null;
  myTabId: string;
}

const HEARTBEAT_INTERVAL = 2000; // 2 seconds
const LOCK_EXPIRY_TIME = 5000; // 5 seconds - if no heartbeat, consider lock expired

/**
 * Local tab lock using BroadcastChannel for same-browser multi-tab detection.
 * This is more reliable than Supabase Presence for same-browser scenarios.
 */
export function useLocalTabLock(setId: string | undefined): UseLocalTabLockResult {
  const [isLocked, setIsLocked] = useState(false);
  const [lockHolder, setLockHolder] = useState<string | null>(null);
  const myTabIdRef = useRef<string>("");
  const channelRef = useRef<BroadcastChannel | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lockCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lockDataRef = useRef<{ tabId: string; timestamp: number } | null>(null);
  const hasAcquiredLockRef = useRef(false);

  // Generate unique tab ID on mount
  useEffect(() => {
    const key = `tab-id-${setId || "new"}`;
    let tabId = sessionStorage.getItem(key);
    if (!tabId) {
      tabId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(key, tabId);
    }
    myTabIdRef.current = tabId;
  }, [setId]);

  const acquireLock = useCallback(() => {
    if (!setId || !myTabIdRef.current) return;
    
    const lockKey = `set-lock:${setId}`;
    const now = Date.now();
    const existingLock = localStorage.getItem(lockKey);
    
    if (existingLock) {
      try {
        const parsed = JSON.parse(existingLock);
        // Check if lock is still valid (within expiry time)
        if (parsed.tabId !== myTabIdRef.current && now - parsed.timestamp < LOCK_EXPIRY_TIME) {
          // Another tab holds the lock
          setIsLocked(true);
          setLockHolder(parsed.tabId);
          lockDataRef.current = parsed;
          hasAcquiredLockRef.current = false;
          console.log("[LocalTabLock] Blocked by another tab:", parsed.tabId);
          return false;
        }
      } catch (e) {
        // Invalid lock data, we can acquire
      }
    }
    
    // Acquire the lock
    const lockData = { tabId: myTabIdRef.current, timestamp: now };
    localStorage.setItem(lockKey, JSON.stringify(lockData));
    lockDataRef.current = lockData;
    hasAcquiredLockRef.current = true;
    setIsLocked(false);
    setLockHolder(null);
    
    // Broadcast to other tabs
    channelRef.current?.postMessage({ type: "lock-acquired", ...lockData });
    console.log("[LocalTabLock] Lock acquired by:", myTabIdRef.current);
    return true;
  }, [setId]);

  const releaseLock = useCallback(() => {
    if (!setId || !myTabIdRef.current) return;
    
    const lockKey = `set-lock:${setId}`;
    const existingLock = localStorage.getItem(lockKey);
    
    if (existingLock) {
      try {
        const parsed = JSON.parse(existingLock);
        if (parsed.tabId === myTabIdRef.current) {
          localStorage.removeItem(lockKey);
          channelRef.current?.postMessage({ type: "lock-released", tabId: myTabIdRef.current });
          console.log("[LocalTabLock] Lock released by:", myTabIdRef.current);
        }
      } catch (e) {
        // Ignore
      }
    }
    hasAcquiredLockRef.current = false;
  }, [setId]);

  const sendHeartbeat = useCallback(() => {
    if (!setId || !myTabIdRef.current || !hasAcquiredLockRef.current) return;
    
    const lockKey = `set-lock:${setId}`;
    const now = Date.now();
    const lockData = { tabId: myTabIdRef.current, timestamp: now };
    localStorage.setItem(lockKey, JSON.stringify(lockData));
    lockDataRef.current = lockData;
    
    // Broadcast heartbeat
    channelRef.current?.postMessage({ type: "heartbeat", ...lockData });
  }, [setId]);

  const checkLockStatus = useCallback(() => {
    if (!setId || !myTabIdRef.current) return;
    
    const lockKey = `set-lock:${setId}`;
    const existingLock = localStorage.getItem(lockKey);
    const now = Date.now();
    
    if (existingLock) {
      try {
        const parsed = JSON.parse(existingLock);
        
        if (parsed.tabId === myTabIdRef.current) {
          // We hold the lock
          setIsLocked(false);
          setLockHolder(null);
          return;
        }
        
        // Another tab holds the lock - check if it's still valid
        if (now - parsed.timestamp < LOCK_EXPIRY_TIME) {
          setIsLocked(true);
          setLockHolder(parsed.tabId);
          lockDataRef.current = parsed;
          hasAcquiredLockRef.current = false;
        } else {
          // Lock expired, try to acquire
          console.log("[LocalTabLock] Lock expired, attempting to acquire");
          acquireLock();
        }
      } catch (e) {
        // Invalid lock data
        acquireLock();
      }
    } else {
      // No lock exists, try to acquire
      acquireLock();
    }
  }, [setId, acquireLock]);

  useEffect(() => {
    if (!setId) {
      setIsLocked(false);
      setLockHolder(null);
      return;
    }

    // Ensure tab ID is set
    const key = `tab-id-${setId}`;
    let tabId = sessionStorage.getItem(key);
    if (!tabId) {
      tabId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(key, tabId);
    }
    myTabIdRef.current = tabId;

    // Create BroadcastChannel for cross-tab communication
    const channelName = `set-lock-channel:${setId}`;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    // Handle messages from other tabs
    channel.onmessage = (event) => {
      const { type, tabId: senderTabId, timestamp } = event.data;
      
      if (senderTabId === myTabIdRef.current) return; // Ignore own messages
      
      console.log("[LocalTabLock] Received message:", type, "from:", senderTabId);
      
      if (type === "lock-acquired" || type === "heartbeat") {
        // Another tab acquired or refreshed the lock
        setIsLocked(true);
        setLockHolder(senderTabId);
        lockDataRef.current = { tabId: senderTabId, timestamp };
        hasAcquiredLockRef.current = false;
      } else if (type === "lock-released") {
        // Another tab released the lock, try to acquire
        setTimeout(() => acquireLock(), 100);
      } else if (type === "lock-request") {
        // Another tab is requesting lock info
        if (hasAcquiredLockRef.current) {
          channel.postMessage({ 
            type: "lock-response", 
            tabId: myTabIdRef.current, 
            timestamp: Date.now() 
          });
        }
      } else if (type === "lock-response") {
        // Response from lock holder
        setIsLocked(true);
        setLockHolder(senderTabId);
        lockDataRef.current = { tabId: senderTabId, timestamp };
        hasAcquiredLockRef.current = false;
      }
    };

    // Request lock info from other tabs first
    channel.postMessage({ type: "lock-request", tabId: myTabIdRef.current });

    // Try to acquire lock after short delay (to let other tabs respond)
    const acquireTimeout = setTimeout(() => {
      acquireLock();
    }, 300);

    // Start heartbeat if we hold the lock
    heartbeatIntervalRef.current = setInterval(() => {
      if (hasAcquiredLockRef.current) {
        sendHeartbeat();
      }
    }, HEARTBEAT_INTERVAL);

    // Periodically check lock status
    lockCheckIntervalRef.current = setInterval(checkLockStatus, HEARTBEAT_INTERVAL);

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkLockStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Handle storage events (for cross-tab sync without BroadcastChannel)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `set-lock:${setId}`) {
        checkLockStatus();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Cleanup
    return () => {
      clearTimeout(acquireTimeout);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (lockCheckIntervalRef.current) {
        clearInterval(lockCheckIntervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
      releaseLock();
      channel.close();
      channelRef.current = null;
    };
  }, [setId, acquireLock, releaseLock, sendHeartbeat, checkLockStatus]);

  return {
    isLocked,
    lockHolder,
    myTabId: myTabIdRef.current,
  };
}
