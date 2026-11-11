import { afterEach, describe, expect, it, vi } from 'vitest';

const isNativePlatform = vi.fn(() => false);
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => isNativePlatform() } }));

import { getPublicWebOrigin, publicWebUrl } from '../platform';

afterEach(() => {
  isNativePlatform.mockReturnValue(false);
  vi.unstubAllEnvs();
});

describe('public web links', () => {
  it('keeps the current origin on the web', () => {
    expect(getPublicWebOrigin()).toBe(window.location.origin);
    expect(publicWebUrl('/toko/abc')).toBe(`${window.location.origin}/toko/abc`);
  });

  it('uses the production site inside the native app, never the WebView origin', () => {
    isNativePlatform.mockReturnValue(true);
    expect(publicWebUrl('reset-password')).toBe('https://mitrabp.biz.id/reset-password');
  });

  it('honours a valid VITE_PUBLIC_WEB_URL and ignores invalid ones', () => {
    isNativePlatform.mockReturnValue(true);
    vi.stubEnv('VITE_PUBLIC_WEB_URL', 'https://app.mitrabp.biz.id/some/path');
    expect(getPublicWebOrigin()).toBe('https://app.mitrabp.biz.id');
    vi.stubEnv('VITE_PUBLIC_WEB_URL', 'capacitor://localhost');
    expect(getPublicWebOrigin()).toBe('https://mitrabp.biz.id');
  });
});
