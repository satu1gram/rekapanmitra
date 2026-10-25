import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Wallet, Package, ArrowDownLeft, ArrowUpRight, CircleHelp, CheckCircle2 } from 'lucide-react';
import { MULA_PRODUCTS } from '@/lib/mulaBusiness';
import { shiftDate } from '@/lib/businessOverview';
import { usePrototype } from './context';
import { today } from './model';
import { financialOverview, orderFinances } from './financialOverview';
import { FinancialCards } from './FinancialCards';
import { money } from './format';
import { Page, Card, Input, Select, Note, Pill, Row, Button, Empty, DownloadButton, Info } from './ui';

export function Reports() {
  const { data, notify } = usePrototype(); const [params] = useSearchParams();
  const [month, setMonth] = useState(today().slice(0, 7)); const [view, setView] = useState(params.get('view') ?? 'overview');
  const [allBills, setAllBills] = useState(params.get('scope') === 'all');
  const [exampleId, setExampleId] = useState('ORD-1031');
  const summary = financialOverview(data, month);
  const example = summary.orders.find(order => order.id === exampleId) ?? summary.orders.find(order => (orderFinances(order).outstanding ?? 0) > 0) ?? summary.orders[0];
  const exampleMoney = example ? orderFinances(example) : null;
  const unpaid = allBills ? summary.allUnpaid : summary.periodUnpaid;
  const chart = Array.from({ length: 7 }, (_, i) => { const date = shiftDate(today(), i - 6); return { date, total: data.orders.filter(o => o.status === 'confirmed' && o.date === date).reduce((s, o) => s + (o.quote.revenue ?? 0), 0) }; });
  const max = Math.max(1, ...chart.map(row => row.total));
  const recap = `REKAP BULANAN · CONTOH\n${month}\nOmset: ${money(summary.sales)}\nDibayar: ${money(summary.received)}\nBelum Lunas: ${money(summary.outstanding)}\nModal: ${money(summary.cost)}\nPengeluaran Tambahan: ${money(summary.orderExpenses)}\nPengeluaran: ${money(summary.generalExpenses)}\nPemasukan Lain: ${money(summary.otherIncome)}\nKeuntungan Bersih: ${money(summary.net)}\nNilai Restok: ${money(summary.purchaseValue)}\nPeriode mengikuti bulan order, bukan tanggal transfer. Modal hanya untuk produk terjual. Nilai restok terpisah. Data simulasi; bukan saldo rekening.`;
  return <Page title="Rekap Bulanan" className="p-money-page">
    <Input label="Bulan" type="month" value={month} onChange={event => { if (event.target.value) setMonth(event.target.value); }} />
    <Info label="Info Perhitungan">
      <p>Periode mengikuti tanggal order (WIB), termasuk pembayarannya. Bukan tanggal transfer atau saldo rekening.</p>
      <p>Modal memakai harga saat order dicatat, hanya untuk produk terjual. Keuntungan adalah estimasi setelah pengeluaran dan pemasukan lain. Draf dan order batal tidak dihitung.</p>
    </Info>
    <div className="p-money-tabs" aria-label="Bagian rekap">{[['overview', 'Ringkasan'], ['payments', 'Belum Lunas'], ['profit', 'Keuntungan'], ['products', 'Produk']].map(([key, label]) => <button key={key} aria-pressed={view === key || key === 'overview' && view === 'learn'} className={view === key || key === 'overview' && view === 'learn' ? 'active' : ''} onClick={() => setView(key)}>{label}</button>)}</div>
    {(view === 'overview' || view === 'learn') && <>
      <FinancialCards summary={summary} />
      <Card className="p-sales-reconcile">
        <div className="p-between"><h2>Omset</h2><strong>{money(summary.sales)}</strong></div>
        <p className="p-small">{summary.orders.length} order</p>
        <div className="p-payment-bar" aria-label="Omset yang sudah dibayar"><span style={{ width: `${summary.sales && summary.received !== null ? Math.min(100, summary.received / summary.sales * 100) : 0}%` }} /></div>
        <div className="p-reconcile-labels"><span>Dibayar {money(summary.received)}</span><span>Belum Lunas {money(summary.outstanding)}</span></div>
      </Card>
      <details className="p-finance-lesson" open={view === 'learn'}>
        <summary><CircleHelp size={21} /><span>Omset & Keuntungan</span></summary>
        {example && exampleMoney ? <div className="p-finance-lesson-body">
          <Select label="Pilih Order" value={example.id} onChange={e => setExampleId(e.target.value)}>{summary.orders.map(order => <option key={order.id} value={order.id}>{order.buyer} · {order.id}</option>)}</Select>
          <div className="p-example-amounts"><div><span>Omset</span><strong>{money(exampleMoney.sales)}</strong></div><div><span>Dibayar</span><strong>{money(exampleMoney.received)}</strong></div><div><span>Belum Lunas</span><strong>{money(exampleMoney.outstanding)}</strong></div></div>
          <div className="p-money-list"><div><span>Omset</span><strong>{money(exampleMoney.sales)}</strong></div><div><span>− Modal</span><strong>{money(exampleMoney.cost)}</strong></div><div><span>− Pengeluaran Tambahan</span><strong>{money(exampleMoney.expenses)}</strong></div><div className="total"><span>Keuntungan</span><strong>{money(exampleMoney.profit)}</strong></div></div>
          <Note>Keuntungan dihitung dari order. Pembayaran mengurangi sisa tagihan.</Note>
          <Link className="p-button" to={`/orders/${example.id}/payment`}>Catat Pembayaran<ArrowRight size={16} /></Link>
        </div> : <p className="p-small">Belum ada order.</p>}
      </details>
      <Card><h2>Omset 7 Hari</h2><div className="p-chart" aria-label="Grafik omset tujuh hari">{chart.map(row => <div key={row.date}><i style={{ height: `${Math.max(4, row.total / max * 90)}px` }} /><small>{row.date.slice(8)}</small></div>)}</div></Card>
    </>}
    {view === 'payments' && <>
      <div className="p-bill-filter"><button className={!allBills ? 'active' : ''} onClick={() => setAllBills(false)}>Bulan Ini</button><button className={allBills ? 'active' : ''} onClick={() => setAllBills(true)}>Semua</button></div>
      <div className="p-section-title"><h2>Belum Lunas</h2><span className="p-small">{unpaid.length} order</span></div>
      {unpaid.length ? unpaid.map(order => { const amounts = orderFinances(order); return <article className="p-bill-card" key={order.id}>
        <div className="p-between"><div><h3>{order.buyer}</h3><small>{order.id} · {order.date}</small></div><Pill tone="amber">{order.paid > 0 ? 'Sebagian' : 'Belum Dibayar'}</Pill></div>
        <div className="p-bill-amount"><span>Sisa Tagihan</span><strong>{money(amounts.outstanding)}</strong></div>
        <p className="p-small">Dibayar {money(amounts.received)}</p>
        <Link className="p-button" to={`/orders/${order.id}/payment`}><Wallet size={17} />Catat Pembayaran</Link>
      </article>; }) : <Empty title="Tidak Ada Tagihan" text="Belum ada order yang perlu dibayar." />}
      <details className="p-disclosure"><summary>Riwayat Pembayaran</summary>{summary.orders.map(order => <Row key={order.id} title={order.buyer} subtitle={`Dibayar ${money(orderFinances(order).received)} · ${order.id}`} to={`/orders/${order.id}/payment`} icon={orderFinances(order).outstanding === 0 ? CheckCircle2 : Wallet} />)}</details>
      <Info label="Info Pembayaran">Catat setelah uang diterima. Chat “sudah transfer” perlu dicek. Tanggal jatuh tempo belum dicatat.</Info>
    </>}
    {view === 'profit' && <>
      <Card className="p-profit-waterfall">
        <h2>Keuntungan Bersih</h2>
        <div className="p-money-list"><div><span>Omset</span><strong>{money(summary.sales)}</strong></div><div><span>− Modal</span><strong>{money(summary.cost)}</strong></div><div><span>− Pengeluaran Tambahan</span><strong>{money(summary.orderExpenses)}</strong></div><div><span>− Pengeluaran</span><strong>{money(summary.generalExpenses)}</strong></div><div><span>+ Pemasukan Lain</span><strong>{money(summary.otherIncome)}</strong></div><div className="total"><span>Keuntungan Bersih</span><strong>{money(summary.net)}</strong></div></div>
        {summary.net === null && <Note tone="warning">Lengkapi harga, modal, atau pengeluaran.</Note>}
      </Card>
      <Card className="p-purchase-explainer">
        <div className="p-between"><h2>Restok Bulan Ini</h2><Package size={22} /></div>
        <div className="p-money-list"><div><span>Nilai Restok</span><strong>{money(summary.purchaseValue)}</strong></div></div>
        <Info label="Restok & Modal">Nilai restok adalah pembelian dari distributor, termasuk barang yang belum diterima. Modal pada keuntungan hanya untuk produk terjual. Pembayaran distributor belum dicatat.</Info>
        <Link className="p-button secondary" to="/purchases">Riwayat Restok<ArrowRight size={16} /></Link>
      </Card>
    </>}
    {view === 'products' && <Card><h2>Produk Terjual</h2>{MULA_PRODUCTS.map(product => { const quantity = summary.orders.flatMap(order => order.lines).filter(line => line.sku === product.sku).reduce((sum, line) => sum + line.quantity, 0); return <Row key={product.sku} to={`/catalog/${product.sku}`} title={product.name} trailing={<Pill tone="slate">{quantity} btl</Pill>} />; })}</Card>}
    <Card className="p-flat-card"><Row to="/expenses" title="Pengeluaran" icon={ArrowDownLeft} /><Row to="/income" title="Pemasukan" icon={ArrowUpRight} /><Row to="/level" title="Level Mitra" icon={Package} /></Card>
    <Button secondary onClick={async () => { try { await navigator.clipboard.writeText(recap); notify('Rekap disalin.'); } catch { notify('Gagal menyalin. Coba Unduh Rekap.'); } }}>Salin Rekap</Button>
    <DownloadButton label="Unduh Rekap" filename={`mula-rekap-${month}.txt`} content={recap} />
  </Page>;
}
