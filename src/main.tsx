import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

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
