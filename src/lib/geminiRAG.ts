// ============================================================
// geminiRAG.ts — versi dengan cache + retry + fallback
// Model: gemini-1.5-flash (1.500 request/hari — gratis)
// ============================================================

import { supabase } from "@/integrations/supabase/client";

// ── Konstanta ────────────────────────────────────────────────────
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_URL = [
    'https://generativelanguage.googleapis.com/v1beta/models/',
    GEMINI_MODEL,
    ':generateContent?key=',
    GEMINI_API_KEY,
].join('');

const CACHE_TTL_HOURS = 24;  // Cache berlaku 24 jam
const CACHE_PREFIX = 'bp_gemini_v1_';

// ── Tipe data ─────────────────────────────────────────────────────
export interface RAGResult {
    empati: string;
    edukasi: string;
    tips_gaya_hidup: { icon: string; title: string; description: string }[];
    rekomendasi: { name: string; emoji: string; reason: string; price: string }[];
    cta: string;
    testimonials?: { id: string; text: string; sender: string }[];
}

interface CacheEntry {
    value: string;
    expiry: number;
}

// ── Cache helpers ─────────────────────────────────────────────────
function buildCacheKey(input: string): string {
    const normalized = input
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .substring(0, 200); // batasi panjang key
    return CACHE_PREFIX + btoa(encodeURIComponent(normalized)).replace(/=/g, '');
}

function readCache(key: string): string | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        const entry: CacheEntry = JSON.parse(raw);
        if (Date.now() > entry.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return entry.value;
    } catch {
        return null;
    }
}

function writeCache(key: string, value: string): void {
    try {
        const entry: CacheEntry = {
            value,
            expiry: Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000,
        };
        localStorage.setItem(key, JSON.stringify(entry));
    } catch {
        // Storage penuh — cache opsional, tidak perlu throw
        console.warn('[Gemini] Cache write failed — storage mungkin penuh');
    }
}

// ── Bersihkan cache lama (panggil sesekali) ───────────────────────
export function clearExpiredCache(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    for (const key of keys) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const entry: CacheEntry = JSON.parse(raw);
            if (Date.now() > entry.expiry) localStorage.removeItem(key);
        } catch {
            localStorage.removeItem(key);
        }
    }
}

// ── Delay helper ───────────────────────────────────────────────────
const wait = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

// ── Dynamic Fallback (Smart local advisor for rate-limited sessions) ─────
const FALLBACK_RULES: Record<string, { tips: any[], products: string[] }> = {
    'tidur': {
        tips: [
            { icon: '🌙', title: 'Power Down', description: 'Matikan gadget 60 menit sebelum tidur agar hormon melatonin bekerja optimal.' },
            { icon: '🍵', title: 'Chamomile Tea', description: 'Minum seduhan hangat untuk menenangkan sistem saraf pusat.' }
        ],
        products: ['Brassic Pro', 'British Propolis']
    },
    'sendi': {
        tips: [
            { icon: '🧘', title: 'Stretching Rendah Kompresi', description: 'Lakukan peregangan ringan setiap pagi untuk melumasi persendian.' },
            { icon: '🔥', title: 'Kompres Hangat', description: 'Gunakan handuk hangat pada area nyeri selama 15 menit.' }
        ],
        products: ['Brassic Pro', 'British Propolis']
    },
    'anak': {
        tips: [
            { icon: '🥦', title: 'Visual Food Styling', description: 'Hias makanan dengan bentuk menarik untuk meningkatkan minat makan si kecil.' },
            { icon: '🕒', title: 'Jadwal Konsisten', description: 'Berikan snack sehat di jam yang sama agar metabolisme anak terbentuk.' }
        ],
        products: ['British Propolis Green']
    },
    'wanita': {
        tips: [
            { icon: '🧘', title: 'Peregangan Panggul', description: 'Lakukan pose yoga ringan untuk melancarkan sirkulasi di area reproduksi.' },
            { icon: '🍫', title: 'Dark Chocolate', description: 'Konsumsi cokelat hitam tanpa gula untuk bantu redakan kram perut.' }
        ],
        products: ['British Propolis Blue']
    },
    'mata': {
        tips: [
            { icon: '👁️', title: 'Aturan 20-20-20', description: 'Tiap 20 menit, lihat objek sejauh 20 kaki selama 20 detik untuk rileksasi mata.' },
            { icon: '🥕', title: 'Cukupan Vitamin A', description: 'Konsumsi asupan bergizi untuk memperkuat sel retina mata.' }
        ],
        products: ['Brassic Eye']
    }
};

function getDynamicFallback(query: string): string {
    const q = query.toLowerCase();
    let selected = FALLBACK_RULES['tidur']; // Default fallback content

    if (q.includes('anak') || q.includes('makan')) selected = FALLBACK_RULES['anak'];
    else if (q.includes('sendi') || q.includes('tulang') || q.includes('pegal')) selected = FALLBACK_RULES['sendi'];
    else if (q.includes('haid') || q.includes('wanita') || q.includes('hormon')) selected = FALLBACK_RULES['wanita'];
    else if (q.includes('mata') || q.includes('lelah')) selected = FALLBACK_RULES['mata'];

    return JSON.stringify({
        empati: "Kami memahami kondisi yang kamu alami. Jaga semangat ya, kesehatan adalah investasi terbaik 🌿",
        edukasi: "Banyak masalah kesehatan ringan berawal dari pola istirahat dan nutrisi yang kurang seimbang.",
        tips_gaya_hidup: selected.tips,
        rekomendasi: selected.products.map(pName => {
            const p = {
                'British Propolis': { emoji: '🍯', reason: 'Antijamur & antivirus alami untuk daya tahan tubuh' },
                'British Propolis Green': { emoji: '🧒', reason: 'Nutrisi otak & imun khusus diformulasikan untuk anak' },
                'British Propolis Blue': { emoji: '💜', reason: 'Solusi hormonal & sistem reproduksi wanita' },
                'Brassic Pro': { emoji: '💪', reason: 'Atasi insomnia & nyeri sendi dengan ekstrak Moringa' },
                'Brassic Eye': { emoji: '👁️', reason: 'Perlindungan mata dari radiasi gadget & mata lelah' }
            }[pName as keyof typeof FALLBACK_RULES];
            return {
                name: pName,
                emoji: p?.emoji || '🌿',
                reason: p?.reason || 'Mendukung kesehatan tubuh secara menyeluruh',
                price: 'Rp 250.000'
            };
        }),
        cta: "Untuk saran lebih akurat, konsultasikan langsung via chat — gratis! 💬"
    });
}

/**
 * Mendapatkan embedding vektor dari teks menggunakan Google Gemini API
 */
async function getEmbedding(text: string): Promise<number[]> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/gemini-embedding-001',
                content: { parts: [{ text }] },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini Embedding Error: ${error}`);
    }

    const data = await response.json();
    return data.embedding.values;
}

/**
 * Mencari testimoni relevan dari Supabase menggunakan vector similarity
 */
async function searchTestimonials(query: string): Promise<any[]> {
    try {
        const embedding = await getEmbedding(query);

        const { data: messages, error } = await supabase.rpc('match_messages', {
            query_embedding: embedding,
            match_threshold: 0.1,
            match_count: 5,
        });

        if (error) throw error;
        return messages || [];
    } catch (error) {
        console.error('Search Testimonials Error:', error);
        return [];
    }
}

// ── System prompt ──────────────────────────────────────────────────
function buildPrompt(userInput: string, rawTestimonials: any[]): string {
    const testimonialsText = rawTestimonials.length > 0
        ? rawTestimonials.map((t, i) => `${i + 1}. [${t.content}]`).join('\n\n')
        : "Fokus pada data produk di bawah.";

    // Logic guide untuk membantu AI Flash agar lebih presisi
    const matchingRules = `
[LOGIC RULES]:
- Jika keluhan anak/makan -> WAJIB sarankan "British Propolis Green".
- Jika keluhan haid/wanita/promil -> WAJIB sarankan "British Propolis Blue".
- Jika keluhan tidur/sendi/linu -> WAJIB sarankan "Brassic Pro".
- Jika keluhan mata -> WAJIB sarankan "Brassic Eye".
- Jika keluhan kulit/flek -> WAJIB sarankan lini "Belgie Skincare".
- Jika keluhan gula darah/diabetes -> WAJIB sarankan "Steffi Pro".
- British Propolis (Reguler) adalah general imunitas untuk dewasa.
    `;

    return `Kamu adalah konsultan kesehatan senior yang hangat dan empatik dari BP Group.

INPUT PENGGUNA: "${userInput}"

${matchingRules}

REFERENSI TESTIMONI:
${testimonialsText}

INSTRUKSI OUTPUT:
1. Empati: Akui perasaan mereka dengan tulus (2 kalimat).
2. Edukasi: Jelaskan akar masalahnya secara sederhana (1 paragraf).
3. Tips Gaya Hidup: 3 tips KONKRET & NON-UMUM. (Hindari "minum air/tidur cukup" kecuali sangat relevan). Beri tips yang 'insightful'.
4. Rekomendasi: 2-3 Produk BP Group yang paling akurat sesuai [LOGIC RULES]. Beri ALASAN yang menyambungkan gejala mereka dengan manfaat produk.

PRODUK BP GROUP:
- British Propolis 6ml (Rp 250.000) -> Imunitas dewasa, kolesterol, asam urat.
- British Propolis Green 6ml (Rp 250.000) -> Khusus ANAK 1-12 tahun. Nafsu makan, kecerdasan.
- British Propolis Blue 6ml (Rp 250.000) -> Khusus WANITA. Nyeri haid, hormon, promil.
- Brassic Pro 40 kapsul (Rp 250.000) -> Insomnia, Nyeri Sendi, Pegal linu.
- Brassic Eye 40 kapsul (Rp 250.000) -> Kesehatan Mata, Mata Lelah.
- Belgie Facial Wash/Cream/Serum (Rp 195.000) -> Perawatan wajah & Anti-aging.
- Steffi Pro (Rp 195.000) -> Pengganti gula, solusi Diabetes.
- BP Norway (Rp 250.000) -> Omega 3, Otak & Jantung.

FORMAT RESPONS (JSON SAJA):
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
}`;
}

// ── Fungsi utama (SAMA seperti sebelumnya, nama tidak berubah) ─────
export async function generateAIAdvice(selectedComplaints: string[], complaintText: string): Promise<RAGResult> {
    const complaint = complaintText || selectedComplaints.join(', ');
    const userInput = complaint;

    // Validasi input
    if (!userInput?.trim()) {
        const rawFallback = getDynamicFallback('');
        const parsed = JSON.parse(rawFallback);
        return { ...parsed, testimonials: [] };
    }

    // 1. Cek cache — jika ada, langsung return (hemat quota API)
    const cacheKey = buildCacheKey(userInput);
    const cached = readCache(cacheKey);
    if (cached) {
        console.info('[Gemini] ✅ Cache hit — tidak konsumsi quota');
        try {
            const parsed = JSON.parse(cached);
            return {
                ...parsed,
                testimonials: [] // Kita bisa panggil searchTestimonials jika benar-benar butuh, tapi untuk speed cache hit murni tanpa testimonials juga OK
            };
        } catch {
            localStorage.removeItem(cacheKey);
        }
    }

    // 2. Ambil data testimoni & info produk relevan dari Supabase
    const rawTestimonials = await searchTestimonials(userInput);

    // 3. Coba panggil API dengan 2x retry
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.info(`[Gemini] 🔄 API call attempt ${attempt + 1}/${MAX_RETRIES + 1}`);

            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: buildPrompt(userInput, rawTestimonials) }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.8, // Menaikkan temperature agar lebih variatif
                        maxOutputTokens: 1024,
                        topP: 0.9,
                        response_mime_type: "application/json"
                    },
                }),
            });

            // Handle 429 Rate Limit
            if (response.status === 429) {
                if (attempt < MAX_RETRIES) {
                    const delaySec = (attempt + 1) * 30; // 30s lalu 60s
                    console.warn(`[Gemini] ⚠️ Rate limited. Tunggu ${delaySec} detik lalu retry...`);
                    await wait(delaySec * 1000);
                    continue; // retry
                }
                // Habis semua retry — pakai fallback
                console.error('[Gemini] ❌ Rate limit exhausted setelah semua retry. Pakai fallback.');
                const fb = getDynamicFallback(userInput);
                const parsedFB = JSON.parse(fb);
                return { ...parsedFB, testimonials: [] };
            }

            // Handle error lain
            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                throw new Error(`Gemini API ${response.status}: ${errorBody}`);
            }

            // Parse response
            const data = await response.json();
            const rawResultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!rawResultText) {
                throw new Error('Gemini returned empty response');
            }

            // 4. Simpan ke cache sebelum return
            writeCache(cacheKey, rawResultText);
            console.info('[Gemini] ✅ API call berhasil, disimpan ke cache');

            const parsed = JSON.parse(rawResultText);
            return {
                ...parsed,
                testimonials: rawTestimonials.map(t => ({
                    id: t.id,
                    text: t.content,
                    sender: t.sender || 'Admin BP'
                }))
            };

        } catch (err: unknown) {
            const isLastAttempt = attempt === MAX_RETRIES;

            if (isLastAttempt) {
                console.error('[Gemini] ❌ Semua retry gagal:', err);
                const fb = getDynamicFallback(userInput);
                const parsedFB = JSON.parse(fb);
                return { ...parsedFB, testimonials: [] };
            }

            // Retry untuk error non-429
            console.warn(`[Gemini] ⚠️ Error pada attempt ${attempt + 1}, retry...`, err);
            await wait(2000);
        }
    }

    // Safety net
    const finalFB = getDynamicFallback(userInput);
    const parsedFinalFB = JSON.parse(finalFB);
    return { ...parsedFinalFB, testimonials: [] };
}
