import { describe, expect, it } from 'vitest';
import { buildReceiptText, receiptNumber, whatsappUrl } from '../receipt';

const base = {
  storeName: 'Toko Dewi',
  orderId: 'a1b2c3d4-0000-0000-0000-000000000000',
  createdAt: '2026-11-14T03:05:00.000Z',
  customerName: 'Bu Rina',
  items: [
    { name: 'British Propolis', quantity: 3, pricePerBottle: 240000, subtotal: 720000 },
    { name: 'BP Blue', quantity: 1, pricePerBottle: 285000, subtotal: 285000 },
  ],
  total: 1005000,
  bottles: 4,
  payments: [
    { type: 'bank' as const, name: 'BCA', account_name: 'Dewi', number: '1234567890' },
    { type: 'ewallet' as const, name: 'DANA', account_name: '', number: '' },
    { type: 'cod' as const, name: '', account_name: '', number: '' },
  ],
};

describe('nota WhatsApp', () => {
  it('memuat yang perlu pelanggan, tanpa modal atau untung', () => {
    const t = buildReceiptText({ ...base, storeUrl: 'https://app.mitrabp.biz.id/toko/dewi' });
    expect(t).toContain('*NOTA PESANAN*');
    expect(t).toContain('No. #A1B2C3');
    expect(t).toContain('Pelanggan: Bu Rina');
    expect(t).toContain('*British Propolis*\n3 × Rp240.000 = Rp720.000');
    expect(t).toContain('*TOTAL (4 botol): Rp1.005.000*');
    expect(t).toContain('BCA 1234567890 a.n. Dewi');
    expect(t).not.toContain('DANA'); // rekening tanpa nomor tidak ditampilkan
    expect(t).toContain('Bisa bayar di tempat (COD)');
    expect(t).toContain('Pesan lagi: https://app.mitrabp.biz.id/toko/dewi');
    expect(t).not.toMatch(/modal|untung/i);
  });
  it('tanpa info pembayaran dan link toko, bagian itu tidak muncul', () => {
    const t = buildReceiptText({ ...base, payments: [], storeUrl: null });
    expect(t).not.toContain('Pembayaran');
    expect(t).not.toContain('Pesan lagi');
  });
  it('nomor order pendek', () => expect(receiptNumber('ab-cd-ef12')).toBe('#ABCDEF'));
  it('link WhatsApp memakai nomor pelanggan dalam format 62', () => {
    expect(whatsappUrl('hai', '0812-3456-7890')).toBe('https://wa.me/6281234567890?text=hai');
    expect(whatsappUrl('hai', '+62 812 3456 7890')).toBe('https://wa.me/6281234567890?text=hai');
    expect(whatsappUrl('a b', '')).toBe('https://wa.me/?text=a%20b');
  });
});
