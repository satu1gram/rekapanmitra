import { formatDate, formatTime } from './dates';
import { formatRupiah } from './money';

export interface ReceiptPayment { type: 'bank' | 'ewallet' | 'cod'; name: string; account_name: string; number: string }
export interface ReceiptInput {
  storeName: string;
  orderId: string;
  createdAt: string;
  customerName: string;
  items: { name: string; quantity: number; pricePerBottle: number; subtotal: number }[];
  total: number;
  /** Jumlah botol order; dipakai juga bila rincian produk tidak tersedia. */
  bottles: number;
  payments: ReceiptPayment[];
  storeUrl?: string | null;
}

/** Short order number customers can quote back ("#A1B2C3"). */
export const receiptNumber = (orderId: string) => `#${orderId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;

const LINE = '━━━━━━━━━━━━━━━';

/** Payment lines a customer can act on. COD is shown as a plain note. */
export function paymentLines(payments: ReceiptPayment[]): string[] {
  return payments
    .filter(p => p.type === 'cod' || (p.name.trim() && p.number.trim()))
    .map(p => (p.type === 'cod' ? 'Bisa bayar di tempat (COD)' : `${p.name.trim()} ${p.number.trim()}${p.account_name.trim() ? ` a.n. ${p.account_name.trim()}` : ''}`));
}

/**
 * The nota as WhatsApp text: *bold* works in WhatsApp, lines are short so nothing wraps awkwardly
 * on a phone. Only what the customer needs: no modal, profit, or the seller's own costs.
 */
export function buildReceiptText(r: ReceiptInput): string {
  const bottles = r.bottles;
  const pay = paymentLines(r.payments);
  const out = [
    '*NOTA PESANAN*',
    r.storeName.trim() || 'Rekapan Mitra',
    LINE,
    `No. ${receiptNumber(r.orderId)}`,
    `Tanggal: ${formatDate(r.createdAt)}, ${formatTime(r.createdAt)}`,
    `Pelanggan: ${r.customerName.trim() || '-'}`,
    LINE,
    ...r.items.flatMap(i => [`*${i.name}*`, `${i.quantity} × ${formatRupiah(i.pricePerBottle)} = ${formatRupiah(i.subtotal)}`]),
    LINE,
    `*TOTAL (${bottles} botol): ${formatRupiah(r.total)}*`,
  ];
  if (pay.length) out.push('', '*Pembayaran*', ...pay);
  if (r.storeUrl) out.push('', `Pesan lagi: ${r.storeUrl}`);
  out.push('', 'Terima kasih sudah berbelanja 🙏');
  return out.join('\n');
}

/** wa.me link: opens WhatsApp straight to the customer when we have their number, else lets the seller pick a chat. */
export function whatsappUrl(text: string, phone?: string | null): string {
  let digits = (phone ?? '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith('8')) digits = `62${digits}`;
  const target = digits.length >= 9 ? digits : '';
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}
