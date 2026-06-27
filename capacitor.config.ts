import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geologon.cuiz',
  appName: 'cuiz-in',
  webDir: 'dist',
  // server: {
  //   url: 'https://7e6688c8-dfb8-442e-8fed-a62399ade2ef.lovableproject.com?forceHideBadge=true&mobile=1',
  //   cleartext: true,
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0f172a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
    },
  },
};

export default config;