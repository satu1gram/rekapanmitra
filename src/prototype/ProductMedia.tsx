import bp from '../../public/images/produk/bp.webp';
import steffi from '../../public/images/produk/steffi.webp';
import eye from '../../public/images/produk/brassiceye.webp';
import pro from '../../public/images/produk/brassicpro.webp';
import norway from '../../public/images/produk/norway.webp';
import green from '../../public/images/produk/bpgreen.webp';
import blue from '../../public/images/produk/bpblue.webp';
import wash from '../../public/images/produk/facialwash.webp';
import serum from '../../public/images/produk/serum.webp';
import day from '../../public/images/produk/daycream.webp';
import night from '../../public/images/produk/nightcream.webp';
import hair from '../../public/images/produk/hairtonic.webp';
import { Package } from 'lucide-react';
import { MULA_PRODUCTS } from '@/lib/mulaBusiness';

const PRODUCT_MEDIA: Record<string, string> = {
  BP: bp, STEFFI: steffi, EYE: eye, PRO: pro, NORWAY: norway,
  GREEN: green, BLUE: blue, FW: wash, SERUM: serum, DC: day, NC: night, HT: hair,
};

/** Images are bundled locally; the isolated prototype never fetches the live catalog. */
export function ProductIcon({ sku, large = false, priority = false }: { sku: string; large?: boolean; priority?: boolean }) {
  const product = MULA_PRODUCTS.find(p => p.sku === sku);
  return <span className={`p-product-icon ${product?.group ?? ''} ${large ? 'large' : ''}`}>
    {PRODUCT_MEDIA[sku] ? <img src={PRODUCT_MEDIA[sku]} alt={large ? product?.name ?? sku : ''} loading={large || priority ? 'eager' : 'lazy'} decoding="async" width={large ? 640 : 96} height={large ? 440 : 96} /> : <Package size={26} />}
  </span>;
}
