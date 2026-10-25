import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Heart, Package } from 'lucide-react';
import { MULA_PRODUCTS, LEVEL_LABELS, quoteMulaOrder, unitCost, type MulaLevel } from '@/lib/mulaBusiness';
import { usePrototype } from './context';
import { inventory } from './model';
import { ProductIcon } from './ProductMedia';
import { ProductCard, FavoriteButton } from './ProductCard';
import { Page, Input, Card, Note, Empty, QuantityControl, Info } from './ui';
import { money } from './format';

export function Catalog() {
  const { data } = usePrototype(); const [filter, setFilter] = useState('Semua'); const [search, setSearch] = useState('');
  const products = MULA_PRODUCTS.filter(p => (filter === 'Semua' || (filter === 'Favorit' ? data.favoriteSkus.includes(p.sku) : filter === 'Belgie' ? p.group === 'belgie' : p.group !== 'belgie')) && p.name.toLowerCase().includes(search.toLowerCase()));
  return <Page title="Produk"  className="p-catalog" back={false} action={<button className="p-icon-button" aria-label="Lihat produk favorit" aria-pressed={filter === 'Favorit'} onClick={() => setFilter(filter === 'Favorit' ? 'Semua' : 'Favorit')}><Heart size={20} fill={filter === 'Favorit' ? 'currentColor' : 'none'} /></button>}>
    <Input label="Cari produk" type="search" placeholder="Cari Green, Steffi, Belgie…" value={search} onChange={e => setSearch(e.target.value)} />
    <div className="p-catalog-intro"><div><strong>Produk BP & Belgie</strong><p>12 produk · harga satuan & paket</p></div><Package size={27} color="#3058ed" /></div>
    <div className="p-chips" aria-label="Kelompok produk">{['Semua', 'BP', 'Belgie', 'Favorit'].map(f => <button aria-pressed={filter === f} className={filter === f ? 'active' : ''} key={f} onClick={() => setFilter(f)}>{f}</button>)}</div>
    <div className="p-section-title"><h2>{filter === 'Favorit' ? 'Produk favorit' : 'Pilihan produk'}</h2><span className="p-small">{products.length} produk</span></div>
    {products.length ? <div className="p-product-grid">{products.map(p => <ProductCard key={p.sku} sku={p.sku} />)}</div> : <Empty title={filter === 'Favorit' ? 'Belum ada produk favorit yang cocok' : 'Produk belum ditemukan'} text="Coba kata lain atau tambahkan Favorit." />}
    <Info label="Info Harga">Harga demo perlu dicek sebelum dipakai pada transaksi asli.</Info>
  </Page>;
}

export function CatalogDetail() {
  const { sku = 'GREEN' } = useParams(); const { data } = usePrototype(); const navigate = useNavigate();
  const product = MULA_PRODUCTS.find(p => p.sku === sku); const [view, setView] = useState('Harga jual'); const [quantity, setQuantity] = useState(1);
  if (!product) return <Page title="Produk"><Note>Produk belum ada dalam katalog contoh.</Note></Page>;
  const stock = inventory(data, sku);
  const price = quoteMulaOrder([{ sku, quantity: 1 }], 'unit', data.profile.level, []).revenue;
  return <Page title={product.name} subtitle={`${product.group === 'belgie' ? 'Belgie' : product.group === 'premium' ? 'BP premium' : 'BP reguler'} · satuan botol`} back={false} className="p-product-detail"
    cover={<div className="p-product-cover"><ProductIcon sku={sku} large /><div className="p-cover-toolbar"><button className="p-icon-button" aria-label="Kembali" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/catalog')}><ArrowLeft size={20} /></button><FavoriteButton sku={sku} /></div></div>}
    footer={<><div className="p-dock-amount"><small>Harga satuan</small><strong>{money(price)}</strong></div><button className="p-button" disabled={!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000} onClick={() => navigate('/compose', { state: { lines: [{ sku, quantity }] } })}>Tambah ke Order<ArrowRight size={16} /></button></>}>
    <div className="p-product-price"><div><small>Harga Jual/botol</small><strong>{money(price)}</strong></div><QuantityControl label="Jumlah produk pilihan" value={quantity} onChange={setQuantity} /></div>
    <div className="p-product-facts"><span>{stock.available} botol tersedia</span><span>Level {LEVEL_LABELS[data.profile.level]}</span><span>SKU {sku}</span></div>
    <div className="p-chips" aria-label="Informasi harga">{['Harga jual', 'Harga Modal'].map(v => <button key={v} aria-pressed={view === v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>{v}</button>)}</div>
    <Card>{view === 'Harga jual' ? product.group === 'belgie' ? <><h2>Harga satuan Belgie</h2><strong>{money(195000)} / botol</strong><p className="p-small">Harga Belgie per botol.</p></> : <><h2>Pilihan paket BP</h2><div className="p-money-list">{[1, 3, 5, 10, 40].map(qty => <div key={qty}><span>{qty} botol</span><strong>{money(quoteMulaOrder([{ sku, quantity: qty }], 'bundle', data.profile.level, []).revenue)}</strong></div>)}</div></> : <><h2>Modal per botol</h2><div className="p-money-list">{Object.entries(LEVEL_LABELS).map(([level, label]) => <div key={level}><span>{label}</span><strong>{money(unitCost(sku, level as MulaLevel))}</strong></div>)}</div><Info label="Info Modal">Modal yang belum tersedia perlu diisi, bukan dianggap nol.</Info></>}</Card>
    <Link className="p-button secondary" to={`/stock/${sku}`}><Package size={17} />Lihat stok produk</Link>
  </Page>;
}
