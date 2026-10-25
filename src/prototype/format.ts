import { formatCurrency } from '@/lib/formatters';
import { MULA_PRODUCTS } from '@/lib/mulaBusiness';

export const money = (value: number | null | undefined) => value == null ? 'Belum tersedia' : formatCurrency(value);
export const productName = (sku: string) => MULA_PRODUCTS.find(p => p.sku === sku)?.name ?? sku;
