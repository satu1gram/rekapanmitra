import { supabase } from '~/lib/supabase';

export const DELETE_CONFIRM_TEXT = 'HAPUS AKUN';

/** Read the Indonesian message the Edge Function returns in its JSON body, if any. */
async function functionErrorMessage(error: unknown): Promise<string | null> {
  const context = (error as { context?: unknown })?.context;
  if (context && typeof (context as Response).json === 'function') {
    try {
      const body = await (context as Response).json();
      if (body?.error) return String(body.error);
    } catch {
      // not JSON
    }
  }
  return null;
}

/**
 * Permanently delete the signed-in account and its data (Edge Function `delete-account`).
 * The password is checked again first, so an unlocked phone alone is not enough.
 */
export async function deleteMyAccount(email: string, password: string, confirmText: string) {
  if (confirmText.trim().toUpperCase() !== DELETE_CONFIRM_TEXT) throw new Error(`Ketik ${DELETE_CONFIRM_TEXT} untuk melanjutkan.`);
  if (!password) throw new Error('Masukkan kata sandi kamu.');

  const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw new Error('Kata sandi salah.');

  const { data, error } = await supabase.functions.invoke('delete-account', { body: { confirm: DELETE_CONFIRM_TEXT } });
  if (error) throw new Error((await functionErrorMessage(error)) ?? 'Akun gagal dihapus. Periksa koneksi lalu coba lagi.');
  if (!data?.ok) throw new Error(data?.error ? String(data.error) : 'Akun gagal dihapus.');

  // The account no longer exists; clear the session stored on this phone.
  await supabase.auth.signOut({ scope: 'local' });
}
