import { requireUserId, untyped } from './db';

export interface PaymentInfo {
  type: 'bank' | 'ewallet' | 'cod';
  name: string;
  account_name: string;
  number: string;
}

export interface StoreSettings {
  slug: string;
  store_name: string;
  is_active: boolean;
  payment_info: PaymentInfo[];
  welcome_message: string | null;
}

export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function getStoreSettings(userId: string): Promise<StoreSettings | null> {
  const { data, error } = await untyped
    .from('store_settings')
    .select('slug, store_name, is_active, payment_info, welcome_message')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, payment_info: Array.isArray(data.payment_info) ? data.payment_info : [] } as StoreSettings;
}

export async function saveStoreSettings(settings: StoreSettings, exists: boolean) {
  const userId = await requireUserId();
  const slug = slugify(settings.slug);
  if (!settings.store_name.trim()) throw new Error('Isi nama toko.');
  if (slug.length < 3) throw new Error('Alamat toko minimal 3 huruf/angka.');
  const row = {
    slug,
    store_name: settings.store_name.trim(),
    is_active: settings.is_active,
    payment_info: settings.payment_info.filter(p => p.name.trim() || p.number.trim() || p.type === 'cod'),
    welcome_message: settings.welcome_message?.trim() || null,
  };
  const { error } = exists
    ? await untyped.from('store_settings').update(row).eq('user_id', userId)
    : await untyped.from('store_settings').insert({ ...row, user_id: userId });
  if (error) {
    const msg = (error as { message?: string; code?: string });
    if (msg.code === '23505' || /duplicate|unique/i.test(msg.message ?? '')) throw new Error('Alamat toko ini sudah dipakai. Coba alamat lain.');
    throw error;
  }
}
