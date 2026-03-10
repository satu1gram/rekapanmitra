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

            const rows_mapped = (rows as any[] || []).map(r => {
                const content = (r.content || '').toLowerCase();
                const produk = (r.produk || '').toLowerCase();

                // Simple auto-tagging based on content if tags are missing from DB
                const tags: string[] = r.tags || [];
                if (tags.length === 0) {
                    if (content.includes('tidur') || content.includes('lelap') || content.includes('insomnia')) tags.push('susah_tidur', 'insomnia');
                    if (content.includes('sendi') || content.includes('lutut') || content.includes('asam urat') || content.includes('rematik') || content.includes('linu') || content.includes('pegal')) tags.push('nyeri_sendi', 'asam_urat', 'rematik');
                    if (content.includes('imun') || content.includes('daya tahan') || content.includes('sakit') || content.includes('flu') || content.includes('bersin') || content.includes('panas')) tags.push('imun', 'daya_tahan', 'flu');
                    if (content.includes('mata') || content.includes('rabun') || content.includes('lelah')) tags.push('mata');
                    if (content.includes('gula') || content.includes('diabetes') || content.includes('manis')) tags.push('gula_darah', 'diabetes');
                    if (content.includes('makan') || content.includes('lahap') || content.includes('anak')) tags.push('nafsu_makan', 'anak');
                    if (content.includes('stamina') || content.includes('energi') || content.includes('lemas') || content.includes('capek') || content.includes('letih')) tags.push('stamina', 'energi');
                    if (content.includes('fokus') || content.includes('konsentrasi') || content.includes('otak') || content.includes('ingatan')) tags.push('fokus', 'konsentrasi');
                    if (content.includes('kulit') || content.includes('kusam') || content.includes('flek') || content.includes('jerawat') || content.includes('muka')) tags.push('kulit', 'flek');
                    if (content.includes('rambut') || content.includes('rontok')) tags.push('rambut');

                    // Product based tagging
                    if (produk.includes('british propolis')) tags.push('imun', 'stamina', 'pemulihan');
                    if (produk.includes('brassic pro')) tags.push('susah_tidur', 'nyeri_sendi');
                    if (produk.includes('brassic eye')) tags.push('mata');
                    if (produk.includes('belgie')) tags.push('kulit', 'flek');
                    if (produk.includes('steffi')) tags.push('gula_darah', 'diabetes');
                }

                return { ...r, tags };
            });

            setData(rows_mapped as Testimoni[]);
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
