import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { MULA_PRODUCTS } from '@/lib/mulaBusiness';
import { Button, Pill } from './ui';

/** Batch selection shared by order and supplier-purchase carts. */
export function ProductSelection({ existing, onAdd }: { existing: string[]; onAdd: (skus: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const available = MULA_PRODUCTS.filter(product => !existing.includes(product.sku));
  const selected = chosen.filter(sku => !existing.includes(sku));
  return <div className="p-product-selection"><Button secondary disabled={!available.length} onClick={() => setOpen(!open)}><Plus size={18} />{open ? 'Tutup pilihan produk' : 'Tambah beberapa produk'}</Button>{open && <div className="p-product-picker"><div className="p-between"><h3>Pilih produk sekaligus</h3><Pill tone="slate">{selected.length} dipilih</Pill></div><p className="p-small">Jumlah dan harga dapat Anda atur pada setiap baris setelah ditambahkan.</p>{available.map(product => <label className="p-product-choice" key={product.sku}><input type="checkbox" checked={selected.includes(product.sku)} onChange={event => setChosen(previous => event.target.checked ? [...previous, product.sku] : previous.filter(sku => sku !== product.sku))} /><span><strong>{product.name}</strong><small>{product.group === 'belgie' ? 'Belgie' : product.group === 'premium' ? 'BP premium' : 'BP normal'}</small></span>{selected.includes(product.sku) && <Check size={18} />}</label>)}<Button disabled={!selected.length} onClick={() => { onAdd(selected); setChosen([]); setOpen(false); }}>Tambahkan {selected.length || ''} produk</Button></div>}</div>;
}
