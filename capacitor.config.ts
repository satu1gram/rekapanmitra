import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.biz.mitrabp.rekapan',
  appName: 'Rekapan Mitra',
  webDir: 'dist-mobile',
  ios: {
    // Keep content below the status bar / notch and above the home indicator.
    // The web layout uses many `sticky top-0` headers that are not safe-area aware.
    contentInset: 'always',
  },
  // Bundle local assets; never ship a development server URL in native releases.
};

export default config;
