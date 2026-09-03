const PRODUCT_ALIASES: Array<[RegExp, string]> = [
  [/brassic\s+eye|\beye\b/i, 'Brassic Eye'],
  [/brassic\s+pro|\bpro\b/i, 'Brassic Pro'],
  [/british\s+propolis\s+green|\bbp\s+green\b|\bkids?\b/i, 'British Propolis Green'],
  [/british\s+propolis\s+blue|\bbp\s+blue\b/i, 'British Propolis Blue'],
  [/bp\s+norway|norway/i, 'BP Norway'],
  [/belgie/i, 'Belgie'],
  [/steffi/i, 'Steffi'],
  [/(?:\bbp\b|british\s+propolis)/i, 'British Propolis'],
  [/\bbro\b/i, 'Brassic Pro'],
  [/\bbre\b/i, 'Brassic Eye'],
];

export function getCanonicalProductLabel(name: string): string {
  const alias = PRODUCT_ALIASES.find(([pattern]) => pattern.test(name));
  return alias?.[1] || name;
}
