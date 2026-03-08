// ============================================================
// geminiRAG.ts — via Lovable AI edge function
// ============================================================

import { supabase } from "@/integrations/supabase/client";

// ── Tipe data ─────────────────────────────────────────────────────
export interface RAGResult {
    empati: string;
    edukasi: string;
    tips_gaya_hidup: { icon: string; title: string; description: string }[];
    rekomendasi: { name: string; emoji: string; reason: string; price: string }[];
    cta: string;
    testimonials?: { id: string; text: string; sender: string }[];
}

// ── Cache ──────────────────────────────────────────────────────────
const CACHE_TTL_HOURS = 24;
const CACHE_PREFIX = 'bp_gemini_v1_';

interface CacheEntry { value: string; expiry: number; }

function buildCacheKey(input: string): string {
    const normalized = input.toLowerCase().trim().replace(/\s+/g, ' ').substring(0, 200);
    return CACHE_PREFIX + btoa(encodeURIComponent(normalized)).replace(/=/g, '');
}

function readCache(key: string): string | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const entry: CacheEntry = JSON.parse(raw);
        if (Date.now() > entry.expiry) { localStorage.removeItem(key); return null; }
        return entry.value;
    } catch { return null; }
}

function writeCache(key: string, value: string): void {
    try {
        localStorage.setItem(key, JSON.stringify({ value, expiry: Date.now() + CACHE_TTL_HOURS * 3600000 }));
    } catch { /* storage full */ }
}

export function clearExpiredCache(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    for (const key of keys) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const entry: CacheEntry = JSON.parse(raw);
            if (Date.now() > entry.expiry) localStorage.removeItem(key);
        } catch { localStorage.removeItem(key); }
    }
}

// ── Dynamic Fallback ──────────────────────────────────────────────
const FALLBACK_RULES: Record<string, { tips: any[]; products: string[] }> = {
    tidur: {
        tips: [
            { icon: '🌙', title: 'Power Down', description: 'Matikan gadget 60 menit sebelum tidur agar hormon melatonin bekerja optimal.' },
            { icon: '🍵', title: 'Chamomile Tea', description: 'Minum seduhan hangat untuk menenangkan sistem saraf pusat.' }
        ],
        products: ['Brassic Pro', 'British Propolis']
    },
    sendi: {
        tips: [
            { icon: '🧘', title: 'Stretching Rendah Kompresi', description: 'Lakukan peregangan ringan setiap pagi untuk melumasi persendian.' },
            { icon: '🔥', title: 'Kompres Hangat', description: 'Gunakan handuk hangat pada area nyeri selama 15 menit.' }
        ],
        products: ['Brassic Pro', 'British Propolis']
    },
    anak: {
        tips: [
            { icon: '🥦', title: 'Visual Food Styling', description: 'Hias makanan dengan bentuk menarik untuk meningkatkan minat makan si kecil.' },
            { icon: '🕒', title: 'Jadwal Konsisten', description: 'Berikan snack sehat di jam yang sama agar metabolisme anak terbentuk.' }
        ],
        products: ['British Propolis Green']
    },
    wanita: {
        tips: [
            { icon: '🧘', title: 'Peregangan Panggul', description: 'Lakukan pose yoga ringan untuk melancarkan sirkulasi di area reproduksi.' },
            { icon: '🍫', title: 'Dark Chocolate', description: 'Konsumsi cokelat hitam tanpa gula untuk bantu redakan kram perut.' }
        ],
        products: ['British Propolis Blue']
    },
    mata: {
        tips: [
            { icon: '👁️', title: 'Aturan 20-20-20', description: 'Tiap 20 menit, lihat objek sejauh 20 kaki selama 20 detik untuk rileksasi mata.' },
            { icon: '🥕', title: 'Cukupan Vitamin A', description: 'Konsumsi asupan bergizi untuk memperkuat sel retina mata.' }
        ],
        products: ['Brassic Eye']
    }
};

function getDynamicFallback(query: string): RAGResult {
    const q = query.toLowerCase();
    let selected = FALLBACK_RULES['tidur'];

    if (q.includes('anak') || q.includes('makan')) selected = FALLBACK_RULES['anak'];
    else if (q.includes('sendi') || q.includes('tulang') || q.includes('pegal')) selected = FALLBACK_RULES['sendi'];
    else if (q.includes('haid') || q.includes('wanita') || q.includes('hormon')) selected = FALLBACK_RULES['wanita'];
    else if (q.includes('mata') || q.includes('lelah')) selected = FALLBACK_RULES['mata'];

    const productDetails: Record<string, { emoji: string; reason: string }> = {
        'British Propolis': { emoji: '🍯', reason: 'Antijamur & antivirus alami untuk daya tahan tubuh' },
        'British Propolis Green': { emoji: '🧒', reason: 'Nutrisi otak & imun khusus diformulasikan untuk anak' },
        'British Propolis Blue': { emoji: '💜', reason: 'Solusi hormonal & sistem reproduksi wanita' },
        'Brassic Pro': { emoji: '💪', reason: 'Atasi insomnia & nyeri sendi dengan ekstrak Moringa' },
        'Brassic Eye': { emoji: '👁️', reason: 'Perlindungan mata dari radiasi gadget & mata lelah' },
    };

    return {
        empati: "Kami memahami kondisi yang kamu alami. Jaga semangat ya, kesehatan adalah investasi terbaik 🌿",
        edukasi: "Banyak masalah kesehatan ringan berawal dari pola istirahat dan nutrisi yang kurang seimbang.",
        tips_gaya_hidup: selected.tips,
        rekomendasi: selected.products.map(name => ({
            name,
            emoji: productDetails[name]?.emoji || '🌿',
            reason: productDetails[name]?.reason || 'Mendukung kesehatan tubuh secara menyeluruh',
            price: 'Rp 250.000'
        })),
        cta: "Untuk saran lebih akurat, konsultasikan langsung via chat — gratis! 💬",
        testimonials: []
    };
}

// ── Fungsi utama ──────────────────────────────────────────────────
export async function generateAIAdvice(selectedComplaints: string[], complaintText: string): Promise<RAGResult> {
    const userInput = (complaintText || selectedComplaints.join(', ')).trim();

    if (!userInput) {
        return getDynamicFallback('');
    }

    // 1. Cache check
    const cacheKey = buildCacheKey(userInput);
    const cached = readCache(cacheKey);
    if (cached) {
        console.info('[AI] ✅ Cache hit');
        try { return { ...JSON.parse(cached), testimonials: [] }; }
        catch { localStorage.removeItem(cacheKey); }
    }

    // 2. Call edge function
    try {
        console.info('[AI] 🔄 Calling edge function...');
        const { data, error } = await supabase.functions.invoke('ai-konsultasi', {
            body: { userInput }
        });

        if (error) {
            console.error('[AI] Edge function error:', error);
            return getDynamicFallback(userInput);
        }

        if (data?.error) {
            console.error('[AI] API error:', data.error);
            return getDynamicFallback(userInput);
        }

        // Cache result
        writeCache(cacheKey, JSON.stringify(data));
        console.info('[AI] ✅ Berhasil');

        return { ...data, testimonials: [] };
    } catch (err) {
        console.error('[AI] ❌ Error:', err);
        return getDynamicFallback(userInput);
    }
}
