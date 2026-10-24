/** Proposed rulebook from MULA PRD v3.0 §7. Preview only; not the production pricebook. */
export const MULA_RULEBOOK = 'MULA-PRD-3.0-BP-2026-09-proposal';
export type MulaLevel = 'family' | 'agent' | 'agent_plus' | 'sap' | 'se' | 'reset';
export type SaleMode = 'unit' | 'bundle';
export type ProductGroup = 'normal' | 'premium' | 'belgie';
export const LEVEL_LABELS: Record<MulaLevel, string> = {
  family: 'Family / Reseller', agent: 'Agent', agent_plus: 'Agent Plus', sap: 'SAP', se: 'SE (harga belum lengkap)', reset: 'Baru / reset (perlu review)',
};
export const MULA_PRODUCTS: { sku: string; name: string; group: ProductGroup; aliases: string[] }[] = [
  { sku: 'BP', name: 'BP Reguler', group: 'normal', aliases: ['british propolis reguler', 'bp reguler', 'reguler'] },
  { sku: 'STEFFI', name: 'Steffi Pro', group: 'normal', aliases: ['steffi pro', 'steffi'] },
  { sku: 'EYE', name: 'Brassic Eye', group: 'normal', aliases: ['brassic eye'] },
  { sku: 'PRO', name: 'Brassic Pro', group: 'normal', aliases: ['brassic pro'] },
  { sku: 'NORWAY', name: 'BP Norway', group: 'normal', aliases: ['bp norway', 'norway'] },
  { sku: 'GREEN', name: 'BP Green', group: 'premium', aliases: ['british propolis green', 'bp green', 'green'] },
  { sku: 'BLUE', name: 'BP Blue', group: 'premium', aliases: ['british propolis blue', 'bp blue', 'blue'] },
  { sku: 'FW', name: 'Belgie Facial Wash', group: 'belgie', aliases: ['belgie facial wash', 'facial wash', 'belgie fw'] },
  { sku: 'SERUM', name: 'Belgie Anti Aging Serum', group: 'belgie', aliases: ['belgie anti aging serum', 'anti aging serum', 'belgie serum'] },
  { sku: 'DC', name: 'Belgie Day Cream', group: 'belgie', aliases: ['belgie day cream', 'day cream', 'belgie dc'] },
  { sku: 'NC', name: 'Belgie Night Cream', group: 'belgie', aliases: ['belgie night cream', 'night cream', 'belgie nc'] },
  { sku: 'HT', name: 'Belgie Hair Tonic', group: 'belgie', aliases: ['belgie hair tonic', 'hair tonic', 'belgie ht'] },
];

const BP_PRICE = {
  unit: { normal: 265000, premium: 285000 },
  family: { normal: 240000, premium: 260000 },
  agent: { normal: 225000, premium: 245000 },
  agent_plus: { normal: 210000, premium: 225000 },
  sap: { normal: 195000, premium: 210000 },
};
const BUNDLE_BY_QTY: Record<number, keyof typeof BP_PRICE> = { 1: 'unit', 3: 'family', 5: 'agent', 10: 'agent_plus', 40: 'sap' };
export interface MulaLine { sku: string; quantity: number }
export interface MulaExpense { name: string; amount: number; payer: 'seller' | 'buyer' }

export function unitCost(sku: string, level: MulaLevel): number | null {
  const product = MULA_PRODUCTS.find(p => p.sku === sku);
  if (!product || level === 'reset' || level === 'se') return null;
  if (product.group === 'belgie') return level === 'sap' ? null : level === 'agent_plus' ? 180000 : 195000;
  return BP_PRICE[level][product.group];
}

export function quoteMulaOrder(lines: MulaLine[], mode: SaleMode, level: MulaLevel, expenses: MulaExpense[]) {
  const issues: string[] = [];
  if (!lines.length) issues.push('Tambahkan minimal satu produk.');
  const products = lines.map(line => MULA_PRODUCTS.find(p => p.sku === line.sku));
  const quantitiesValid = lines.every(line => Number.isSafeInteger(line.quantity) && line.quantity > 0 && line.quantity <= 100000);
  if (!quantitiesValid) issues.push('Jumlah harus berupa botol utuh, lebih dari nol, maksimal 100.000 per baris.');
  if (products.some(product => !product)) issues.push('Produk belum dikenal; periksa katalog, jangan menebak harga.');
  const bpQty = lines.reduce((sum, line, index) => sum + (products[index]?.group !== 'belgie' ? line.quantity : 0), 0);
  const hasBelgie = products.some(product => product?.group === 'belgie');
  const tier = mode === 'unit' ? 'unit' : BUNDLE_BY_QTY[bpQty];
  const mixedBundle = mode === 'bundle' && hasBelgie;
  if (mixedBundle) issues.push('Paket gabungan BP/Belgie belum ditetapkan. Pilih jual satuan atau review harga terpisah.');
  if (!tier && mode === 'bundle') issues.push('Paket BP hanya memiliki aturan 1, 3, 5, 10, atau 40 botol.');
  let revenue: number | null = lines.length > 0 && quantitiesValid && products.every(Boolean) && !!tier && !mixedBundle ? 0 : null;
  let cost: number | null = lines.length > 0 && quantitiesValid && products.every(Boolean) ? 0 : null;
  const pricedLines = lines.map((line, index) => {
    const product = products[index];
    const sale = revenue !== null && product && tier ? product.group === 'belgie' ? 195000 : BP_PRICE[tier][product.group] : null;
    const buy = unitCost(line.sku, level);
    if (buy === null) {
      cost = null;
      issues.push(`Modal ${product?.name ?? line.sku} pada level ini belum tersedia.`);
    }
    if (revenue !== null && sale !== null) revenue += sale * line.quantity;
    if (cost !== null && buy !== null) cost += buy * line.quantity;
    return { ...line, name: product?.name ?? line.sku, unitSale: sale, unitCost: buy };
  });
  const expensesValid = expenses.every(expense => expense.name.trim() && Number.isSafeInteger(expense.amount) && expense.amount >= 0 && ['buyer', 'seller'].includes(expense.payer));
  if (!expensesValid) issues.push('Nama dan nominal biaya harus valid, tanpa angka negatif atau pecahan rupiah.');
  let sellerExpenses = expensesValid ? expenses.filter(e => e.payer === 'seller').reduce((sum, e) => sum + e.amount, 0) : null;
  if (sellerExpenses !== null && !Number.isSafeInteger(sellerExpenses)) { sellerExpenses = null; issues.push('Total biaya terlalu besar untuk dihitung secara aman.'); }
  const gross = revenue !== null && cost !== null ? revenue - cost : null;
  const profit = gross !== null && sellerExpenses !== null ? gross - sellerExpenses : null;
  return {
    rulebook: MULA_RULEBOOK, tier: tier ?? null, pricedLines, revenue, cost, gross, sellerExpenses, profit,
    issues: [...new Set(issues)], canConfirm: issues.length === 0,
  };
}
export type MulaQuote = ReturnType<typeof quoteMulaOrder>;
export interface MulaOrder {
  id: string; buyer: string; date: string; status: 'draft' | 'confirmed' | 'cancelled';
  lines: MulaLine[]; mode: SaleMode; level: MulaLevel; expenses: MulaExpense[];
  quote: MulaQuote; raw: string; events: string[];
}
export interface MulaPurchase { id: string; date: string; sku: string; quantity: number; unitCost: number }

export function equivalentHalfUnits(lines: MulaLine[]): number {
  return lines.reduce((sum, line) => {
    const product = MULA_PRODUCTS.find(p => p.sku === line.sku);
    if (!product || !Number.isSafeInteger(line.quantity) || line.quantity <= 0) throw new Error('Pembelian pemasok belum valid.');
    return sum + line.quantity * (product.group === 'belgie' ? 1 : 2);
  }, 0);
}

export function evaluateMulaMonth(level: MulaLevel, month: string, purchases: MulaPurchase[]) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Bulan tidak valid.');
  const equivalent = equivalentHalfUnits(purchases.filter(p => p.date.slice(0, 7) === month)) / 2;
  const tiers: { level: MulaLevel; target: number }[] = [
    { level: 'family', target: 3 }, { level: 'agent', target: 5 }, { level: 'agent_plus', target: 10 }, { level: 'sap', target: 40 },
  ];
  const current = tiers.find(t => t.level === level);
  const nextMonth = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1)).toISOString().slice(0, 7);
  if (!current) return { equivalent, target: null, nextLevel: null, nextMonth, reason: 'Level awal/reset atau SE perlu review aturan pembelian pertama.' };
  if (equivalent < current.target) return { equivalent, target: current.target, nextLevel: 'reset' as MulaLevel, nextMonth, reason: 'Target belum terpenuhi; jika tidak bertambah sampai akhir bulan, bulan berikutnya reset.' };
  const next = [...tiers].reverse().find(t => equivalent >= t.target)!;
  return { equivalent, target: current.target, nextLevel: next.level, nextMonth, reason: next.level === level ? 'Target mempertahankan level sudah tercapai.' : 'Target naik tercapai; modal bulan ini tetap, kenaikan berlaku bulan depan.' };
}

export function reportMulaOrders(orders: MulaOrder[], month: string) {
  const confirmed = orders.filter(order => order.status === 'confirmed' && order.date.slice(0, 7) === month);
  return {
    count: confirmed.length,
    revenue: confirmed.some(o => o.quote.revenue === null) ? null : confirmed.reduce((sum, order) => sum + order.quote.revenue, 0),
    cost: confirmed.some(o => o.quote.cost === null) ? null : confirmed.reduce((sum, order) => sum + order.quote.cost, 0),
    profit: confirmed.some(o => o.quote.profit === null) ? null : confirmed.reduce((sum, order) => sum + order.quote.profit, 0),
    expenses: confirmed.some(o => o.quote.sellerExpenses === null) ? null : confirmed.reduce((sum, order) => sum + order.quote.sellerExpenses, 0),
  };
}

/** Limited local demo extraction, deliberately not represented as a live AI model. */
export function extractMulaDemoText(text: string) {
  const lower = text.toLowerCase();
  if (/sudah\s+(?:tf|transfer)|telah\s+transfer/.test(lower)) return { intent: 'payment_claim', lines: [], message: 'Klaim transfer perlu dicek. Tidak membuat order atau menandai lunas.' };
  if (/\bbatal\b|\bcancel\b|\bganti\b|\bjadi\b/.test(lower)) return { intent: 'change', lines: [], message: 'Cari dan review pesanan yang dimaksud sebelum mengubah atau membatalkan.' };
  if (/\brestok\b|ke pusat|pemasok|supplier/.test(lower)) return { intent: 'purchase', lines: [], message: 'Ini pembelian pemasok, bukan omzet. Gunakan menu Pembelian di Laporan.' };
  if (/(?:ready|tersedia|berapa|\bada\b|harga).*\?/.test(lower) && !/\bpesan\b|\border\b|\bbeli\b/.test(lower)) return { intent: 'inquiry', lines: [], message: 'Ini pertanyaan produk, belum pesanan. Omzet tidak berubah.' };
  const aliases = MULA_PRODUCTS.flatMap(p => p.aliases.map(alias => ({ alias, sku: p.sku }))).sort((a, b) => b.alias.length - a.alias.length);
  const byAlias = new Map(aliases.map(a => [a.alias, a.sku]));
  const pattern = new RegExp(`(?:^|[\\s,+;])([0-9]+)\\s*(?:botol\\s+|btl\\s+)?(${aliases.map(a => a.alias).join('|')})(?![a-z])`, 'gi');
  const matches = [...text.matchAll(pattern)];
  const lines = matches.map(match => ({ sku: byAlias.get(match[2].toLowerCase())!, quantity: Number(match[1]) }));
  return { intent: lines.length ? 'order' : 'review', lines, message: lines.length ? 'Draf contoh terisi. Periksa seluruh isi chat, pembeli, item, harga, dan biaya sebelum konfirmasi.' : 'Pola belum dikenali. Isi produk/jumlah secara manual; jangan menganggap hasil ini lengkap.' };
}
