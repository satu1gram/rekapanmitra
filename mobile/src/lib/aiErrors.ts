/** Turns the Edge Function's failure into a message that says what to do, instead of one generic sentence. */
export function aiErrorMessage(status: number | null, detail: string): string {
  const manual = 'Isi order secara manual dulu';
  if (status === null) return 'Tidak bisa terhubung ke server. Cek koneksi internet, lalu coba lagi.';
  if (status === 404) return `Fitur asisten AI belum dipasang di server. ${manual} dan kabari admin.`;
  if (status === 401 || status === 403) return 'Izin untuk memakai asisten tidak cukup. Coba keluar lalu masuk lagi.';
  if (status === 429) return detail || 'Terlalu banyak permintaan. Tunggu beberapa detik lalu coba lagi.';
  if (/OPENAI_API_KEY|belum dikonfigurasi/i.test(detail)) return `Kunci layanan AI belum terpasang di server. ${manual} dan kabari admin.`;
  if (/AI API error (401|403)/i.test(detail)) return `Kunci layanan AI ditolak (kedaluwarsa atau sudah dicabut). ${manual} dan kabari admin.`;
  if (/AI API error (402|5\d\d)|timeout|respons kosong/i.test(detail)) return 'Layanan AI sedang gangguan. Coba lagi sebentar lagi, atau isi order manual.';
  return `Asisten AI sedang bermasalah di server (kode ${status}). Coba lagi, atau isi order manual.`;
}
