/** Rupiah formatting that does not depend on the JS engine's Intl support. */
export function formatRupiah(amount: number): string {
  const rounded = Math.round(Number.isFinite(amount) ? amount : 0);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}Rp${digits}`;
}

/** Compact form for tight spaces: Rp1,2jt / Rp850rb. */
export function formatRupiahShort(amount: number): string {
  const value = Math.round(amount);
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, '').replace('.', ',');
  if (abs >= 1_000_000_000) return `${sign}Rp${trim(abs / 1_000_000_000)}M`;
  if (abs >= 1_000_000) return `${sign}Rp${trim(abs / 1_000_000)}jt`;
  if (abs >= 1_000) return `${sign}Rp${trim(abs / 1_000)}rb`;
  return `${sign}Rp${abs}`;
}

/** Parse user input such as "25.000", "25000" or "Rp 25.000" into whole rupiah. Returns null when empty/invalid. */
export function parseRupiahInput(text: string): number | null {
  const digits = text.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

export function formatNumberInput(value: number | null): string {
  if (value == null) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
