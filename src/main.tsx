import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root")!);

// Standalone YouTube bridge — renders BEFORE the full app shell
if (window.location.pathname === "/youtube-embed") {
  import("./components/YouTubeBridgePage").then(({ default: YouTubeBridgePage }) => {
    root.render(<YouTubeBridgePage />);
  });
} else {
  import("./App").then(({ default: App }) => {
    import("./index.css");
    root.render(<App />);
  });

  // Hide splash screen on native after app mounts
  import("@capacitor/core").then(({ Capacitor }) => {
    if (Capacitor.isNativePlatform()) {
      import("@capacitor/splash-screen").then(({ SplashScreen }) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            SplashScreen.hide().catch(() => undefined);
          });
        });
      });
    }
  }).catch(() => undefined);
}
