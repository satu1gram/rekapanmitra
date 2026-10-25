import { Check, Circle } from 'lucide-react';
import type { Order, Purchase } from './model';

export function ActivityTimeline({ order, purchase }: { order?: Order; purchase?: Purchase }) {
  const cancelled = (order ?? purchase)?.status === 'cancelled';
  const steps = order ? [
    { label: 'Pesanan diperiksa', detail: order.status === 'draft' ? 'Menunggu konfirmasi Anda' : `Dicatat ${order.date}`, complete: order.status === 'confirmed' },
    { label: 'Produk disiapkan', detail: 'Alokasi setiap produk diperiksa', complete: ['preparing', 'shipped', 'completed'].includes(order.fulfillment) },
    { label: 'Barang dikirim', detail: order.shipped ? 'Pengiriman dicatat oleh pemilik' : 'Belum ada konfirmasi pengiriman', complete: order.shipped },
    { label: 'Pengiriman selesai', detail: 'Terpisah dari status pembayaran', complete: order.fulfillment === 'completed' },
  ] : purchase ? [
    { label: 'Rencana restok', detail: `${purchase.lines.length} produk dalam satu pembelian`, complete: true },
    { label: 'Pembelian disepakati', detail: purchase.status === 'ordered' ? `Tanggal beli ${purchase.purchaseDate}` : 'Belum menambah ekuivalen level', complete: purchase.status === 'ordered' },
    { label: 'Seluruh barang diterima', detail: purchase.receivedDate ? `Diterima ${purchase.receivedDate}` : 'Masih menunggu pemeriksaan barang', complete: !!purchase.receivedDate },
  ] : [];
  const current = steps.findIndex(step => !step.complete);
  return <section className="p-activity"><div className="p-section-title"><h2>Progres {order ? 'pesanan' : 'restok'}</h2><span className={`p-activity-badge ${cancelled ? 'cancelled' : ''}`}>{cancelled ? 'Aktivitas dibatalkan' : current === -1 ? 'Selesai' : 'Berjalan'}</span></div>
    <ol className={`p-activity-steps ${cancelled ? 'cancelled' : ''}`} aria-label={`Tahapan ${order ? 'pesanan' : 'restok'}`}>
      {steps.map((step, index) => <li key={step.label} className={`${step.complete && !cancelled ? 'done' : ''} ${index === current && !cancelled ? 'now' : ''}`} aria-current={index === current && !cancelled ? 'step' : undefined}>
        <span className="p-activity-marker">{step.complete && !cancelled ? <Check size={13} /> : <Circle size={9} />}</span><div><strong>{step.label}</strong><p>{step.detail}</p></div>
      </li>)}
    </ol>
    {cancelled && <p className="p-small">Aktivitas dihentikan. Rincian dan jejak sebelumnya tetap tersedia.</p>}
  </section>;
}
