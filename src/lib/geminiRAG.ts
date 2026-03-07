import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RAGResult {
    analysis: string;
    tips: string[];
    products: string[];
    testimonials: { id: string; text: string; sender: string }[];
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
    const prompt = `
Kamu adalah AI Health Advisor profesional yang ahli dalam kesehatan holistik dan produk alami BP Group.
Tugasmu adalah memberikan edukasi kesehatan dan saran gaya hidup kepada pengguna berdasarkan keluhan mereka.

KELUHAN PENGGUNA:
"${complaint}"
Tag Kondisi: ${selectedComplaints.join(', ')}

KONTEKS TESTIMONI/DATA PRODUK (Gunakan sebagai referensi ikhtiar):
${rawTestimonials.length > 0
            ? rawTestimonials.map((t, i) => `${i + 1}. [${t.content}]`).join('\n\n')
            : "Gunakan pengetahuan umum tentang khasiat British Propolis (Imunitas, Stamina, Pemulihan) atau Brassic Pro (Sendi, Tidur)."}

INSTRUKSI JAWABAN:
1. JANGAN "hard-selling" atau langsung berjualan di awal. Berikan empati dan analisis kesehatan yang edukatif terlebih dahulu.
2. Fokus pada penjelasan mengapa kondisi tersebut terjadi secara alami di tubuh dan apa solusi gaya hidupnya (pola makan, istirahat, hidrasi).
3. Sebutkan produk BP Group (British Propolis, Brassic Pro, dll) hanya sebagai "Ikhtiar Tambahan/Pendukung" di bagian akhir analisis untuk mempercepat proses alami tubuh.
4. Daftar 'tips' harus 75% berisi saran praktis kesehatan umum (misal: perbaiki jam tidur, kurangi gula). Maksimal 1 tip yang menyebutkan produk.
5. Gunakan bahasa yang elegan, menenangkan, dan profesional.

Berikan jawaban dalam format JSON mentah (TANPA markdown block) dengan struktur:
{
  "analysis": "Tulis 2-3 paragraf. Paragraf awal murni edukasi & empati. Paragraf terakhir baru hubungkan ke dukungan produk alami secara halus.",
  "tips": ["Tips Kesehatan Umum 1", "Tips Kesehatan Umum 2", "Tips Kesehatan Umum 3", "Tip Konsumsi Produk (opsional)"],
  "products": ["Nama Produk 1", "Nama Produk 2"]
}
Pilih maksimal 3 produk dan 4 tips.
`;

    // 3. Panggil Gemini Flash API (v1beta) - Gunakan flash-latest sebagai fallback quota
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
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
        analysis: resultData.analysis,
        tips: resultData.tips || [],
        products: resultData.products || [],
        testimonials: rawTestimonials.map(t => ({
            id: t.id,
            text: t.content,
            sender: t.sender || 'Admin BP'
        }))
    };
}
