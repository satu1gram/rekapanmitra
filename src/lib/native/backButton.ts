import { App as CapacitorApp } from '@capacitor/app';
import { isNativeApp } from './platform';

/** Root screens where Android back should leave the app instead of navigating. */
const EXIT_PATHS = new Set(['/', '/dashboard', '/login']);

/** Android hardware back: close an open dialog/sheet first, then go back in history, then exit. */
export function registerAndroidBackButton(): void {
  if (!isNativeApp()) return;
  void CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    const openOverlay = document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
    if (openOverlay) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return;
    }
    if (canGoBack && !EXIT_PATHS.has(window.location.pathname)) {
      window.history.back();
      return;
    }
    void CapacitorApp.exitApp();
  });
}
