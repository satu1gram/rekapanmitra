// src/hooks/useTestimonials.ts

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Testimoni } from '@/types/testimoni';

const COLUMNS = [
    'id',
    'content',
    'sender',
    'created_at',
    'foto_url',
    'is_featured',
    'nama_pengirim',
    'kota',
    'produk',
    'bintang',
].join(', ');

interface UseTestimonialsOptions {
    featured?: boolean;
    produk?: string;
    limit?: number;
}

interface UseTestimonialsReturn {
    data: Testimoni[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useTestimonials(
    opts: UseTestimonialsOptions = {}
): UseTestimonialsReturn {
    const [data, setData] = useState<Testimoni[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('telegram_messages' as any) // Use 'as any' if types are not yet updated
                .select(COLUMNS)
                .eq('is_testimoni', true)
                .eq('status', 'approved')
                .order('is_featured', { ascending: false })
                .order('created_at', { ascending: false });

            if (opts.featured) query = query.eq('is_featured', true);
            if (opts.produk) query = query.ilike('produk', `%${opts.produk}%`);
            if (opts.limit) query = query.limit(opts.limit);

            const { data: rows, error: qError } = await query;

            if (qError) throw qError;
            setData((rows as unknown as Testimoni[]) || []);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Gagal memuat testimoni';
            setError(msg);
            console.error('[useTestimonials]', err);
        } finally {
            setLoading(false);
        }
    }, [opts.featured, opts.produk, opts.limit]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
