import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, ClipboardList, Package, Plus, Wallet, ClipboardPaste, PackagePlus, CircleHelp, ChevronRight } from 'lucide-react';
import { MULA_PRODUCTS } from '@/lib/mulaBusiness';
import { usePrototype } from './context';
import { inventory, today } from './model';
import { financialOverview, monthName, orderFinances } from './financialOverview';
import { FinancialCards } from './FinancialCards';
import { money, productName } from './format';
import { Page, Button, Input, Card, Pill, Row, Empty } from './ui';

export function Home() {
  const { data } = usePrototype(); const navigate = useNavigate(); const [search, setSearch] = useState('');
  const month = today().slice(0, 7); const summary = financialOverview(data, month);
  const drafts = data.orders.filter(order => order.status === 'draft');
  const low = MULA_PRODUCTS.filter(product => inventory(data, product.sku).available <= 3);
  const incoming = data.purchases.filter(purchase => purchase.status === 'ordered' && !purchase.receivedDate);
  const goal = data.profile.target > 0 && summary.sales !== null ? Math.round(summary.sales / data.profile.target * 100) : 0;
  return <Page className="p-home p-task-home" title="Beranda" subtitle={data.profile.business} back={false} action={<div className="p-header-actions"><Link className="p-icon-button p-notification-button" aria-label="Notifikasi" to="/notifications"><Bell size={21} />{drafts.length > 0 && <i />}</Link><Link className="p-owner-avatar" aria-label="Akun" to="/settings">{data.profile.name.replace(/^bu\s+|^pak\s+/i, '').slice(0, 1)}</Link></div>}>
    <div className="p-daily-actions"><Button onClick={() => navigate('/compose')}><Plus size={18} />Tambah Order</Button><Button secondary onClick={() => navigate('/reports?view=payments&scope=all')}><Wallet size={18} />Pembayaran</Button></div>
    <div className="p-fast-links"><Link to="/capture/paste"><ClipboardPaste size={17} />Tempel Chat<ChevronRight size={14} /></Link><Link to="/purchase/new"><PackagePlus size={17} />Restok Barang<ChevronRight size={14} /></Link></div>
    <section className="p-home-money" aria-label="Rekap Bulanan"><div className="p-section-title"><div><h2>Rekap Bulanan</h2><p>{monthName(month)}</p></div><Link to="/reports">Rincian<ArrowRight size={14} /></Link></div><FinancialCards summary={summary} /><Link className="p-money-help-link" to="/reports?view=learn"><CircleHelp size={17} />Omset & Keuntungan<ChevronRight size={15} /></Link></section>
    <section className="p-task-panel p-home-attention"><div className="p-section-title"><h2>Perlu Dicek</h2><Link to="/notifications">Lihat Semua</Link></div><Card className="p-flat-card">{drafts.length > 0 && <Row to="/orders?filter=draft" icon={ClipboardList} title={`${drafts.length} Draf`} trailing={<Pill tone="amber">Cek</Pill>} />}{summary.allUnpaid.length > 0 && <Row to="/reports?view=payments&scope=all" icon={Wallet} title={`${summary.allUnpaid.length} Order Belum Lunas`} trailing={<ArrowRight size={18} />} />}{!drafts.length && !summary.allUnpaid.length && <p className="p-task-clear">Semua sudah dicek.</p>}</Card></section>
    <div className="p-stock-shortcuts"><Link to="/stock"><Package size={20} /><span><strong>{low.length} Stok Menipis</strong></span><ChevronRight size={17} /></Link><Link to="/purchases"><PackagePlus size={20} /><span><strong>{incoming.length} Restok Dikirim</strong></span><ChevronRight size={17} /></Link></div>
    <form className="p-home-search" onSubmit={event => { event.preventDefault(); navigate(`/orders?q=${encodeURIComponent(search)}`); }}><Input label="Cari Order" type="search" placeholder="Nama pelanggan / nomor order" value={search} onChange={e => setSearch(e.target.value)} /><button className="p-search-submit" aria-label="Cari"><ArrowRight size={18} /></button></form>
    <div className="p-section-title"><h2>Order Terbaru</h2><Link to="/orders">Lihat semua</Link></div>{data.orders.length ? data.orders.slice(0, 2).map(order => <Link key={order.id} className="p-order-card" to={`/orders/${order.id}`}><div className="p-between"><h3>{order.buyer}</h3><Pill tone={order.status === 'draft' ? 'amber' : order.status === 'cancelled' ? 'red' : 'green'}>{order.status === 'draft' ? 'Draf' : order.status === 'cancelled' ? 'Dibatalkan' : orderFinances(order).outstanding === 0 ? 'Lunas' : order.paid > 0 ? 'Sebagian' : 'Belum Lunas'}</Pill></div><small>{order.lines.map(line => `${line.quantity} × ${productName(line.sku)}`).join(', ')}</small><div className="p-order-bottom"><span>{order.id}</span><strong>{money(order.quote.revenue)}</strong></div></Link>) : <Empty title="Mulai dari pesanan pertama" text="Order tersimpan akan tampil di sini." action={<Button onClick={() => navigate('/compose')}>Tambah Order</Button>} />}
    <Card className="p-sales-target"><div className="p-between"><div><small>Target Omset</small><h2>{goal}% tercapai</h2></div><Link to="/target" className="p-text-button">Atur<ArrowRight size={16} /></Link></div><div className="p-progress"><span style={{ width: `${Math.min(goal, 100)}%` }} /></div><p className="p-small">{money(summary.sales)} dari {money(data.profile.target)}</p></Card><Link className="p-button secondary" to="/catalog">Produk & Harga<ArrowRight size={16} /></Link>
  </Page>;
}
