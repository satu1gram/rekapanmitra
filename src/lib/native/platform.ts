import { Capacitor } from '@capacitor/core';

/** Production web address. Native WebViews run on capacitor://localhost or https://localhost,
 *  which cannot be opened from an email or by a customer, so shareable links use this instead. */
const DEFAULT_PUBLIC_WEB_ORIGIN = 'https://mitrabp.biz.id';

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

function normalizeOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Origin for links that leave the app: auth emails, public store links. */
export function getPublicWebOrigin(): string {
  const configured = normalizeOrigin(import.meta.env.VITE_PUBLIC_WEB_URL);
  if (isNativeApp()) return configured ?? DEFAULT_PUBLIC_WEB_ORIGIN;
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return configured ?? DEFAULT_PUBLIC_WEB_ORIGIN;
}

export function publicWebUrl(path: string): string {
  return `${getPublicWebOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
}
