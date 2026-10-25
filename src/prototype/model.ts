import { businessDate, shiftDate } from '@/lib/businessOverview';
import { quoteMulaOrder, type MulaOrder, type MulaLevel, type MulaLine } from '@/lib/mulaBusiness';

export interface Contact { id: string; name: string; phone: string; address: string; city: string; notes: string }
export interface Order extends MulaOrder {
  source: 'manual' | 'paste' | 'image' | 'share' | 'store' | 'telegram' | 'whatsapp';
  phone: string; address: string; paid: number; refunded: number;
  fulfillment: 'new' | 'preparing' | 'shipped' | 'completed';
  shipped: boolean; returned: boolean; syncPending?: boolean;
  paymentProof?: string;
}
export interface Purchase { id: string; sku: string; quantity: number; unitCost: number; purchaseDate: string; receivedDate: string | null; supplier: string; notes: string; status: 'planned' | 'ordered' | 'cancelled' }
export interface CashEntry { id: string; date: string; name: string; amount: number; kind: 'expense' | 'income'; category: string }
export interface Profile { name: string; business: string; phone: string; email: string; city: string; level: MulaLevel; target: number; openingStock: number }
export interface Shop { name: string; slug: string; description: string; bank: string; account: string; holder: string; active: boolean }
export interface PrototypeData {
  profile: Profile; shop: Shop; orders: Order[]; contacts: Contact[]; purchases: Purchase[]; cash: CashEntry[];
  adjustments: { id: string; sku: string; quantity: number; reason: string; date: string }[];
  connections: { whatsapp: boolean; telegram: boolean }; offline: boolean; aiError: boolean;
  notifications: boolean; aiConsent: boolean;
  team: { id: string; name: string; email: string; role: string }[];
  biometric: boolean; autoLock: boolean; plan: string;
  openingBySku: Record<string, number>;
}
export const today = () => businessDate(new Date());
export const newId = () => crypto.randomUUID();

export function seedPrototype(empty = false): PrototypeData {
  const day = today();
  const orders: Order[] = [
    makeOrder('ORD-1028', 'Bu Ratna', [{ sku: 'GREEN', quantity: 2 }], shiftDate(day, -2), 570000, 'completed', 'paste'),
    makeOrder('ORD-1029', 'Pak Hendra', [{ sku: 'BP', quantity: 3 }], shiftDate(day, -1), 265000, 'shipped', 'manual'),
    makeOrder('ORD-1030', 'Bu Siti', [{ sku: 'FW', quantity: 3 }], day, 0, 'preparing', 'store'),
    makeOrder('ORD-1031', 'Bu Ani', [{ sku: 'GREEN', quantity: 1 }], day, 0, 'new', 'paste'),
  ];
  orders[2].expenses = [{ name: 'Ongkir', amount: 12000, payer: 'seller' }, { name: 'Kemasan', amount: 3000, payer: 'seller' }];
  orders[2].quote = quoteMulaOrder(orders[2].lines, 'unit', 'agent', orders[2].expenses);
  const draft = makeOrder('DRF-1032', 'Bu Dewi', [{ sku: 'BLUE', quantity: 1 }], day, 0, 'new', 'telegram');
  draft.status = 'draft'; draft.events = ['Pesan contoh diterima dari Telegram.', 'Draf menunggu pemeriksaan Anda.'];
  return {
    profile: { name: 'Bu Rina', business: 'Rina Sehat Bersama', phone: '081200000001', email: 'rina@example.test', city: 'Bandung', level: 'agent', target: 5000000, openingStock: empty ? 0 : 6 },
    shop: { name: 'Rina Sehat Bersama', slug: 'rina-sehat', description: 'Pilihan produk BP Group untuk keluarga. Silakan tanyakan ketersediaan sebelum memesan.', bank: 'Bank Contoh', account: '0000000000', holder: 'RINA CONTOH', active: true },
    orders: empty ? [] : [...orders, draft],
    contacts: empty ? [] : ['Bu Ratna', 'Pak Hendra', 'Bu Siti', 'Bu Ani', 'Bu Dewi'].map((name, index) => ({ id: `customer-${index}`, name, phone: `08120000000${index + 2}`, address: 'Alamat pelanggan contoh', city: 'Bandung', notes: 'Data sintetis untuk mencoba prototipe.' })),
    purchases: empty ? [] : [
      { id: 'PO-201', sku: 'BP', quantity: 3, unitCost: 225000, purchaseDate: shiftDate(day, -3), receivedDate: shiftDate(day, -2), supplier: 'Distributor BP (contoh)', notes: 'Pembelian pemasok bulan berjalan.', status: 'ordered' },
      { id: 'PO-202', sku: 'FW', quantity: 4, unitCost: 195000, purchaseDate: shiftDate(day, -2), receivedDate: shiftDate(day, -1), supplier: 'Distributor BP (contoh)', notes: '', status: 'ordered' },
      { id: 'PO-203', sku: 'GREEN', quantity: 5, unitCost: 245000, purchaseDate: day, receivedDate: null, supplier: 'Distributor BP (contoh)', notes: 'Masih dalam perjalanan; belum menambah stok.', status: 'ordered' },
    ],
    cash: empty ? [] : [{ id: 'EXP-1', date: day, name: 'Transport antar paket', amount: 15000, kind: 'expense', category: 'Transportasi' }, { id: 'INC-1', date: day, name: 'Bonus penjualan', amount: 30000, kind: 'income', category: 'Bonus' }],
    adjustments: [], connections: { whatsapp: false, telegram: false }, offline: false, aiError: false, notifications: true, aiConsent: false, team: [{ id: 'owner', name: 'Bu Rina', email: 'rina@example.test', role: 'Pemilik' }], biometric: false, autoLock: true, plan: 'Pilot internal', openingBySku: {},
  };
}

function makeOrder(id: string, buyer: string, lines: MulaLine[], date: string, paid: number, fulfillment: Order['fulfillment'], source: Order['source']): Order {
  const expenses = [{ name: 'Ongkir', amount: 12000, payer: 'seller' as const }, { name: 'Infaq', amount: 5000, payer: 'seller' as const }];
  return {
    id, buyer, lines, date, paid, refunded: 0, fulfillment, source,
    phone: '081200000002', address: 'Alamat contoh, Bandung', level: 'agent', mode: 'unit', expenses,
    status: 'confirmed', quote: quoteMulaOrder(lines, 'unit', 'agent', expenses),
    raw: `${buyer} pesan ${lines.map(line => `${line.quantity} ${line.sku}`).join(', ')}.`,
    events: ['Draf diperiksa oleh pemilik usaha.', 'Order dikonfirmasi; snapshot harga dan modal disimpan.'],
    shipped: fulfillment === 'shipped' || fulfillment === 'completed', returned: false,
  };
}

export function inventory(data: PrototypeData, sku: string) {
  const received = data.purchases.filter(p => p.sku === sku && p.receivedDate && p.status === 'ordered').reduce((sum, p) => sum + p.quantity, 0);
  const adjustment = data.adjustments.filter(a => a.sku === sku).reduce((sum, a) => sum + a.quantity, 0);
  const shipped = data.orders.filter(o => o.shipped && !o.returned).flatMap(o => o.lines).filter(l => l.sku === sku).reduce((sum, l) => sum + l.quantity, 0);
  const reserved = data.orders.filter(o => o.status === 'confirmed' && !o.shipped).flatMap(o => o.lines).filter(l => l.sku === sku).reduce((sum, l) => sum + l.quantity, 0);
  const onHand = (data.openingBySku[sku] ?? data.profile.openingStock) + received + adjustment - shipped;
  return { onHand, reserved, available: onHand - reserved, incoming: data.purchases.filter(p => p.sku === sku && !p.receivedDate && p.status === 'ordered').reduce((sum, p) => sum + p.quantity, 0) };
}

export function businessSummary(data: PrototypeData, month: string) {
  const orders = data.orders.filter(o => o.status === 'confirmed' && o.date.startsWith(month));
  const revenue = orders.reduce((sum, o) => sum + (o.quote.revenue ?? 0), 0);
  const margin = orders.reduce((sum, o) => sum + (o.quote.profit ?? 0), 0);
  const generalExpenses = data.cash.filter(c => c.kind === 'expense' && c.date.startsWith(month)).reduce((sum, c) => sum + c.amount, 0);
  const otherIncome = data.cash.filter(c => c.kind === 'income' && c.date.startsWith(month)).reduce((sum, c) => sum + c.amount, 0);
  return { orders, revenue, margin, generalExpenses, otherIncome, net: margin - generalExpenses + otherIncome, received: orders.reduce((sum, o) => sum + o.paid - o.refunded, 0), receivable: orders.reduce((sum, o) => sum + Math.max(0, (o.quote.revenue ?? 0) - o.paid), 0) };
}
