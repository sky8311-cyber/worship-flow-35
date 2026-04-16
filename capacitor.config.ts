import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.kworship.main',
  appName: 'K-Worship',
  webDir: 'dist',
  server: {
    url: 'https://kworship.app?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK'
    },
    SplashScreen: {
      launchAutoHide: true,
      autoHideDelay: 1500
    }
  }
};

export default config;
