import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.kworship.main',
  appName: 'K-Worship',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK'
    },
    SplashScreen: {
      launchAutoHide: false,
    }
  }
};

export default config;
