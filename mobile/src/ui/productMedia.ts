import type { ImageSourcePropType } from 'react-native';

import bp from '../../assets/products/bp.webp';
import bpBlue from '../../assets/products/bpblue.webp';
import bpGreen from '../../assets/products/bpgreen.webp';
import brassicEye from '../../assets/products/brassiceye.webp';
import brassicPro from '../../assets/products/brassicpro.webp';
import dayCream from '../../assets/products/daycream.webp';
import facialWash from '../../assets/products/facialwash.webp';
import hairTonic from '../../assets/products/hairtonic.webp';
import nightCream from '../../assets/products/nightcream.webp';
import norway from '../../assets/products/norway.webp';
import serum from '../../assets/products/serum.webp';
import steffi from '../../assets/products/steffi.webp';

/**
 * Product photos are bundled with the app (the same files as the web app's public/images/produk);
 * the catalog table has no image column, so the photo is picked by catalog category code.
 */
const BY_CATEGORY: Record<string, ImageSourcePropType> = {
  BP: bp,
  KID: bpGreen,
  BLUE: bpBlue,
  STEFFI: steffi,
  BRE: brassicEye,
  BRO: brassicPro,
  NORWAY: norway,
  BELGIE: serum,
  BELGIE_FW: facialWash,
  BELGIE_SERUM: serum,
  BELGIE_DC: dayCream,
  BELGIE_NC: nightCream,
  BELGIE_HT: hairTonic,
};

const BY_NAME: [RegExp, ImageSourcePropType][] = [
  [/green|kid/i, bpGreen],
  [/blue/i, bpBlue],
  [/steffi/i, steffi],
  [/brassic\s*eye|\bbre\b/i, brassicEye],
  [/brassic\s*pro|\bbro\b/i, brassicPro],
  [/norway/i, norway],
  [/facial|wash|_fw\b/i, facialWash],
  [/day\s*cream|_dc\b/i, dayCream],
  [/night\s*cream|_nc\b/i, nightCream],
  [/hair|tonic|_ht\b/i, hairTonic],
  [/belgie|serum/i, serum],
  [/\bbp\b|propolis/i, bp],
];

/** Product photo for a catalog category code or a saved product name; null when unknown. */
export function productImage(nameOrCategory: string): ImageSourcePropType | null {
  return BY_CATEGORY[nameOrCategory.toUpperCase()] ?? BY_NAME.find(([re]) => re.test(nameOrCategory))?.[1] ?? null;
}
