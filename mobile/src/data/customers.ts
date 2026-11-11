import type { TierType } from '@/types';
import { normalizePhone, resolveCustomerMatch } from '@/lib/customerDedup';
import { supabase } from '~/lib/supabase';
import { fetchAllPages, requireUserId, type CustomerRow } from './db';

/** customers.phone is nullable in the database (unique per user when set); the generated type is stale. */
const NO_PHONE = null as unknown as string;

const TIER_ORDER: TierType[] = ['satuan', 'reseller', 'agen', 'agen_plus', 'sap', 'se'];

function upgradedTier(current: string, next: TierType): TierType {
  const currentTier = (TIER_ORDER.includes(current as TierType) ? current : 'satuan') as TierType;
  return TIER_ORDER.indexOf(next) > TIER_ORDER.indexOf(currentTier) ? next : currentTier;
}

export async function listCustomers(userId: string): Promise<CustomerRow[]> {
  return fetchAllPages<CustomerRow>((from, to) =>
    supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(from, to),
  );
}

/** Same matching and stats update as the web app's addOrUpdateCustomer (phone first, then name). */
export async function recordCustomerPurchase(
  customers: CustomerRow[],
  input: { customerName: string; customerPhone: string; tier: TierType; totalPrice: number },
): Promise<string> {
  const userId = await requireUserId();
  const existing = resolveCustomerMatch(customers, input) as CustomerRow | undefined;
  if (existing) {
    const { error } = await supabase
      .from('customers')
      .update({
        name: input.customerName.trim() || existing.name,
        phone: normalizePhone(input.customerPhone) || existing.phone || NO_PHONE,
        total_orders: existing.total_orders + 1,
        total_spent: Number(existing.total_spent) + input.totalPrice,
        tier: upgradedTier(existing.tier, input.tier),
      })
      .eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await supabase
    .from('customers')
    .insert({
      user_id: userId,
      name: input.customerName.trim(),
      phone: normalizePhone(input.customerPhone) || NO_PHONE,
      tier: input.tier,
      total_orders: 1,
      total_spent: input.totalPrice,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateCustomer(id: string, fields: { name: string; phone: string; address: string; city: string; province: string }) {
  const userId = await requireUserId();
  if (!fields.name.trim()) throw new Error('Nama pelanggan wajib diisi.');
  const { error } = await supabase
    .from('customers')
    .update({
      name: fields.name.trim(),
      phone: normalizePhone(fields.phone) || NO_PHONE,
      address: fields.address.trim() || null,
      city: fields.city.trim() || null,
      province: fields.province.trim() || null,
    })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) {
    if ((error as { code?: string }).code === '23505') throw new Error('Nomor WhatsApp ini sudah dipakai pelanggan lain.');
    throw error;
  }
}
