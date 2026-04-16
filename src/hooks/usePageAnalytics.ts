import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isNativePlatform } from "@/utils/platform";

// Generate or retrieve session ID from sessionStorage
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

// Detect device type
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return "mobile";
  return "desktop";
};

export const usePageAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth();
  const currentRecordIdRef = useRef<string | null>(null);
  const enteredAtRef = useRef<Date | null>(null);
  const previousPathRef = useRef<string | null>(null);

  // Record page view (removed last_active_at - handled by AuthContext)
  const recordPageView = useCallback(async () => {
    const sessionId = getSessionId();
    const deviceType = getDeviceType();
    const referrerPath = previousPathRef.current;
    
    try {
      const { data, error } = await supabase
        .from("page_analytics")
        .insert({
          user_id: user?.id || null,
          session_id: sessionId,
          page_path: location.pathname,
          page_title: document.title,
          referrer_path: referrerPath,
          device_type: deviceType,
        })
        .select("id")
        .single();

      if (!error && data) {
        currentRecordIdRef.current = data.id;
        enteredAtRef.current = new Date();
      }
    } catch (err) {
      console.debug("Analytics insert failed:", err);
    }
  }, [location.pathname, user?.id]);

  // Update duration when leaving page
  const updateDuration = useCallback(async () => {
    if (!currentRecordIdRef.current || !enteredAtRef.current) return;

    const durationSeconds = Math.round(
      (new Date().getTime() - enteredAtRef.current.getTime()) / 1000
    );

    try {
      await supabase
        .from("page_analytics")
        .update({
          exited_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq("id", currentRecordIdRef.current);
    } catch (err) {
      console.debug("Analytics update failed:", err);
    }

    currentRecordIdRef.current = null;
    enteredAtRef.current = null;
  }, []);

  // Handle route changes
  useEffect(() => {
    if (previousPathRef.current && previousPathRef.current !== location.pathname) {
      updateDuration();
    }

    recordPageView();
    previousPathRef.current = location.pathname;

    return () => {};
  }, [location.pathname, recordPageView, updateDuration]);

  // Handle page unload only (removed visibility re-record to reduce duplicates)
  useEffect(() => {
    const handleBeforeUnload = () => {
      updateDuration();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        updateDuration();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [updateDuration]);
};
