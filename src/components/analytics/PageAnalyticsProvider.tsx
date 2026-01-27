import { usePageAnalytics } from "@/hooks/usePageAnalytics";

/**
 * Component that enables page analytics tracking.
 * Should be placed inside BrowserRouter to access location.
 */
export const PageAnalyticsProvider = () => {
  usePageAnalytics();
  return null;
};
