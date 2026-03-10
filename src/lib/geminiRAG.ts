// ============================================================
// aiAdvisor.ts — via Groq AI (Llama 3.3)
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
const CACHE_PREFIX = 'bp_gemini_v2_';

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

const SYSTEM_PROMPT = `Kamu adalah konsultan kesehatan senior yang hangat dan empatik dari BP Group.

[LOGIC RULES]:
- Jika keluhan anak/makan -> WAJIB sarankan "British Propolis Green".
- Jika keluhan haid/wanita/promil -> WAJIB sarankan "British Propolis Blue".
- Jika keluhan tidur/sendi/linu -> WAJIB sarankan "Brassic Pro".
- Jika keluhan mata -> WAJIB sarankan "Brassic Eye".
- Jika keluhan kulit/flek -> WAJIB sarankan "Belgie Anti Aging Serum" DAN "Belgie Facial Wash".
- Jika keluhan gula darah/diabetes -> WAJIB sarankan "Steffi Pro".
- British Propolis (Reguler) adalah general imunitas untuk dewasa.

INSTRUKSI OUTPUT:
1. Empati: Akui perasaan mereka dengan tulus (2 kalimat).
2. Edukasi: Jelaskan akar masalahnya secara sederhana (1 paragraf).
3. Tips Gaya Hidup: 3 tips KONKRET & NON-UMUM. (Hindari "minum air/tidur cukup" kecuali sangat relevan). Beri tips yang 'insightful'.
4. Rekomendasi: 2-3 Produk BP Group yang paling akurat sesuai [LOGIC RULES]. Gunakan NAMA PERSIS seperti di daftar di bawah. Beri ALASAN yang menyambungkan gejala mereka dengan manfaat produk.

DAFTAR NAMA PRODUK WAJIB (Gunakan Nama Ini Persis):
- British Propolis
- British Propolis Green
- British Propolis Blue
- Brassic Pro
- Brassic Eye
- Belgie Anti Aging Serum
- Belgie Facial Wash
- Belgie Day Cream
- Belgie Night Cream
- Steffi Pro
- BP Norway

PENTING: Jawab HANYA dalam format JSON valid berikut, tanpa markdown atau teks tambahan:
{
  "empati": "string",
  "edukasi": "string",
  "tips_gaya_hidup": [
    { "icon": "string", "title": "string", "description": "string" }
  ],
  "rekomendasi": [
    { "name": "string", "emoji": "string", "reason": "string", "price": "string" }
  ],
  "cta": "string"
}
`;

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

    // 2. Direct Groq API Call
    try {
        const apiKey = import.meta.env.VITE_GROQ_API_KEY;
        if (!apiKey) {
            console.warn('[AI] VITE_GROQ_API_KEY missing, using fallback');
            return getDynamicFallback(userInput);
        }

        console.info('[AI] 🔄 Calling Groq API...');

        const response = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: userInput }
                    ],
                    temperature: 0.8,
                    max_tokens: 1024,
                    response_format: { type: "json_object" }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const rawText = data?.choices?.[0]?.message?.content;

        if (!rawText) {
            throw new Error('Empty response from Groq');
        }

        const parsed = JSON.parse(rawText);

        // Cache result
        writeCache(cacheKey, JSON.stringify(parsed));
        console.info('[AI] ✅ Berhasil');

        return { ...parsed, testimonials: [] };

    } catch (err) {
        console.error('[AI] ❌ Error:', err);
        return getDynamicFallback(userInput);
    }
}
