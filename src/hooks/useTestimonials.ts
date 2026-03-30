// src/hooks/useTestimonials.ts

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Testimoni } from '@/types/testimoni';

// Fisher-Yates shuffle algorithm untuk randomisasi
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Enhanced shuffle: featured testimonials tetap di awal, non-featured di-shuffle
function shuffleTestimonials(testimonials: Testimoni[]): Testimoni[] {
    const featured = testimonials.filter(t => t.is_featured);
    const regular = testimonials.filter(t => !t.is_featured);
    
    // Shuffle hanya regular testimonials
    const shuffledRegular = shuffleArray(regular);
    
    // Featured tetap di awal, regular di-shuffle di belakang
    return [...featured, ...shuffledRegular];
}

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
                .from('telegram_messages' as any)
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

                // Auto-tagging: CONTENT first (specific > generic)
                const tags: string[] = r.tags ? [...r.tags] : [];
                if (tags.length === 0) {
                    // 1. Highly-specific content tags — checked first, take priority
                    if (content.includes('haid') || content.includes('kista') || content.includes('hormon') ||
                        content.includes('mens') || content.includes('datang bulan') || content.includes('promil') ||
                        content.includes('rahim') || content.includes('nyeri haid') || content.includes('siklus'))
                        tags.push('haid', 'hormon', 'wanita');

                    if (content.includes('rambut') || content.includes('rontok') || content.includes('kebotakan') ||
                        content.includes('ketombe'))
                        tags.push('rambut');

                    if (content.includes('kulit') || content.includes('kusam') || content.includes('flek') ||
                        content.includes('jerawat') || content.includes('muka') || content.includes('wajah') ||
                        content.includes('anti aging') || content.includes('serum'))
                        tags.push('kulit', 'flek');

                    if (content.includes('gula') || content.includes('diabetes') || content.includes('manis') ||
                        content.includes('kadar gula') || content.includes('darah tinggi'))
                        tags.push('gula_darah', 'diabetes');

                    if (content.includes('mata') || content.includes('rabun'))
                        tags.push('mata');

                    if (content.includes('makan') || content.includes('lahap') || content.includes('nafsu') ||
                        (content.includes('anak') && !content.includes('kanker')))
                        tags.push('nafsu_makan', 'anak');

                    if (content.includes('sendi') || content.includes('lutut') || content.includes('asam urat') ||
                        content.includes('rematik') || content.includes('linu') || content.includes('pegal'))
                        tags.push('nyeri_sendi', 'asam_urat', 'rematik');

                    if (content.includes('tidur') || content.includes('lelap') || content.includes('insomnia'))
                        tags.push('susah_tidur', 'insomnia');

                    if (content.includes('fokus') || content.includes('konsentrasi') || content.includes('otak') ||
                        content.includes('ingatan') || content.includes('memory'))
                        tags.push('fokus', 'konsentrasi');

                    if (content.includes('stamina') || content.includes('energi') || content.includes('lemas') ||
                        content.includes('capek') || content.includes('letih'))
                        tags.push('stamina', 'energi');

                    // Flu/imun: ONLY if content explicitly mentions it (not inferred from product)
                    if (content.includes('flu') || content.includes('bersin') || content.includes('pilek') ||
                        content.includes('demam') || content.includes('panas badan'))
                        tags.push('flu');

                    if (content.includes('imun') || content.includes('daya tahan') || content.includes('imunitas'))
                        tags.push('imun', 'daya_tahan');

                    // 2. Product-based tags as FALLBACK — ONLY if no content-specific tags found
                    if (tags.length === 0) {
                        if (produk.includes('british propolis blue')) tags.push('haid', 'hormon', 'wanita');
                        else if (produk.includes('british propolis green')) tags.push('nafsu_makan', 'anak');
                        else if (produk.includes('british propolis') || produk.includes('bp norway')) tags.push('imun', 'stamina', 'pemulihan');
                        if (produk.includes('brassic pro')) tags.push('susah_tidur', 'nyeri_sendi');
                        if (produk.includes('brassic eye')) tags.push('mata');
                        if (produk.includes('belgie hair')) tags.push('rambut');
                        else if (produk.includes('belgie')) tags.push('kulit', 'flek');
                        if (produk.includes('steffi')) tags.push('gula_darah', 'diabetes');
                    }
                }

                // Deduplicate tags
                const uniqueTags = [...new Set(tags)];
                return { ...r, tags: uniqueTags };
            });

            // Apply enhanced shuffle untuk randomisasi setiap fetch
            const shuffledData = shuffleTestimonials(rows_mapped as Testimoni[]);
            console.log('[useTestimonials] 🎲 Shuffled testimonials:', shuffledData.length, 'items');
            console.log('[useTestimonials] ⭐ Featured count:', shuffledData.filter(t => t.is_featured).length);
            console.log('[useTestimonials] 🔄 First 3 IDs after shuffle:', shuffledData.slice(0, 3).map(t => t.id));
            setData(shuffledData);
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
