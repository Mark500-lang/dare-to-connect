import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'daretoconnect.app.mobile',
  appName: 'dare-to-connect-app',
  webDir: 'build',
  ios: {
    contentInset: 'automatic'   // Handles safe areas automatically
  },
  plugins: {
    StatusBar: {
      style: 'default',         // or 'dark' / 'light'
      backgroundColor: '#ffffff'
    }
  }
};

export default config;