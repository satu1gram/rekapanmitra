/**
 * Calon pelanggan untuk form order: baris tabel pelanggan, ditambah pelanggan yang hanya ada di riwayat order
 * (order lama bisa tercatat tanpa baris pelanggan, mis. dari toko online atau bot), tanpa duplikat.
 */
export interface CustomerLike { id: string; name: string; phone: string | null; tier: string; total_orders: number }
export interface OrderLike { customer_id: string | null; customer_name: string; customer_phone: string | null; tier: string; created_at: string }

export interface Candidate {
  key: string;
  id: string | null;
  name: string;
  phone: string | null;
  tier: string;
  orderCount: number;
  /** true bila pelanggan ini baru dikenal dari riwayat order dan belum punya baris pelanggan. */
  fromOrders: boolean;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
/** Nomor dibandingkan dalam bentuk lokal: 62812... dan 0812... dianggap sama. */
export const phoneDigits = (s: string | null | undefined) => {
  const d = (s ?? '').replace(/\D/g, '');
  return d.startsWith('62') ? `0${d.slice(2)}` : d;
};

export function buildCandidates(customers: CustomerLike[], orders: OrderLike[]): Candidate[] {
  const out: Candidate[] = customers.map(c => ({ key: c.id, id: c.id, name: c.name, phone: c.phone, tier: c.tier, orderCount: c.total_orders, fromOrders: false }));
  const knownIds = new Set(customers.map(c => c.id));
  const knownNames = new Set(customers.map(c => norm(c.name)).filter(Boolean));
  const knownPhones = new Set(customers.map(c => phoneDigits(c.phone)).filter(Boolean));
  const derived = new Map<string, Candidate>();
  const newestFirst = [...orders].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  for (const o of newestFirst) {
    const name = o.customer_name.trim();
    if (!name || (o.customer_id && knownIds.has(o.customer_id))) continue;
    const phone = phoneDigits(o.customer_phone);
    if ((phone && knownPhones.has(phone)) || knownNames.has(norm(name))) continue;
    const key = phone || norm(name);
    const prev = derived.get(key);
    if (prev) prev.orderCount += 1;
    else derived.set(key, { key: `order:${key}`, id: null, name, phone: o.customer_phone || null, tier: o.tier, orderCount: 1, fromOrders: true });
  }
  return [...out, ...derived.values()];
}

export function filterCandidates(list: Candidate[], query: string, limit = 8): Candidate[] {
  const q = norm(query);
  const qd = phoneDigits(query);
  if (!q) return list.slice(0, limit);
  const digitsOnly = /^[\d\s+\-()]+$/.test(query.trim()) && qd.length >= 3;
  const scored: { c: Candidate; score: number }[] = [];
  for (const c of list) {
    const n = norm(c.name);
    const score = n.startsWith(q) ? 0 : n.includes(q) ? 1 : digitsOnly && phoneDigits(c.phone).includes(qd) ? 1 : -1;
    if (score >= 0) scored.push({ c, score });
  }
  return scored.sort((a, b) => a.score - b.score).slice(0, limit).map(s => s.c);
}
