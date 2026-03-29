import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { MitraLevel, MITRA_LEVELS } from '@/types';
import type { PaymentInfo } from './useStoreSettings';

export interface OnboardingProductData {
    name: string;
    include: boolean;
    sellPrice: number;
    defaultSellPrice: number;
}

export interface OnboardingData {
    // Step 2
    name: string;
    phone: string;
    mitraLevel: MitraLevel;
    customLevelName: string;   // hanya untuk mitraLevel === 'custom'
    customBuyPrice: number;    // hanya untuk mitraLevel === 'custom'
    // Step 3 (Stok Awal)
    initialStock: number;
    // Step 4 (Toko Publik)
    storeName: string;
    slug: string;
    paymentInfo: PaymentInfo[];
    welcomeMessage: string;
}

export function useOnboarding() {
    const { user } = useAuth();
    const { profile, loading: profileLoading } = useProfile();
    const [isComplete, setIsComplete] = useState<boolean | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Wait for profile loading to finish before making decisions
        if (profileLoading) return;

        if (!user) {
            setIsComplete(true); // not logged in — don't show wizard
            return;
        }

        // If loading is done and profile is still null, it means no profile record exists
        if (profile === null) {
            setIsComplete(false); 
            return;
        }

        // Explicitly check the flag
        setIsComplete(!!(profile as any).onboarding_completed);
    }, [user, profile, profileLoading]);

    const completeOnboarding = useCallback(async (data: OnboardingData) => {
        if (!user) throw new Error('User not authenticated');
        setSaving(true);

        try {
            // Tentukan buy price efektif
            const effectiveBuyPrice =
                data.mitraLevel === 'custom'
                    ? data.customBuyPrice
                    : MITRA_LEVELS[data.mitraLevel]?.buyPricePerBottle ?? 0;

            // 1. Save profile
            await supabase
                .from('profiles')
                .update({
                    name: data.name.trim(),
                    phone: data.phone.trim() || null,
                    mitra_level: data.mitraLevel,
                    custom_level_name: data.mitraLevel === 'custom' ? data.customLevelName.trim() : null,
                    custom_buy_price: data.mitraLevel === 'custom' ? data.customBuyPrice : null,
                    onboarding_completed: true,
                } as any)
                .eq('user_id', user.id);

            // 2. Save initial stock if > 0
            if (data.initialStock > 0) {
                await supabase.from('stock_entries').insert({
                    user_id: user.id,
                    type: 'in',
                    quantity: data.initialStock,
                    tier: data.mitraLevel === 'custom' ? 'reseller' : data.mitraLevel as any,
                    buy_price_per_bottle: effectiveBuyPrice,
                    total_buy_price: data.initialStock * effectiveBuyPrice,
                    notes: 'Stok awal (setup onboarding)',
                } as any);

                const { data: existing } = await supabase
                    .from('user_stock')
                    .select('id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (existing) {
                    await supabase
                        .from('user_stock')
                        .update({ current_stock: data.initialStock })
                        .eq('user_id', user.id);
                } else {
                    await supabase
                        .from('user_stock')
                        .insert({ user_id: user.id, current_stock: data.initialStock });
                }
            }

            // 3. Save store settings
            if (data.storeName.trim() && data.slug.trim()) {
                await supabase.from('store_settings' as any).insert({
                    user_id: user.id,
                    slug: data.slug.trim().toLowerCase(),
                    store_name: data.storeName.trim(),
                    is_active: true,
                    payment_info: data.paymentInfo,
                    welcome_message: data.welcomeMessage.trim() || null,
                });
            }

            setIsComplete(true);
        } finally {
            setSaving(false);
        }
    }, [user?.id]);

    return {
        isOnboardingComplete: isComplete,
        isOnboardingLoading: isComplete === null,
        saving,
        completeOnboarding,
    };
}
