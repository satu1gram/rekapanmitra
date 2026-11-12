import type { ImageSourcePropType } from 'react-native';

import bp from '../../assets/products/bp.webp';
import bpBlue from '../../assets/products/bpblue.webp';
import bpGreen from '../../assets/products/bpgreen.webp';
import brassicEye from '../../assets/products/brassiceye.webp';
import brassicPro from '../../assets/products/brassicpro.webp';
import norway from '../../assets/products/norway.webp';
import belgie from '../../assets/products/serum.webp';
import steffi from '../../assets/products/steffi.webp';

const BY_CATEGORY: Record<string, ImageSourcePropType> = {
  BP: bp,
  KID: bpGreen,
  BLUE: bpBlue,
  STEFFI: steffi,
  BRE: brassicEye,
  BRO: brassicPro,
  NORWAY: norway,
  BELGIE: belgie,
};

const BY_NAME: [RegExp, ImageSourcePropType][] = [
  [/green|kid/i, bpGreen],
  [/blue/i, bpBlue],
  [/steffi/i, steffi],
  [/brassic\s*eye|\bbre\b/i, brassicEye],
  [/brassic\s*pro|\bbro\b/i, brassicPro],
  [/norway/i, norway],
  [/belgie|serum|cream|facial|tonic/i, belgie],
  [/\bbp\b|propolis/i, bp],
];

/** Product photo for a catalog category code or a saved product name; null when unknown. */
export function productImage(nameOrCategory: string): ImageSourcePropType | null {
  return BY_CATEGORY[nameOrCategory.toUpperCase()] ?? BY_NAME.find(([re]) => re.test(nameOrCategory))?.[1] ?? null;
}
