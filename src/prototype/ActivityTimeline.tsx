import { Check, Circle } from 'lucide-react';
import type { Order, Purchase } from './model';

export function ActivityTimeline({ order, purchase }: { order?: Order; purchase?: Purchase }) {
  const cancelled = (order ?? purchase)?.status === 'cancelled';
  const steps = order ? [
    { label: 'Cek Pesanan', detail: order.status === 'draft' ? 'Menunggu konfirmasi' : `Dicatat ${order.date}`, complete: order.status === 'confirmed' },
    { label: 'Disiapkan', detail: '', complete: ['preparing', 'shipped', 'completed'].includes(order.fulfillment) },
    { label: 'Dikirim', detail: order.shipped ? '' : 'Belum dikirim', complete: order.shipped },
    { label: 'Selesai', detail: '', complete: order.fulfillment === 'completed' },
  ] : purchase ? [
    { label: 'Rencana Restok', detail: `${purchase.lines.length} produk`, complete: true },
    { label: 'Restok Dikonfirmasi', detail: purchase.status === 'ordered' ? `Tanggal beli ${purchase.purchaseDate}` : 'Belum dikonfirmasi', complete: purchase.status === 'ordered' },
    { label: 'Barang Diterima', detail: purchase.receivedDate ? `Diterima ${purchase.receivedDate}` : 'Belum diterima', complete: !!purchase.receivedDate },
  ] : [];
  const current = steps.findIndex(step => !step.complete);
  return <section className="p-activity"><div className="p-section-title"><h2>Progres {order ? 'pesanan' : 'restok'}</h2><span className={`p-activity-badge ${cancelled ? 'cancelled' : ''}`}>{cancelled ? 'Dibatalkan' : current === -1 ? 'Selesai' : 'Berjalan'}</span></div>
    <ol className={`p-activity-steps ${cancelled ? 'cancelled' : ''}`} aria-label={`Tahapan ${order ? 'pesanan' : 'restok'}`}>
      {steps.map((step, index) => <li key={step.label} className={`${step.complete && !cancelled ? 'done' : ''} ${index === current && !cancelled ? 'now' : ''}`} aria-current={index === current && !cancelled ? 'step' : undefined}>
        <span className="p-activity-marker">{step.complete && !cancelled ? <Check size={13} /> : <Circle size={9} />}</span><div><strong>{step.label}</strong>{step.detail && <p>{step.detail}</p>}</div>
      </li>)}
    </ol>

  </section>;
}
