// src/lib/orderParser.ts
// Memanggil Supabase Edge Function "parse-order" sebagai proxy aman
// API key AI TIDAK ada di sini — tersimpan di Supabase secrets

// Gunakan shared singleton — JANGAN buat createClient baru di sini.
// Ini mencegah "supabaseUrl is required" jika env var tidak di-set.
import { supabase } from '@/integrations/supabase/client';

// ─── Tipe hasil parsing ───────────────────────────────────────────
export type ParseIntent = 'order' | 'restok' | 'out_of_scope';

export interface ParsedOrderItem {
  nama: string;
  qty: number;
  satuan?: string;
}

export interface ParsedOrder {
  intent: 'order';
  pelanggan: string;
  hp: string;
  tanggal?: string; // YYYY-MM-DD dari chat, kosong jika tidak ada
  items: ParsedOrderItem[];
  catatan: string;
  raw: string;
}

export interface ParsedRestok {
  intent: 'restok';
  items: ParsedOrderItem[];
  catatan: string;
  raw: string;
  // Harga beli diisi di client dari mitraLevel — TIDAK dari AI
  buyPricePerBottle?: number;
}

export interface ParsedOutOfScope {
  intent: 'out_of_scope';
  message: string;
  raw: string;
}

export type ParseResult = ParsedOrder | ParsedRestok | ParsedOutOfScope;

// ─── Learning patterns (localStorage) ────────────────────────────
export interface LearningPattern {
  input: string;
  corrected: ParsedOrder | ParsedRestok;
  savedAt: number;
}

const STORAGE_KEY = 'rm_bot_learning_patterns';

export function getLearningPatterns(): LearningPattern[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveLearningPattern(pattern: LearningPattern) {
  const patterns = getLearningPatterns();
  const updated = [pattern, ...patterns].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

// ─── Main parse function (order + restok + anti-injection) ────────
export async function parseWithAI(text: string): Promise<ParseResult> {
  const learningPatterns = getLearningPatterns();

  const { data, error } = await supabase.functions.invoke('parse-order', {
    body: { text, learningPatterns },
  });

  if (error) throw new Error(`Edge Function error: ${error.message}`);
  if (data?.error) throw new Error(data.error);

  const intent: ParseIntent = data?.intent || 'out_of_scope';

  if (intent === 'order') {
    return {
      intent: 'order',
      pelanggan: data?.pelanggan || '',
      hp: data?.hp || '',
      tanggal: data?.tanggal || '',
      items: Array.isArray(data?.items) ? data.items : [],
      catatan: data?.catatan || '',
      raw: text,
    };
  }

  if (intent === 'restok') {
    return {
      intent: 'restok',
      items: Array.isArray(data?.items) ? data.items : [],
      catatan: data?.catatan || '',
      raw: text,
    };
  }

  // out_of_scope
  return {
    intent: 'out_of_scope',
    message: data?.message || 'Bot ini hanya melayani pencatatan order dan restok barang.',
    raw: text,
  };
}
