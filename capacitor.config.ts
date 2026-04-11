import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'daretoconnect.app.mobile',
  appName: 'dare-to-connect-app',
  webDir: 'build',
  ios: {
    contentInset: 'never',
    scrollEnabled: false
  },
  android: {
    captureInput: true
  },
  plugins: {
    StatusBar: {
      style: 'DARK',              // dark icons on white — overridden per-screen anyway
      backgroundColor: '#ffffff',
      overlaysWebView: true
    }
  }
};

export default config;