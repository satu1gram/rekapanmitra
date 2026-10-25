import { Heart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MULA_PRODUCTS, quoteMulaOrder } from '@/lib/mulaBusiness';
import { usePrototype } from './context';
import { inventory } from './model';
import { ProductIcon } from './ProductMedia';
import { money } from './format';

export function FavoriteButton({ sku }: { sku: string }) {
  const { data, update } = usePrototype();
  const active = data.favoriteSkus.includes(sku);
  const name = MULA_PRODUCTS.find(p => p.sku === sku)?.name ?? sku;
  return <button type="button" className={`p-favorite ${active ? 'active' : ''}`} aria-label={`${active ? 'Hapus' : 'Tambahkan'} ${name} ${active ? 'dari' : 'ke'} favorit`} aria-pressed={active} onClick={() => update(d => ({ ...d, favoriteSkus: d.favoriteSkus.includes(sku) ? d.favoriteSkus.filter(s => s !== sku) : [...d.favoriteSkus, sku] }))}><Heart size={17} fill={active ? 'currentColor' : 'none'} /></button>;
}

export function ProductCard({ sku, hint }: { sku: string; hint?: string }) {
  const { data } = usePrototype();
  const product = MULA_PRODUCTS.find(p => p.sku === sku);
  if (!product) return null;
  const price = quoteMulaOrder([{ sku, quantity: 1 }], 'unit', data.profile.level, []).revenue;
  const stock = inventory(data, sku);
  return <article className="p-product-card">
    <div className="p-product-card-photo"><Link to={`/catalog/${sku}`} aria-label={`Lihat ${product.name}`}><ProductIcon sku={sku} /></Link><FavoriteButton sku={sku} /></div>
    <div className="p-product-card-copy"><Link to={`/catalog/${sku}`}><h3>{product.name}</h3></Link><p>{hint ?? `${product.group === 'belgie' ? 'Belgie' : product.group === 'premium' ? 'BP premium' : 'BP reguler'} · ${stock.available} tersedia`}</p>
      <div className="p-product-card-bottom"><strong>{money(price)}</strong><Link className="p-product-add" aria-label={`Buat order ${product.name}`} to="/compose" state={{ lines: [{ sku, quantity: 1 }] }}><Plus size={17} /></Link></div>
    </div>
  </article>;
}
