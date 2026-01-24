import { useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useTranslation } from "@/hooks/useTranslation";

const DISMISS_KEY = "push-prompt-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PushNotificationPrompt() {
  const { language } = useTranslation();
  const { isSupported, isSubscribed, subscribePush, isLoading } = usePushNotifications();
  
  const [dismissed, setDismissed] = useState(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (!dismissedAt) return false;
    const dismissTime = parseInt(dismissedAt, 10);
    // Check if 7 days have passed
    return Date.now() - dismissTime < DISMISS_DURATION;
  });

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDismissed(true);
  };

  const handleEnable = async () => {
    try {
      await subscribePush();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  // Don't show if not supported, already subscribed, or dismissed
  if (!isSupported || isSubscribed || dismissed) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardContent className="flex items-center gap-4 py-4 pr-10">
        <div className="flex-shrink-0">
          <div className="rounded-full bg-primary/10 p-2">
            <Bell className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {language === "ko" 
              ? "중요한 알림을 놓치지 마세요!" 
              : "Don't miss important updates!"}
          </p>
          <p className="text-xs text-muted-foreground">
            {language === "ko"
              ? "일정, 새 워십세트, 커뮤니티 소식을 받아보세요"
              : "Get notified about events, new worship sets, and community updates"}
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={handleEnable}
          disabled={isLoading}
        >
          {isLoading 
            ? "..." 
            : language === "ko" 
              ? "알림 켜기" 
              : "Enable"}
        </Button>
      </CardContent>
    </Card>
  );
}
