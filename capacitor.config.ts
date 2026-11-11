import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.biz.mitrabp.rekapan',
  appName: 'Rekapan Mitra',
  webDir: 'dist-mobile',
  ios: {
    // Safe areas are handled in CSS (html.native-app in src/index.css). 'always' made WKWebView
    // offset sticky headers and page content differently, so headers covered content.
    contentInset: 'never',
  },
  // Bundle local assets; never ship a development server URL in native releases.
};

export default config;
