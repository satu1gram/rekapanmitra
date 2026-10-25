import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, ChevronRight, ClipboardList, Package, PackagePlus, Plus, Sparkles, Wallet } from 'lucide-react';
import { LEVEL_LABELS, MULA_PRODUCTS } from '@/lib/mulaBusiness';
import { usePrototype } from './context';
import { businessSummary, inventory, today } from './model';
import { money, productName } from './format';
import { ProductCard } from './ProductCard';
import { Page, Button, Input, Card, Pill, Row, Empty, Note } from './ui';

export function Home() {
  const { data } = usePrototype(); const navigate = useNavigate(); const [search, setSearch] = useState('');
  const month = today().slice(0, 7); const summary = businessSummary(data, month);
  const label = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(`${month}-01T12:00:00+07:00`));
  const drafts = data.orders.filter(o => o.status === 'draft');
  const low = MULA_PRODUCTS.filter(p => inventory(data, p.sku).available <= 3);
  const sold = MULA_PRODUCTS.map(p => ({ ...p, quantity: summary.orders.flatMap(o => o.lines).filter(line => line.sku === p.sku).reduce((sum, line) => sum + line.quantity, 0) })).sort((a, b) => b.quantity - a.quantity);
  const goal = data.profile.target > 0 ? Math.round(summary.revenue / data.profile.target * 100) : 0;
  return <Page className="p-home" title={`Halo, ${data.profile.name.replace(/^bu\s+/i, 'Bu ')} 👋`} subtitle={data.profile.business} back={false} action={<div className="p-header-actions"><Link className="p-icon-button p-notification-button" aria-label="Notifikasi" to="/notifications"><Bell size={21} />{drafts.length > 0 && <i />}</Link><Link className="p-owner-avatar" aria-label="Akun dan usaha" to="/settings">{data.profile.name.replace(/^bu\s+|^pak\s+/i, '').slice(0, 1)}</Link></div>}>
    <div className="p-home-context"><Pill>{LEVEL_LABELS[data.profile.level]}</Pill><span>Ruang usaha Anda</span><Link to="/level" aria-label="Lihat progres level"><ChevronRight size={17} /></Link></div>
    <form className="p-home-search" onSubmit={e => { e.preventDefault(); navigate(`/orders?q=${encodeURIComponent(search)}`); }}><Input label="Cari pesanan pelanggan" type="search" placeholder="Cari pesanan pelanggan…" value={search} onChange={e => setSearch(e.target.value)} /><button className="p-search-submit" aria-label="Buka hasil pencarian"><ArrowRight size={18} /></button></form>
    <section className="p-hero p-home-hero"><div className="p-finance-kicker"><small>Omzet terkonfirmasi</small><Button onClick={() => navigate('/add')}><Plus size={15} />Catat pesanan</Button></div><strong>{money(summary.revenue)}</strong><Link className="p-finance-period" to="/reports" aria-label="Buka laporan usaha">{label} · {summary.orders.length} pesanan<ArrowRight size={13} /></Link><div className="p-hero-divider" /><div className="p-hero-metrics"><div><span>Estimasi hasil usaha</span><strong>{money(summary.net)}</strong></div><div><span>Uang diterima</span><strong>{money(summary.received)}</strong></div></div></section>
    <div className="p-home-quick">{[[ClipboardList, '/orders', 'Pesanan', 'blue'], [PackagePlus, '/purchase/new', 'Restok', 'lime'], [Package, '/stock', 'Stok', 'lavender'], [Sparkles, '/advisor', 'Asisten', 'peach']].map(([Icon, to, text, tone]) => { const I = Icon as typeof Package; return <Link className={`p-shortcut ${tone}`} to={to as string} key={text as string}><span><I size={23} /></span><strong>{text as string}</strong></Link>; })}</div>

    <div className="p-section-title"><h2>Produk bulan ini</h2><Link to="/catalog">Lihat semua <ChevronRight size={14} /></Link></div><div className="p-product-grid">{sold.slice(0, 2).map(p => <ProductCard key={p.sku} sku={p.sku} hint={`${p.quantity} botol terkonfirmasi`} />)}</div>
    <Link className="p-attention-strip p-home-attention" to="/notifications"><span className="p-attention-symbol"><Sparkles size={19} /></span><span><strong>{drafts.length ? `${drafts.length} draf menunggu diperiksa` : 'Catatan usaha siap diperiksa'}</strong><small>{low.length} stok perlu perhatian · lihat aktivitas</small></span><ChevronRight size={19} /></Link>
    <div className="p-section-title"><h2>Yang perlu dituntaskan</h2><Link to="/notifications">Lihat semua</Link></div><Card className="p-flat-card"><Row to="/orders?filter=unpaid" icon={Wallet} title={`${money(summary.receivable)} belum dibayar`} subtitle="Sisa tagihan order terkonfirmasi" /><Row to="/purchases" icon={PackagePlus} title="Periksa pembelian pemasok" subtitle="Barang diterima baru menambah stok" /></Card>
    <Card className="p-sales-target"><div className="p-between"><div><small>Target penjualan</small><h2>{goal}% tercapai</h2></div><Link to="/target" className="p-text-button">Atur <ArrowRight size={16} /></Link></div><div className="p-progress"><span style={{ width: `${Math.min(goal, 100)}%` }} /></div><p className="p-small">{money(summary.revenue)} dari {money(data.profile.target)}</p></Card>
    <div className="p-section-title"><h2>Pesanan terbaru</h2><Link to="/orders">Lihat semua</Link></div>{data.orders.length ? data.orders.slice(0, 2).map(o => <Link key={o.id} className="p-order-card" to={`/orders/${o.id}`}><div className="p-between"><h3>{o.buyer}</h3><Pill tone={o.status === 'draft' ? 'amber' : o.status === 'cancelled' ? 'red' : 'green'}>{o.status === 'draft' ? 'Perlu dicek' : o.status === 'cancelled' ? 'Dibatalkan' : 'Terkonfirmasi'}</Pill></div><small>{o.lines.map(l => `${l.quantity} × ${productName(l.sku)}`).join(', ')}</small><div className="p-order-bottom"><span>{o.id}</span><strong>{money(o.quote.revenue)}</strong></div></Link>) : <Empty title="Mulai dari pesanan pertama" text="Setelah dikonfirmasi, penjualan Anda akan tampil di sini." action={<Button onClick={() => navigate('/add')}>Catat pesanan pertama</Button>} />}
    <Note>Omzet bukan saldo kas. Estimasi hasil usaha sudah memperhitungkan biaya order, biaya umum, dan pendapatan lain.</Note>
  </Page>;
}
