import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fintrack.production',
  appName: 'FinTrack - Personal Finance Manager',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#1a1a1a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "large",
      spinnerColor: "#10B981",
      splashFullScreen: true,
      splashImmersive: true,
      launchFadeOutDuration: 300
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1a1a1a",
      overlaysWebView: false
    },
    Preferences: {
      group: "FinTrackPrefs"
    },
    App: {
      launchUrl: "https://fintrack.app"
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    backgroundColor: "#1a1a1a"
  }
};

export default config;