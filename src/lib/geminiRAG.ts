import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RAGResult {
    empati: string;
    edukasi: string;
    tips_gaya_hidup: { icon: string; title: string; description: string }[];
    rekomendasi: { name: string; emoji: string; reason: string; price: string }[];
    cta: string;
    testimonials?: { id: string; text: string; sender: string }[];
}

/**
 * Mendapatkan embedding vektor dari teks menggunakan Google Gemini API
 */
async function getEmbedding(text: string): Promise<number[]> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiApiKey}`,
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
            match_threshold: 0.1, // Dikecilkan dulu agar pasti ada hasil saat testing awal
            match_count: 5,
        });

        if (error) throw error;
        return messages || [];
    } catch (error) {
        console.error('Search Testimonials Error:', error);
        return [];
    }
}

/**
 * Menghasilkan saran kesehatan menggunakan Gemini LLM dengan konteks RAG
 */
export async function generateAIAdvice(selectedComplaints: string[], complaintText: string): Promise<RAGResult> {
    if (!geminiApiKey) {
        throw new Error('Gemini API Key tidak ditemukan. Harap cek file .env Anda.');
    }

    const complaint = complaintText || selectedComplaints.join(', ');
    const query = `Keluhan: ${complaint}. Kondisi: ${selectedComplaints.join(', ')}`;

    // 1. Ambil data testimoni & info produk relevan dari Supabase
    const rawTestimonials = await searchTestimonials(query);

    // 2. Buat Prompt untuk Gemini LLM
    const SYSTEM_PROMPT = `Kamu adalah konsultan kesehatan ramah dari BP Group, sebuah brand produk kesehatan alami Indonesia yang berdiri sejak 2018. 

MISI KAMU: Bantu pengguna memahami kondisinya dan berikan panduan PRAKTIS, bukan hanya jualan produk.

URUTAN RESPONS YANG WAJIB DIIKUTI (jangan ubah urutan ini):

1. EMPATI (2–3 kalimat):
   - Akui kondisi yang mereka ceritakan dengan hangat dan tulus
   - Validasi bahwa kondisi itu nyata dan bisa diatasi
   - Jangan mulai dengan "Sebagai AI..." atau "Berdasarkan input Anda..."
   - Contoh: "Wajar sekali kamu merasakannya — tubuh yang mudah lelah sering menjadi tanda bahwa ada yang perlu diperhatikan dalam keseharianmu..."

2. PANDUAN GAYA HIDUP SEHAT (3–5 tips KONKRET):
   - Tips yang bisa dilakukan SEGERA tanpa membeli produk apapun
   - Mencakup: pola makan, pola tidur, aktivitas fisik ringan, manajemen stres, hidrasi
   - Setiap tip harus spesifik dan actionable, bukan generik
   - JANGAN sebut produk apapun di bagian ini
   - Format: { "icon": "🌙", "title": "Judul singkat", "description": "Penjelasan 1-2 kalimat" }

3. REKOMENDASI PRODUK (2–3 produk, SESUDAH panduan gaya hidup):
   - Framing: "Untuk mendukung perubahan gaya hidupmu..." bukan "Kamu harus beli..."
   - Setiap produk WAJIB ada alasan spesifik kenapa cocok dengan keluhan mereka
   - Format: { "name": "...", "emoji": "...", "reason": "1 kalimat alasan spesifik", "price": "Rp ..." }

DAFTAR PRODUK BP GROUP (gunakan hanya produk-produk ini):
- British Propolis (6ml, Rp 250.000) — imunitas, antioksidan, antibakteri alami dari lebah
- British Propolis Green (6ml, Rp 250.000) — khusus anak 1–12 tahun, imunitas anak
- Brassic Pro (40 kapsul, Rp 250.000) — Moringa + Echinacea, stamina & pemulihan tubuh
- Brassic Eye (40 kapsul, Rp 250.000) — Bilberry + Gynura, kesehatan & ketajaman mata
- Belgie Facial Wash (100ml, Rp 195.000) — membersihkan & mencerahkan kulit wajah
- Belgie Anti Aging Serum (10ml, Rp 195.000) — anti penuaan, kolagen, kulit kencang
- Belgie Day Cream SPF30+ (10g, Rp 195.000) — perlindungan siang hari, anti UV
- Belgie Night Cream (10g, Rp 195.000) — regenerasi kulit malam hari
- Belgie Hair Tonic (100ml, Rp 195.000) — Anagain Swiss, atasi rambut rontok
- BP Norway (40 softcaps, Rp 250.000) — Salmon Oil Omega-3, kesehatan otak & jantung
- Steffi Pro (30ml, Rp 195.000, PROMO dari 250.000) — Stevia natural sweetener, cocok gula darah

ATURAN TAMBAHAN:
- Gunakan bahasa Indonesia yang hangat, tidak kaku, tidak terlalu formal
- Jika keluhan tidak jelas, tanya dengan sopan sebelum merespons
- JANGAN buat klaim medis absolut (hindari kata "menyembuhkan", "mengobati")
- Selalu akhiri dengan ajakan konsultasi lebih lanjut via WhatsApp
- JANGAN rekomendasikan produk dari brand lain

FORMAT RESPONS — WAJIB JSON VALID:
{
  "empati": "teks empati 2–3 kalimat",
  "edukasi": "1 paragraf penjelasan singkat tentang kondisi",
  "tips_gaya_hidup": [
    { "icon": "emoji", "title": "judul singkat", "description": "penjelasan 1–2 kalimat" }
  ],
  "rekomendasi": [
    { "name": "nama produk", "emoji": "emoji", "reason": "alasan spesifik 1 kalimat", "price": "Rp xxx.xxx" }
  ],
  "cta": "kalimat ajakan konsultasi WA yang personal"
}`;

    const promptText = `
${SYSTEM_PROMPT}

KELUHAN PENGGUNA:
"${complaint}"
Tag Kondisi: ${selectedComplaints.join(', ')}

KONTEKS TESTIMONI/DATA PRODUK (Sebagai referensi jawaban):
${rawTestimonials.length > 0
            ? rawTestimonials.map((t, i) => `${i + 1}. [${t.content}]`).join('\n\n')
            : "Gunakan data produk di atas."}
    `;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini LLM Error: ${error}`);
    }

    const data = await response.json();
    const rawJson = data.candidates[0].content.parts[0].text;
    const resultData = JSON.parse(rawJson);

    return {
        empati: resultData.empati || "",
        edukasi: resultData.edukasi || "",
        tips_gaya_hidup: resultData.tips_gaya_hidup || [],
        rekomendasi: resultData.rekomendasi || [],
        cta: resultData.cta || "",
        testimonials: rawTestimonials.map(t => ({
            id: t.id,
            text: t.content,
            sender: t.sender || 'Admin BP'
        }))
    };
}
