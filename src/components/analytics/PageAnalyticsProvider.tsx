import { useEffect, useState } from "react";
import { isNativePlatform } from "@/utils/platform";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";

const ActiveAnalytics = () => {
  usePageAnalytics();
  return null;
};

/**
 * Component that enables page analytics tracking.
 * On native, defers mounting by 5 seconds to keep startup fast.
 */
export const PageAnalyticsProvider = () => {
  const [ready, setReady] = useState(!isNativePlatform());

  useEffect(() => {
    if (ready) return;
    const id = setTimeout(() => setReady(true), 5000);
    return () => clearTimeout(id);
  }, [ready]);

  if (!ready) return null;
  return <ActiveAnalytics />;
};
