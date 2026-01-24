import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

// Convert VAPID key to Uint8Array for subscription
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Fetch VAPID public key from edge function
async function fetchVapidPublicKey(): Promise<string> {
  const { data, error } = await supabase.functions.invoke("get-vapid-key");
  if (error) throw error;
  if (!data?.publicKey) throw new Error("VAPID key not available");
  return data.publicKey;
}

export interface PushPreferences {
  event_reminder: boolean;
  new_worship_set: boolean;
  community_post: boolean;
  chat_message: boolean;
}

const defaultPreferences: PushPreferences = {
  event_reminder: true,
  new_worship_set: true,
  community_post: true,
  chat_message: true,
};

export function usePushNotifications() {
  const { user } = useAuth();
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [isRegistering, setIsRegistering] = useState(false);

  // Check if push notifications are supported
  const isSupported = typeof window !== "undefined" && 
    "serviceWorker" in navigator && 
    "PushManager" in window &&
    "Notification" in window;

  // Get current permission status
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : "denied"
  );

  // Query current subscription status
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["push-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data && data.length > 0 ? data : null;
    },
    enabled: !!user && isSupported,
  });

  const isSubscribed = !!subscriptionData && subscriptionData.length > 0;

  // Query notification preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ["push-preferences", user?.id],
    queryFn: async () => {
      if (!user) return defaultPreferences;
      const { data, error } = await supabase
        .from("push_notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data || defaultPreferences;
    },
    enabled: !!user,
  });

  // Subscribe to push notifications
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      setIsRegistering(true);

      // Fetch VAPID public key from edge function
      const vapidPublicKey = await fetchVapidPublicKey();

      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        throw new Error(language === "ko" ? "알림 권한이 거부되었습니다" : "Notification permission denied");
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subscriptionJson = pushSubscription.toJSON();

      // Save to database
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) throw error;

      // Create default preferences if not exist
      const { error: prefError } = await supabase
        .from("push_notification_preferences")
        .upsert(
          {
            user_id: user.id,
            ...defaultPreferences,
          },
          { onConflict: "user_id" }
        );

      if (prefError) throw prefError;

      return true;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "푸시 알림이 활성화되었습니다" : "Push notifications enabled");
      queryClient.invalidateQueries({ queryKey: ["push-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["push-preferences"] });
    },
    onError: (error: Error) => {
      console.error("Push subscription error:", error);
      toast.error(error.message);
    },
    onSettled: () => {
      setIsRegistering(false);
    },
  });

  // Unsubscribe from push notifications
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Get current service worker registration
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      // Unsubscribe from push
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from database
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      return true;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "푸시 알림이 비활성화되었습니다" : "Push notifications disabled");
      queryClient.invalidateQueries({ queryKey: ["push-subscription"] });
    },
    onError: (error: Error) => {
      console.error("Push unsubscribe error:", error);
      toast.error(error.message);
    },
  });

  // Update notification preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<PushPreferences>) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("push_notification_preferences")
        .upsert(
          {
            user_id: user.id,
            ...preferences,
            ...newPreferences,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;
      return newPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-preferences"] });
      toast.success(language === "ko" ? "알림 설정이 저장되었습니다" : "Notification settings saved");
    },
    onError: (error: Error) => {
      console.error("Preferences update error:", error);
      toast.error(error.message);
    },
  });

  // Toggle push notifications
  const togglePush = useCallback(async () => {
    if (isSubscribed) {
      await unsubscribeMutation.mutateAsync();
    } else {
      await subscribeMutation.mutateAsync();
    }
  }, [isSubscribed, subscribeMutation, unsubscribeMutation]);

  // Update single preference
  const updatePreference = useCallback(
    (key: keyof PushPreferences, value: boolean) => {
      updatePreferencesMutation.mutate({ [key]: value });
    },
    [updatePreferencesMutation]
  );

  return {
    isSupported,
    isSubscribed,
    isLoading: subscriptionLoading || preferencesLoading || isRegistering,
    permission,
    preferences: preferences || defaultPreferences,
    subscribePush: subscribeMutation.mutateAsync,
    unsubscribePush: unsubscribeMutation.mutateAsync,
    togglePush,
    updatePreference,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
  };
}
