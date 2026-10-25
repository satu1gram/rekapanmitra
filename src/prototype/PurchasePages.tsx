import { useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Layers3, Package } from 'lucide-react';
import { MULA_PRODUCTS, unitCost } from '@/lib/mulaBusiness';
import { usePrototype } from './context';
import { today, newId, purchaseTotals, type PurchaseLine } from './model';
import { Page, Card, Button, Input, TextArea, Select, Note, Pill, Stat, Empty, QuantityControl, Info } from './ui';
import { money, productName } from './format';
import { ProductIcon } from './BusinessPages';
import { ProductSelection } from './ProductSelection';
import { ActivityTimeline } from './ActivityTimeline';
import { scrollPrototypeTo } from './usePrototypeScroll';

export function Purchases() {
  const { data } = usePrototype(); const [filter, setFilter] = useState('Semua'); const navigate = useNavigate();
  const rows = data.purchases.filter(p => filter === 'Semua' || (filter === 'Rencana' ? p.status === 'planned' : filter === 'Perjalanan' ? p.status === 'ordered' && !p.receivedDate : !!p.receivedDate));
  return <Page title="Riwayat Restok"><Button onClick={() => navigate('/purchase/new')}><Plus size={18} />Restok Barang</Button><div className="p-chips">{['Semua', 'Rencana', 'Perjalanan', 'Diterima'].map(f => <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'active' : ''}>{f}</button>)}</div>{rows.map(p => { const totals = purchaseTotals(p.lines); return <Link className="p-order-card" key={p.id} to={`/purchases/${p.id}`}><div className="p-between"><h3>{p.supplier}</h3><Pill tone={p.status === 'cancelled' ? 'red' : p.receivedDate ? 'green' : 'amber'}>{p.status === 'cancelled' ? 'Dibatalkan' : p.status === 'planned' ? 'Rencana' : p.receivedDate ? 'Diterima' : 'Perjalanan'}</Pill></div><small>{p.id} · {p.lines.length} produk · {totals.quantity} botol</small><p className="p-small">{p.lines.map(line => `${line.quantity} × ${productName(line.sku)}`).join(' · ')}</p><div className="p-order-bottom"><span className="p-small">{p.purchaseDate}</span><strong>{money(totals.total)}</strong></div></Link>; })}{!rows.length && <Empty title="Belum Ada Restok" text="Tambah restok atau ubah filter." />}<Link className="p-button secondary" to="/purchase/new?example=multi">Restok Multi Produk</Link></Page>;
}

export function PurchaseForm() {
  const { data, update, notify } = usePrototype(); const navigate = useNavigate(); const [params] = useSearchParams();
  const [lines, setLines] = useState<PurchaseLine[]>(() => params.get('example') === 'multi'
    ? [{ sku: 'BP', quantity: 2 }, { sku: 'BLUE', quantity: 1 }, { sku: 'FW', quantity: 4 }].map(line => ({ ...line, unitCost: unitCost(line.sku, data.profile.level) ?? 0 }))
    : [{ sku: params.get('sku') || 'GREEN', quantity: 5, unitCost: unitCost(params.get('sku') || 'GREEN', data.profile.level) ?? 0 }]);
  const [date, setDate] = useState(today()); const [supplier, setSupplier] = useState('Distributor BP (contoh)'); const [notes, setNotes] = useState(''); const [confirmed, setConfirmed] = useState(false); const [error, setError] = useState(''); const [reviewing, setReviewing] = useState(false); const lock = useRef(false); const review = useRef<HTMLDivElement>(null);
  const totals = purchaseTotals(lines);
  function edit(index: number, change: Partial<PurchaseLine>) { setLines(previous => previous.map((line, i) => i === index ? { ...line, ...change } : line)); setConfirmed(false); setReviewing(false); }
  function save(planned: boolean) {
    if (lock.current) return;
    if (!totals.valid || !supplier.trim() || !date || date > today() || (!planned && (!confirmed || data.offline))) { setError(totals.issues[0] ?? 'Cek distributor, tanggal, dan produk.'); return; }
    lock.current = true;
    const id = `PO-${newId().slice(0, 8)}`;
    update(d => ({ ...d, purchases: [{ id, lines: structuredClone(lines), purchaseDate: date, receivedDate: null, supplier: supplier.trim(), notes, status: planned ? 'planned' : 'ordered' }, ...d.purchases] }));
    notify(planned ? 'Rencana restok disimpan.' : 'Restok disimpan. Tambah ke Stok setelah barang diterima.');
    navigate(`/purchases/${id}`);
  }
  return <Page title="Restok Barang"  className="p-restock-cart" footer={<><div className="p-dock-amount"><small>{lines.length} produk · {totals.quantity} botol</small><strong>{money(totals.total)}</strong></div>{reviewing ? <Button className="p-confirm-button" disabled={!totals.valid || !confirmed || data.offline} onClick={() => save(false)}>Simpan Restok</Button> : <Button onClick={() => { setReviewing(true); scrollPrototypeTo(review.current); }}>Cek Restok</Button>}</>}>
    {error && <Note tone="error">{error}</Note>}
    <div className="p-cart-overview"><span className="p-row-icon"><Layers3 size={23} /></span><div><strong>{lines.length} produk</strong><p>{totals.quantity} botol · {totals.equivalent ?? '—'} ekuivalen</p></div></div>
    <Card><h2>Restok dari Distributor</h2><Input label="Distributor" value={supplier} onChange={e => { setSupplier(e.target.value); setConfirmed(false); setReviewing(false); }} required /><Input label="Tanggal Restok" type="date" max={today()} value={date} onChange={e => { setDate(e.target.value); setConfirmed(false); setReviewing(false); }} /></Card>
    <Card><div className="p-between"><h2>Daftar produk</h2><Pill tone="slate">{lines.length} item</Pill></div>
      {lines.map((line, index) => <article className="p-cart-item" key={line.sku + index}><div className="p-cart-item-head"><ProductIcon sku={line.sku} /><div><Select label={`Produk restok ${index + 1}`} value={line.sku} onChange={e => edit(index, { sku: e.target.value, unitCost: unitCost(e.target.value, data.profile.level) ?? 0 })}>{MULA_PRODUCTS.map(product => <option key={product.sku} value={product.sku} disabled={lines.some((other, i) => i !== index && other.sku === product.sku)}>{product.name}</option>)}</Select></div><button type="button" className="p-icon-button" aria-label={`Hapus produk restok ${index + 1}`} onClick={() => { setLines(previous => previous.filter((_, i) => i !== index)); setConfirmed(false); setReviewing(false); }}><Trash2 size={17} /></button></div><div className="p-grid2"><QuantityControl label={`Botol produk ${index + 1}`} value={line.quantity} onChange={quantity => edit(index, { quantity })} /><Input label={`Harga Beli/botol ${index + 1} (Rp)`} type="number" min="1" step="1" value={line.unitCost || ''} placeholder="Perlu diisi" onChange={e => edit(index, { unitCost: Number(e.target.value) })} /></div><div className="p-between"><span className="p-small">Subtotal</span><strong>{money(line.unitCost > 0 && line.quantity > 0 ? line.quantity * line.unitCost : null)}</strong></div></article>)}
      <ProductSelection existing={lines.map(line => line.sku)} onAdd={skus => { setLines(previous => [...previous, ...skus.map(sku => ({ sku, quantity: 1, unitCost: unitCost(sku, data.profile.level) ?? 0 }))]); setConfirmed(false); setReviewing(false); }} />
    </Card>
    <div ref={review} className="p-review-anchor"><Card><h2>Ringkasan Restok</h2><div className="p-money-list"><div><span>Produk</span><strong>{lines.length}</strong></div><div><span>Jumlah Botol</span><strong>{totals.quantity} botol</strong></div><div><span>Target Level</span><strong>{totals.equivalent ?? '—'} ekuivalen</strong></div><div className="total"><span>Nilai Restok</span><strong>{money(totals.total)}</strong></div></div><TextArea label="Catatan (opsional)" value={notes} onChange={e => { setNotes(e.target.value); setConfirmed(false); setReviewing(false); }} />{totals.issues.map(issue => <Note tone="warning" key={issue}>{issue}</Note>)}</Card></div>
    <label className="p-check"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /><span>Produk, jumlah, dan harga sesuai pembelian.</span></label><Button secondary disabled={!totals.valid} onClick={() => save(true)}>Simpan Rencana</Button><Info label="Info Restok">Rencana belum menambah stok atau target level. Konfirmasi restok untuk menghitung level. Tambah ke Stok setelah semua barang diterima.</Info>
  </Page>;
}

export function PurchaseDetail() {
  const { id } = useParams(); const { data, update, notify } = usePrototype(); const p = data.purchases.find(item => item.id === id); const [received, setReceived] = useState(today()); const [cancel, setCancel] = useState(false); const [checked, setChecked] = useState(false); const [actualPurchaseDate, setActualPurchaseDate] = useState(p?.purchaseDate ?? today());
  if (!p) return <Page title="Restok"><Empty title="Catatan tidak ditemukan" text="Pilih kembali dari Riwayat Restok." action={<Link className="p-button" to="/purchases">Riwayat Restok</Link>} /></Page>;
  const totals = purchaseTotals(p.lines);
  return <Page title="Detail Restok" subtitle={p.id}>
    <Card><div className="p-between"><h2>{p.supplier}</h2><Pill tone={p.status === 'cancelled' ? 'red' : p.receivedDate ? 'green' : 'amber'}>{p.status === 'cancelled' ? 'Dibatalkan' : p.receivedDate ? 'Diterima' : p.status === 'planned' ? 'Rencana' : 'Perjalanan'}</Pill></div><div className="p-grid2"><Stat label="Produk" value={`${p.lines.length}`} /><Stat label="Jumlah Botol" value={`${totals.quantity} btl`} /></div>{p.lines.map(line => <div className="p-row" key={line.sku}><ProductIcon sku={line.sku} /><span className="p-row-copy"><strong>{productName(line.sku)}</strong><small>{line.quantity} botol × {money(line.unitCost)}</small></span><strong className="p-line-total">{money(line.quantity * line.unitCost)}</strong></div>)}<div className="p-money-list"><div><span>Target Level</span><strong>{totals.equivalent} ekuivalen</strong></div><div><span>Tanggal Restok</span><strong>{p.purchaseDate}</strong></div><div><span>Tanggal diterima</span><strong>{p.receivedDate ?? 'Belum diterima'}</strong></div><div className="total"><span>Nilai Restok</span><strong>{money(totals.total)}</strong></div></div>{p.notes && <Note>{p.notes}</Note>}</Card>
    <ActivityTimeline purchase={p} />
    {p.status === 'planned' && <Card><h2>Konfirmasi Restok</h2><Input label="Tanggal Restok" type="date" max={today()} value={actualPurchaseDate} onChange={e => setActualPurchaseDate(e.target.value)} /><p className="p-small">Gunakan tanggal beli, bukan tanggal konfirmasi.</p><Button disabled={data.offline || !totals.valid || !actualPurchaseDate || actualPurchaseDate > today()} onClick={() => { update(d => ({ ...d, purchases: d.purchases.map(row => row.id === p.id && row.status === 'planned' ? { ...row, status: 'ordered', purchaseDate: actualPurchaseDate } : row) })); notify('Restok dikonfirmasi.'); }}>Konfirmasi Restok</Button></Card>}
    {p.status === 'ordered' && !p.receivedDate && <Card><h2>Barang Diterima</h2><p className="p-small">Tambahkan stok setelah semua produk diterima.</p><Input label="Tanggal barang diterima" type="date" min={p.purchaseDate} max={today()} value={received} onChange={e => { setReceived(e.target.value); setChecked(false); }} /><label className="p-check"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} /><span>{p.lines.length} produk · {totals.quantity} botol sudah sesuai.</span></label><Button disabled={data.offline || !checked || !received || received < p.purchaseDate || received > today()} onClick={() => { update(d => ({ ...d, purchases: d.purchases.map(row => row.id === p.id && row.status === 'ordered' && !row.receivedDate ? { ...row, receivedDate: received } : row) })); notify('Stok berhasil ditambahkan.'); }}>Tambah ke Stok</Button></Card>}
    {!p.receivedDate && p.status !== 'cancelled' && <><Button secondary onClick={() => setCancel(!cancel)}>Batalkan Restok</Button>{cancel && <Card><Note tone="warning">Semua produk dalam restok ini dibatalkan. Target level dikoreksi.</Note><Button danger onClick={() => { update(d => ({ ...d, purchases: d.purchases.map(row => row.id === p.id ? { ...row, status: 'cancelled' } : row) })); setCancel(false); notify('Restok dibatalkan.'); }}>Ya, Batalkan</Button></Card>}</>}<Info label="Info Restok">Tanggal restok menentukan bulan target level. Tanggal diterima menentukan stok masuk. Restok tidak menambah omset.</Info>
  </Page>;
}
