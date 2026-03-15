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
const FALLBACK_RULES: Record<string, { tips: any[]; products: string[]; testimonials: { text: string; author: string }[] }> = {
    tidur: {
        tips: [
            { icon: '🌙', title: 'Power Down', description: 'Matikan gadget 60 menit sebelum tidur agar hormon melatonin bekerja optimal.' },
            { icon: '🍵', title: 'Chamomile Tea', description: 'Minum seduhan hangat untuk menenangkan sistem saraf pusat.' }
        ],
        products: ['Brassic Pro', 'British Propolis'],
        testimonials: [
            { text: "Dulu saya susah tidur sampai pukul 2 pagi, setelah minum Brassic Pro sekarang bisa tidur jam 10 malam dan bangun lebih segar. Benar-benar membantu!", author: "Ibu Siti, 45 tahun" },
            { text: "Insomnia saya berbulan-bulan hilang setelah rutin konsumsi Brassic Pro. Sekarang tidur nyenyak dan tidak terbangun tengah malam lagi.", author: "Bapak Ahmad, 38 tahun" }
        ]
    },
    sendi: {
        tips: [
            { icon: '🧘', title: 'Stretching Rendah Kompresi', description: 'Lakukan peregangan ringan setiap pagi untuk melumasi persendian.' },
            { icon: '🔥', title: 'Kompres Hangat', description: 'Gunakan handuk hangat pada area nyeri selama 15 menit.' }
        ],
        products: ['Brassic Pro', 'British Propolis'],
        testimonials: [
            { text: "Lutut saya yang sakit saat naik tangga sekarang sudah tidak terasa lagi setelah 2 minggu minum Brassic Pro. Alhamdulillah sembuh total!", author: "Bapak Budi, 50 tahun" },
            { text: "Nyeri sendi dan pegal-pegal di badan saya berkurang drastis. Sekarang bisa beraktifitas normal lagi tanpa khawatir sakit.", author: "Ibu Dewi, 55 tahun" }
        ]
    },
    rambut: {
        tips: [
            { icon: '💆', title: 'Pijat Kulit Kepala', description: 'Lakukan pijat ringan selama 5 menit untuk melancarkan sirkulasi darah ke folikel rambut.' },
            { icon: '🥩', title: 'Makan Protein Tinggi', description: 'Konsumsi telur, ikan, dan kacang-kacangan untuk memperkuat struktur rambut.' },
            { icon: '🌿', title: 'Hindari Bahan Kimia', description: 'Kurangi penggunaan hair styling products yang mengandung bahan kimia keras.' }
        ],
        products: ['Belgie Hair Tonic', 'British Propolis'],
        testimonials: [
            { text: "Rambut saya yang rontok parah saat keramas sekarang berkurang 90% setelah 1 bulan pakai Belgie Hair Tonic. Akar rambut jadi kuat!", author: "Rina, 28 tahun" },
            { text: "Botak di bagian atas kepala saya mulai tumbuh rambut baru setelah rutin pakai Belgie Hair Tonic 2 bulan. Sangat puas hasilnya!", author: "Andi, 35 tahun" }
        ]
    },
    anak: {
        tips: [
            { icon: '🥦', title: 'Visual Food Styling', description: 'Hias makanan dengan bentuk menarik untuk meningkatkan minat makan si kecil.' },
            { icon: '🕒', title: 'Jadwal Konsisten', description: 'Berikan snack sehat di jam yang sama agar metabolisme anak terbentuk.' }
        ],
        products: ['British Propolis Green'],
        testimonials: [
            { text: "Anak saya yang dulu susah makan dan badannya kurus, sekarang jadi lahap makan dan berat badan naik 2 kg dalam 1 bulan. British Propolis Green mantap!", author: "Ibu Maya, 32 tahun" },
            { text: "Anak saya jadi lebih sehat dan jarang sakit setelah rutin minum British Propolis Green. Tidak mudah flu dan batuk lagi.", author: "Bapak Hendra, 40 tahun" }
        ]
    },
    wanita: {
        tips: [
            { icon: '🧘', title: 'Peregangan Panggul', description: 'Lakukan pose yoga ringan untuk melancarkan sirkulasi di area reproduksi.' },
            { icon: '🍫', title: 'Dark Chocolate', description: 'Konsumsi cokelat hitam tanpa gula untuk bantu redakan kram perut.' }
        ],
        products: ['British Propolis Blue'],
        testimonials: [
            { text: "Siklus haid saya yang tidak teratur 6 bulan terakhir sekarang jadi normal setelah minum British Propolis Blue. Nyeri haid juga berkurang!", author: "Sarah, 30 tahun" },
            { text: "Masalah hormonal saya yang menyebabkan mood swing berkurang drastis dengan British Propolis Blue. Lebih stabil dan energik.", author: "Intan, 34 tahun" }
        ]
    },
    mata: {
        tips: [
            { icon: '👁️', title: 'Aturan 20-20-20', description: 'Tiap 20 menit, lihat objek sejauh 20 kaki selama 20 detik untuk rileksasi mata.' },
            { icon: '🥕', title: 'Cukupan Vitamin A', description: 'Konsumsi asupan bergizi untuk memperkuat sel retina mata.' }
        ],
        products: ['Brassic Eye'],
        testimonials: [
            { text: "Mata saya yang lelah karena kerja laptop 8 jam sehari sekarang jadi lebih segar dan tidak cepat capek setelah minum Brassic Eye.", author: "Budi, 42 tahun" },
            { text: "Rabun jauh saya berkurang dan mata tidak silau lagi saat malam hari setelah rutin konsumsi Brassic Eye. Recommended!", author: "Dewi, 38 tahun" }
        ]
    },
    kulit: {
        tips: [
            { icon: '🧴', title: 'Double Cleansing', description: 'Bersihkan wajah dua kali: pertama dengan makeup remover, kedua dengan facial wash.' },
            { icon: '💧', title: 'Hydration', description: 'Gunakan pelembab dan minum air putih minimal 8 gelas sehari.' },
            { icon: '🌞', title: 'Sunscreen', description: 'Gunakan sunscreen SPF 30+ setiap hari meskipun di dalam ruangan.' }
        ],
        products: ['Belgie Anti Aging Serum', 'Belgie Facial Wash'],
        testimonials: [
            { text: "Flek hitam di pipi saya yang sudah 3 tahun memudar 80% setelah 1 bulan pakai Belgie Anti Aging Serum. Wajah jadi cerah!", author: "Rina Permata, 29 tahun" },
            { text: "Jerawat batu yang selalu muncul setiap bulan berhenti total setelah pakai Belgie Facial Wash. Kulit jadi bersih dan glowing!", author: "Sarah Amelia, 31 tahun" }
        ]
    },
    gula: {
        tips: [
            { icon: '🥗', title: 'Diet Rendah Karbohidrat', description: 'Pilih karbohidrat kompleks seperti quinoa, brown rice, dan oatmeal.' },
            { icon: '🏃', title: 'Olahraga Rutin', description: 'Lakukan jalan kaki 30 menit setiap hari untuk meningkatkan sensitivitas insulin.' },
            { icon: '🥜', title: 'Snack Sehat', description: 'Ganti camilan manis dengan kacang almond, yogurt, atau buah berry.' }
        ],
        products: ['Steffi Pro', 'British Propolis'],
        testimonials: [
            { text: "Gula darah puasa saya dari 180 turun ke 110 setelah 1 bulan rutin minum Steffi Pro. Dokter saya kaget dengan hasilnya!", author: "Budi Santoso, 52 tahun" },
            { text: "Kencing manis saya yang sulit dikontrol sekarang stabil dengan Steffi Pro. Tidak lagi gampang haus dan lelah.", author: "Siti, 48 tahun" }
        ]
    },
    imun: {
        tips: [
            { icon: '🍊', title: 'Vitamin C Alami', description: 'Konsumsi jeruk, strawberry, dan sayuran hijau untuk daya tahan tubuh.' },
            { icon: '😴', title: 'Tidur Cukup', description: 'Pastikan tidur 7-8 jam setiap malam untuk regenerasi sel imun.' },
            { icon: '🧘', title: 'Stress Management', description: 'Lakukan meditasi 10 menit setiap hari untuk mengurangi kortisol.' }
        ],
        products: ['British Propolis', 'British Propolis Green'],
        testimonials: [
            { text: "Saya yang dulu mudah sakit dan flu sekarang jadi jarang sakit setelah rutin minum British Propolis. Badan terasa lebih fit!", author: "Siti Nurhaliza, 36 tahun" },
            { text: "Anak saya yang sering sakit saat musim hujan sekarang kebal dan tidak mudah sakit lagi. British Propolis Green benar-benar works!", author: "Hendra Kusuma, 45 tahun" }
        ]
    },
    stamina: {
        tips: [
            { icon: '🥤', title: 'Electrolyte Balance', description: 'Minum air kelapa atau tambahkan garam Himalaya untuk keseimbangan elektrolit.' },
            { icon: '🍯', title: 'Natural Energy', description: 'Konsumsi madu dan kurma sebagai sumber energi alami.' },
            { icon: '🏋️', title: 'Progressive Exercise', description: 'Mulai dengan olahraga ringan dan tingkatkan intensitas secara bertahap.' }
        ],
        products: ['British Propolis', 'BP Norway'],
        testimonials: [
            { text: "Stamina saya yang dulu capek setelah jam 3 sore sekarang bisa full energy seharian tanpa lelah. British Propolis juara!", author: "Rudi Hermawan, 41 tahun" },
            { text: "Sebagai driver online, BP Norway memberikan energi extra untuk saya kerja 12 jam nonstop. Tidak mudah capek lagi!", author: "Maya Sari, 33 tahun" }
        ]
    },
    fokus: {
        tips: [
            { icon: '🧠', title: 'Brain Training', description: 'Lakukan puzzle atau game strategi 15 menit setiap hari untuk melatih fokus.' },
            { icon: '🎵', title: 'Focus Music', description: 'Dengarkan instrumental music atau white noise saat bekerja.' },
            { icon: '🍳', title: 'Omega-3 Breakfast', description: 'Sarapan dengan telur, ikan salmon, atau walnut untuk nutrisi otak.' }
        ],
        products: ['Brassic Pro', 'British Propolis'],
        testimonials: [
            { text: "Fokus kerja saya yang dulu gampang hilang sekarang jadi lebih tajam dan konsentrasi. Brassic Pro benar-benar membantu produktivitas!", author: "Intan Permata, 37 tahun" },
            { text: "Sering lupa dan sulit konsentrasi sekarang teratasi dengan Brassic Pro. Ingatan saya jadi lebih baik dan tidak gampang lupa lagi.", author: "Andi Wijaya, 44 tahun" }
        ]
    }
};

function getDynamicFallback(query: string): RAGResult {
    const q = query.toLowerCase();
    let selected = FALLBACK_RULES['imun']; // Default ke IMUNITAS

    // Priority mapping untuk keluhan spesifik
    if (q.includes('rambut') || q.includes('rontok') || q.includes('botak') || q.includes('ketombe')) {
        selected = FALLBACK_RULES['rambut'];
        console.log('[AI] 🎯 Keluhan detected: RAMBUT -> Belgie Hair Tonic');
    }
    else if (q.includes('kulit') || q.includes('flek') || q.includes('jerawat') || q.includes('wajah') || q.includes('kusam')) {
        selected = FALLBACK_RULES['kulit'];
        console.log('[AI] 🎯 Keluhan detected: KULIT -> Belgie Serum & Facial Wash');
    }
    else if (q.includes('gula') || q.includes('diabetes') || q.includes('manis') || q.includes('kencing manis')) {
        selected = FALLBACK_RULES['gula'];
        console.log('[AI] 🎯 Keluhan detected: GULA DARAH -> Steffi Pro');
    }
    else if (q.includes('imun') || q.includes('daya tahan') || q.includes('sakit') || q.includes('flu') || q.includes('batuk')) {
        selected = FALLBACK_RULES['imun'];
        console.log('[AI] 🎯 Keluhan detected: IMUN -> British Propolis');
    }
    else if (q.includes('stamina') || q.includes('energi') || q.includes('lemas') || q.includes('capek') || q.includes('letih')) {
        selected = FALLBACK_RULES['stamina'];
        console.log('[AI] 🎯 Keluhan detected: STAMINA -> British Propolis/BP Norway');
    }
    else if (q.includes('fokus') || q.includes('konsentrasi') || q.includes('otak') || q.includes('ingatan') || q.includes('lupa')) {
        selected = FALLBACK_RULES['fokus'];
        console.log('[AI] 🎯 Keluhan detected: FOKUS -> Brassic Pro');
    }
    else if (q.includes('anak') || q.includes('makan') || q.includes('lahap') || q.includes('nafsu')) {
        selected = FALLBACK_RULES['anak'];
        console.log('[AI] 🎯 Keluhan detected: ANAK -> British Propolis Green');
    }
    else if (q.includes('sendi') || q.includes('tulang') || q.includes('pegal') || q.includes('nyeri') || q.includes('asam urat') || q.includes('rematik')) {
        selected = FALLBACK_RULES['sendi'];
        console.log('[AI] 🎯 Keluhan detected: SENDI -> Brassic Pro');
    }
    else if (q.includes('haid') || q.includes('wanita') || q.includes('hormon') || q.includes('promil') || q.includes('hamil')) {
        selected = FALLBACK_RULES['wanita'];
        console.log('[AI] 🎯 Keluhan detected: WANITA -> British Propolis Blue');
    }
    else if (q.includes('mata') || q.includes('lelah') || q.includes('rabun') || q.includes('silau')) {
        selected = FALLBACK_RULES['mata'];
        console.log('[AI] 🎯 Keluhan detected: MATA -> Brassic Eye');
    }
    else if (q.includes('tidur') || q.includes('insomnia') || q.includes('sulit tidur') || q.includes('gelisah')) {
        selected = FALLBACK_RULES['tidur'];
        console.log('[AI] 🎯 Keluhan detected: TIDUR -> Brassic Pro');
    }
    else {
        console.log('[AI] 🎯 Keluhan not detected, using default: IMUNITAS -> British Propolis');
    }

    const productDetails: Record<string, { emoji: string; reason: string }> = {
        'British Propolis': { emoji: '🍯', reason: 'Antijamur & antivirus alami untuk daya tahan tubuh' },
        'British Propolis Green': { emoji: '🧒', reason: 'Nutrisi otak & imun khusus diformulasikan untuk anak' },
        'British Propolis Blue': { emoji: '💜', reason: 'Solusi hormonal & sistem reproduksi wanita' },
        'Brassic Pro': { emoji: '💪', reason: 'Atasi insomnia & nyeri sendi dengan ekstrak Moringa' },
        'Brassic Eye': { emoji: '👁️', reason: 'Perlindungan mata dari radiasi gadget & mata lelah' },
        'Belgie Hair Tonic': { emoji: '💇', reason: 'Menyuburkan akar rambut dan mengurangi rontok hingga 70%' },
        'Belgie Anti Aging Serum': { emoji: '✨', reason: 'Menghilangkan flek hitam dan mencerahkan wajah secara alami' },
        'Belgie Facial Wash': { emoji: '🧼', reason: 'Membersihkan wajah dari kotoran dan minyak berlebih' },
        'Steffi Pro': { emoji: '🩸', reason: 'Menstabilkan gula darah dan meningkatkan sensitivitas insulin' },
        'BP Norway': { emoji: '🌊', reason: 'Omega-3 dari salmon Norwegia untuk kesehatan jantung dan otak' },
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
    
    console.log('[AI] 🎯 Keluhan detected:', Object.keys(FALLBACK_RULES).find(key => FALLBACK_RULES[key] === selected) || 'IMUNITAS (default)');
    console.log('[AI] 💊 Products recommended:', selected.products.join(', '));
    console.log('[AI] 🤖 Using z.ai API with model: zeta-1');
    console.log('[AI] 🛡️ Default fallback: IMUNITAS -> British Propolis');
}

const SYSTEM_PROMPT = `Kamu adalah konsultan kesehatan senior yang hangat dan empatik dari BP Group.

[LOGIC RULES]:
- Jika keluhan RAMBUT/RONTOK/KETOMBE -> WAJIB sarankan "Belgie Hair Tonic".
- Jika keluhan KULIT/FLEK/JERAWAT/WAJAH/KUSAM -> WAJIB sarankan "Belgie Anti Aging Serum" DAN "Belgie Facial Wash".
- Jika keluhan GULA DARAH/DIABETES/MANIS -> WAJIB sarankan "Steffi Pro".
- Jika keluhan ANAK/MAKAN/LAHAP/NAPSU -> WAJIB sarankan "British Propolis Green".
- Jika keluhan HAID/WANITA/PROMIL/HORMON/HAMIL -> WAJIB sarankan "British Propolis Blue".
- Jika keluhan TIDUR/INSOMNIA/GELISAH -> WAJIB sarankan "Brassic Pro".
- Jika keluhan SENDI/NYERI/PEGAL/ASAM URAT/REMATIK/TULANG -> WAJIB sarankan "Brassic Pro".
- Jika keluhan MATA/LELAH/RABUN/SILAU -> WAJIB sarankan "Brassic Eye".
- Jika keluhan IMUN/DAYA TAHAN/SAKIT/FLU/BATUK -> WAJIB sarankan "British Propolis".
- Jika keluhan STAMINA/ENERGI/LEMAS/CAPEK/LETIH -> WAJIB sarankan "British Propolis" atau "BP Norway".
- Jika keluhan FOKUS/KONSENTRASI/OTAK/INGATAN/LUPA -> WAJIB sarankan "Brassic Pro".
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
- Belgie Hair Tonic
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

    // 2. Direct z.ai API Call
    try {
        const apiKey = import.meta.env.VITE_ZAI_API_KEY;
        if (!apiKey) {
            console.warn('[AI] VITE_ZAI_API_KEY missing, using fallback');
            return getDynamicFallback(userInput);
        }

        console.info('[AI] 🔄 Calling z.ai API...');

        const response = await fetch(
            'https://api.z.ai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'zeta-1',
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
            throw new Error(`z.ai API error: ${response.status}`);
        }

        const data = await response.json();
        const rawText = data?.choices?.[0]?.message?.content;

        if (!rawText) {
            throw new Error('Empty response from z.ai');
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
