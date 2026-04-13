import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.kworship.main',
  appName: 'K-Worship',
  webDir: 'dist',
  server: {
    url: 'https://2ed7309e-d6b0-4f05-9642-be9265249510.lovableproject.com?forceHideBadge=true',
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
