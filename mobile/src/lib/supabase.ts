import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';
import { secureSessionStorage } from './secureSessionStorage';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : secureSessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Refresh tokens only while the app is in the foreground (recommended for React Native).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', state => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Turn a Supabase/PostgREST error into a readable Indonesian message. */
export function errorMessage(error: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
  if (!error) return fallback;
  const message = typeof error === 'string' ? error : (error as { message?: string }).message;
  if (!message) return fallback;
  if (/network request failed|fetch failed|failed to fetch/i.test(message)) {
    return 'Tidak ada koneksi internet. Periksa jaringan lalu coba lagi.';
  }
  if (/invalid login credentials/i.test(message)) return 'Email atau kata sandi salah.';
  if (/email not confirmed/i.test(message)) return 'Email belum dikonfirmasi. Cek kotak masuk email kamu.';
  if (/user already registered/i.test(message)) return 'Email sudah terdaftar. Silakan masuk.';
  if (/password should be at least/i.test(message)) return 'Kata sandi minimal 6 karakter.';
  return message;
}
