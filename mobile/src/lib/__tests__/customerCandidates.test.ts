import { describe, expect, it } from 'vitest';
import { buildCandidates, filterCandidates } from '../customerCandidates';

const cust = (id: string, name: string, phone: string | null = null) => ({ id, name, phone, tier: 'satuan', total_orders: 2 });
const ord = (name: string, phone: string | null, customer_id: string | null = null, created_at = '2026-11-01T00:00:00Z') => ({ customer_id, customer_name: name, customer_phone: phone, tier: 'reseller', created_at });

describe('buildCandidates', () => {
  it('menyertakan pelanggan yang hanya ada di riwayat order, tanpa duplikat', () => {
    const list = buildCandidates([cust('c1', 'Bu Rina', '081234567801')], [
      ord('Bu Rina', '+6281234567801'), // sudah ada (nomor sama, beda format)
      ord('Alfiyana', null), ord('alfiyana', null, null, '2026-10-01T00:00:00Z'), // satu orang, dua order
      ord('Pak Budi', '0812-0000', 'c9', '2026-09-01T00:00:00Z'),
    ]);
    expect(list.map(c => c.name)).toEqual(['Bu Rina', 'Alfiyana', 'Pak Budi']);
    expect(list[1]).toMatchObject({ id: null, fromOrders: true, orderCount: 2, tier: 'reseller' });
  });
});

describe('filterCandidates', () => {
  const list = buildCandidates([cust('c1', 'Siti Alfiyana', '081111'), cust('c2', 'Alfi Rahman', '082222'), cust('c3', 'Budi', '083333')], []);
  it('tanpa ketikan memberi daftar terbaru', () => expect(filterCandidates(list, '', 2).map(c => c.name)).toEqual(['Siti Alfiyana', 'Alfi Rahman']));
  it('awalan nama didahulukan, tidak peduli huruf besar dan spasi', () => {
    expect(filterCandidates(list, ' ALFI ').map(c => c.name)).toEqual(['Alfi Rahman', 'Siti Alfiyana']);
  });
  it('mencari lewat nomor telepon', () => expect(filterCandidates(list, '0833').map(c => c.name)).toEqual(['Budi']));
  it('tidak ada yang cocok', () => expect(filterCandidates(list, 'zzz')).toEqual([]));
});
