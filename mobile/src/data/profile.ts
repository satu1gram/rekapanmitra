import { MITRA_LEVELS, type MitraLevel } from '@/types';
import { supabase } from '~/lib/supabase';
import { requireUserId, type ProfileRow } from './db';

export type Profile = Omit<ProfileRow, 'mitra_level'> & { mitra_level: MitraLevel };

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const level = (data.mitra_level in MITRA_LEVELS ? data.mitra_level : 'reseller') as MitraLevel;
  return { ...data, mitra_level: level };
}

export function levelLabel(profile: Profile | null | undefined): string {
  if (!profile) return '';
  if (profile.mitra_level === 'custom') return profile.custom_level_name || MITRA_LEVELS.custom.label;
  return MITRA_LEVELS[profile.mitra_level].label;
}

export async function updateProfile(fields: { name?: string; phone?: string | null; location?: string | null }) {
  const userId = await requireUserId();
  const { error } = await supabase.from('profiles').update(fields).eq('user_id', userId);
  if (error) throw error;
}

export async function updateMitraLevel(level: MitraLevel, custom?: { name: string; buyPrice: number }) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('profiles')
    .update({
      mitra_level: level,
      custom_level_name: level === 'custom' ? custom?.name.trim() || null : null,
      custom_buy_price: level === 'custom' ? custom?.buyPrice ?? null : null,
    })
    .eq('user_id', userId);
  if (error) throw error;
}

export interface OnboardingInput {
  name: string;
  phone: string;
  mitraLevel: MitraLevel;
  customLevelName: string;
  customBuyPrice: number | null;
  initialStock: number;
}

/** Same writes as the web onboarding (store setup is left to the web app). */
export async function completeOnboarding(input: OnboardingInput) {
  const userId = await requireUserId();
  const effectiveBuyPrice = input.mitraLevel === 'custom' ? input.customBuyPrice ?? 0 : MITRA_LEVELS[input.mitraLevel].buyPricePerBottle;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      name: input.name.trim(),
      phone: input.phone.trim() || null,
      mitra_level: input.mitraLevel,
      custom_level_name: input.mitraLevel === 'custom' ? input.customLevelName.trim() : null,
      custom_buy_price: input.mitraLevel === 'custom' ? input.customBuyPrice : null,
      onboarding_completed: true,
    })
    .eq('user_id', userId);
  if (profileError) throw profileError;

  if (input.initialStock > 0) {
    const { error: entryError } = await supabase.from('stock_entries').insert({
      user_id: userId,
      type: 'in',
      quantity: input.initialStock,
      tier: input.mitraLevel === 'custom' ? 'reseller' : input.mitraLevel,
      buy_price_per_bottle: effectiveBuyPrice,
      total_buy_price: input.initialStock * effectiveBuyPrice,
      notes: 'Stok awal (setup onboarding)',
    });
    if (entryError) throw entryError;
    const { data: existing, error: readError } = await supabase.from('user_stock').select('id').eq('user_id', userId).maybeSingle();
    if (readError) throw readError;
    const { error } = existing
      ? await supabase.from('user_stock').update({ current_stock: input.initialStock }).eq('user_id', userId)
      : await supabase.from('user_stock').insert({ user_id: userId, current_stock: input.initialStock });
    if (error) throw error;
  }
}
