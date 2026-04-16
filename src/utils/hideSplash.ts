let hidden = false;

/**
 * Hide the native splash screen (safe to call multiple times — only hides once).
 */
export function hideSplashScreen() {
  if (hidden) return;
  hidden = true;

  import("@capacitor/core")
    .then(({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return;
      return import("@capacitor/splash-screen").then(({ SplashScreen }) => {
        requestAnimationFrame(() => {
          SplashScreen.hide().catch(() => undefined);
        });
      });
    })
    .catch(() => undefined);
}
