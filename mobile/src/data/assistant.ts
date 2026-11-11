import { supabase } from '~/lib/supabase';
import type { AiItem } from '~/lib/aiDraft';

export type ParseResult =
  | { intent: 'order'; pelanggan: string; hp: string; tanggal?: string; items: AiItem[]; catatan: string }
  | { intent: 'restok'; items: AiItem[]; catatan: string }
  | { intent: 'out_of_scope'; message: string };

const MAX_TEXT = 2000;

/**
 * Ask the parse-order Edge Function to read a chat message. Unlike the web app, the mobile app
 * does not send earlier corrections (they can contain other customers' names and numbers).
 */
export async function parseChatText(text: string): Promise<ParseResult> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Tempel atau ketik isi chat terlebih dahulu.');
  if (trimmed.length > MAX_TEXT) throw new Error(`Teks terlalu panjang (maksimal ${MAX_TEXT} karakter). Tempel satu pesanan saja.`);

  const { data, error } = await supabase.functions.invoke('parse-order', { body: { text: trimmed, learningPatterns: [] } });
  if (error) throw new Error('Asisten AI sedang tidak bisa dihubungi. Coba lagi atau isi order secara manual.');
  if (data?.error) throw new Error(String(data.error));

  const items: AiItem[] = Array.isArray(data?.items)
    ? data.items.map((i: { nama?: unknown; qty?: unknown; satuan?: unknown }) => ({ nama: String(i?.nama ?? ''), qty: Number(i?.qty), satuan: i?.satuan ? String(i.satuan) : undefined }))
    : [];
  if (data?.intent === 'order') {
    return { intent: 'order', pelanggan: String(data.pelanggan ?? ''), hp: String(data.hp ?? ''), tanggal: data.tanggal ? String(data.tanggal) : undefined, items, catatan: String(data.catatan ?? '') };
  }
  if (data?.intent === 'restok') return { intent: 'restok', items, catatan: String(data.catatan ?? '') };
  return { intent: 'out_of_scope', message: String(data?.message ?? 'Asisten hanya membantu mencatat order dan restok.') };
}
