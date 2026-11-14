/**
 * Public configuration. The Supabase URL and publishable key are the same public values
 * the web app ships (src/integrations/supabase/client.ts); access is enforced by RLS.
 * Never put a service-role key here.
 */
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://kqoitztjohxjnjoxctoz.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_3XUK3NfG0_hwtX0NLFSfoA_wR9_s39H';

/**
 * Web app (app.mitrabp.biz.id): email links (confirm, reset password) and the public store /toko/<slug>.
 * mitrabp.biz.id is the landing page and has no app routes, so it must not be used here.
 */
export const PUBLIC_WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://app.mitrabp.biz.id').replace(/\/+$/, '');

export function publicWebUrl(path: string): string {
  return `${PUBLIC_WEB_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
