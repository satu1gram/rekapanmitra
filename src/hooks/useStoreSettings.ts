import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PaymentInfo {
    type: 'bank' | 'ewallet' | 'cod';
    name: string;        // Nama bank/e-wallet (e.g. "BCA", "GoPay")
    account_name: string; // Nama pemilik rekening
    number: string;      // Nomor rekening / nomor HP
}

export interface StoreSettings {
    id: string;
    user_id: string;
    slug: string;
    store_name: string;
    is_active: boolean;
    payment_info: PaymentInfo[];
    welcome_message: string | null;
    created_at: string;
    updated_at: string;
}

// For public (unauthenticated) access — fetch store by slug
export async function fetchPublicStore(slug: string): Promise<{
    store: Pick<StoreSettings, 'store_name' | 'is_active' | 'payment_info' | 'welcome_message' | 'user_id'> | null;
    products: { id: string; name: string; default_sell_price: number }[];
}> {
    // Fetch store settings
    const { data: storeData, error: storeError } = await supabase
        .from('store_settings' as any)
        .select('store_name, is_active, payment_info, welcome_message, user_id')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

    if (storeError || !storeData) {
        return { store: null, products: [] };
    }

    const store = storeData as any;

    // Fetch active products for this store
    const { data: productsData } = await supabase
        .from('products' as any)
        .select('id, name, default_sell_price')
        .eq('user_id', store.user_id)
        .eq('is_active', true)
        .order('name', { ascending: true });

    return {
        store: {
            store_name: store.store_name,
            is_active: store.is_active,
            payment_info: (store.payment_info || []) as PaymentInfo[],
            welcome_message: store.welcome_message,
            user_id: store.user_id,
        },
        products: ((productsData || []) as any[]).map((p: any) => ({
            id: p.id,
            name: p.name,
            default_sell_price: Number(p.default_sell_price),
        })),
    };
}

// Submit a public order (unauthenticated) — via SECURITY DEFINER RPC to bypass RLS
export async function submitPublicOrder(orderData: {
    slug: string;       // slug toko untuk validasi server-side
    userId: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    items: { productId: string; productName: string; quantity: number; pricePerBottle: number; subtotal: number }[];
    totalPrice: number;
}): Promise<{ success: boolean; orderId?: string; error?: string }> {

    const payload = {
        slug: orderData.slug,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_address: orderData.customerAddress || '',
        items: orderData.items.map(i => ({
            product_id: i.productId || '',
            product_name: i.productName,
            quantity: i.quantity,
            price_per_bottle: i.pricePerBottle,
            subtotal: i.subtotal,
        })),
    };

    const { data, error } = await (supabase as any).rpc('submit_public_order', { payload });

    if (error) {
        console.error('RPC submit_public_order error:', error);
        return { success: false, error: error.message };
    }

    const result = data as { success: boolean; order_id?: string; error?: string };
    if (!result?.success) {
        return { success: false, error: result?.error || 'Gagal mengirim pesanan' };
    }

    return { success: true, orderId: result.order_id };
}




// Hook for authenticated seller to manage their store settings
export function useStoreSettings() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<StoreSettings | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        if (!user) {
            setSettings(null);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('store_settings' as any)
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching store settings:', error);
        } else if (data) {
            const d = data as any;
            setSettings({
                id: d.id,
                user_id: d.user_id,
                slug: d.slug,
                store_name: d.store_name,
                is_active: d.is_active,
                payment_info: (d.payment_info || []) as PaymentInfo[],
                welcome_message: d.welcome_message,
                created_at: d.created_at,
                updated_at: d.updated_at,
            });
        }

        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const saveSettings = useCallback(async (data: {
        slug: string;
        store_name: string;
        is_active: boolean;
        payment_info: PaymentInfo[];
        welcome_message?: string;
    }) => {
        if (!user) throw new Error('User not authenticated');

        if (settings) {
            // Update existing
            const { error } = await supabase
                .from('store_settings' as any)
                .update({
                    slug: data.slug,
                    store_name: data.store_name,
                    is_active: data.is_active,
                    payment_info: data.payment_info,
                    welcome_message: data.welcome_message || null,
                })
                .eq('user_id', user.id);

            if (error) throw error;
        } else {
            // Insert new
            const { error } = await supabase
                .from('store_settings' as any)
                .insert({
                    user_id: user.id,
                    slug: data.slug,
                    store_name: data.store_name,
                    is_active: data.is_active,
                    payment_info: data.payment_info,
                    welcome_message: data.welcome_message || null,
                });

            if (error) throw error;
        }

        await fetchSettings();
    }, [user, settings, fetchSettings]);

    const toggleActive = useCallback(async (isActive: boolean) => {
        if (!user || !settings) throw new Error('No settings found');

        const { error } = await supabase
            .from('store_settings' as any)
            .update({ is_active: isActive })
            .eq('user_id', user.id);

        if (error) throw error;
        setSettings(prev => prev ? { ...prev, is_active: isActive } : prev);
    }, [user, settings]);

    const getStoreUrl = useCallback(() => {
        if (!settings?.slug) return '';
        return `${window.location.origin}/toko/${settings.slug}`;
    }, [settings]);

    return {
        settings,
        loading,
        saveSettings,
        toggleActive,
        getStoreUrl,
        refetch: fetchSettings,
    };
}
