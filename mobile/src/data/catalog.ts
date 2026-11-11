import { toCatalog, type MasterProductRow } from '~/lib/orderMath';
import { untyped } from './db';

export async function getCatalog() {
  const { data, error } = await untyped
    .from('master_products')
    .select('id, name, category, package_type, quantity_per_package, price, is_active')
    .eq('is_active', true);
  if (error) throw error;
  return toCatalog((data ?? []) as MasterProductRow[]);
}
