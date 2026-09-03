const PRODUCT_ALIASES: Array<[RegExp, string]> = [
  [/belgie/i, 'BELGIE'],
  [/steffi/i, 'STEFFI'],
  [/(?:\bbp\b|british\s+propolis)/i, 'BP'],
  [/\bbro\b/i, 'BRO'],
  [/\bbre\b/i, 'BRE'],
  [/norway/i, 'NORWAY'],
];

export function getCanonicalProductLabel(name: string): string {
  const alias = PRODUCT_ALIASES.find(([pattern]) => pattern.test(name));
  return alias?.[1] || name;
}
