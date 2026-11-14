import { describe, expect, it } from 'vitest';
import { aiErrorMessage } from '../aiErrors';

describe('aiErrorMessage', () => {
  it('membedakan penyebab agar pengguna tahu harus apa', () => {
    expect(aiErrorMessage(null, '')).toMatch(/koneksi/);
    expect(aiErrorMessage(404, '')).toMatch(/belum dipasang/);
    expect(aiErrorMessage(500, 'OPENAI_API_KEY belum dikonfigurasi di Supabase secrets')).toMatch(/Kunci layanan AI belum terpasang/);
    expect(aiErrorMessage(500, 'AI API error 401: invalid key')).toMatch(/ditolak/);
    expect(aiErrorMessage(500, 'AI API error 503: overloaded')).toMatch(/gangguan/);
    expect(aiErrorMessage(429, 'Terlalu banyak permintaan, coba beberapa detik lagi.')).toBe('Terlalu banyak permintaan, coba beberapa detik lagi.');
    expect(aiErrorMessage(500, 'sesuatu')).toMatch(/kode 500/);
  });
});
