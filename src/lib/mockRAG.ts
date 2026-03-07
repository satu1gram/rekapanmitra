import { mockTelegramDatabase, TelegramMessage } from './mockTelegramData';

export interface RAGResult {
    analysis: string;
    tips: string[];
    products: string[];
    testimonials: TelegramMessage[];
}

// Simulasi Cosine Similarity (Vector Search) menggunakan pencarian keyword/tag sederhana
function searchRelevantMessages(query: string, rawTags: string[], limit: number = 3): TelegramMessage[] {
    // Bersihkan emoji dari awal string yang dikirim dari UI (misal: "👁️ Mata Lelah" menjadi "Mata Lelah")
    const tags = rawTags.map(t => t.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim());

    // Gabungkan query dan tags untuk pencarian kotor
    const searchTerms = [...tags, ...query.toLowerCase().split(' ')].filter(t => t.length > 2); // Reduced from 3 to 2 to catch "mata"

    // Hitung skor kecocokan tiap pesan
    const scoredMessages = mockTelegramDatabase.map(msg => {
        let score = 0;
        const msgTextLower = msg.text.toLowerCase();

        // Cek kecocokan tag dari database melawan tag pilihan UI (prioritas tertinggi)
        msg.tags.forEach(dbTag => {
            const dbTagLower = dbTag.toLowerCase();
            if (tags.some(uiTag => dbTagLower.includes(uiTag.toLowerCase()) || uiTag.toLowerCase().includes(dbTagLower))) {
                score += 10;
            }
        });

        // Cek kecocokan kata pencarian/tag dalam Teks pesan & Tag DB
        searchTerms.forEach(term => {
            const termLower = term.toLowerCase();
            if (msgTextLower.includes(termLower)) score += 2;
            if (msg.tags.some(t => t.toLowerCase().includes(termLower))) score += 3;
        });

        return { message: msg, score };
    });

    // Urutkan berdasarkan skor tertinggi dan hilangkan skor 0
    const sorted = scoredMessages
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.message);

    return sorted.slice(0, limit);
}

// Fungsi utama yang mensimulasikan RAG Pipeline
export async function generateAIAdvice(selectedComplaints: string[], complaintText: string): Promise<RAGResult> {
    // Simulasi delay jaringan (1.5 detik)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 1. Retrieval (Cari dokumen relevan dari mock DB)
    const relevantMessages = searchRelevantMessages(complaintText, selectedComplaints, 3);

    // Jika tidak ada data relevan sama sekali, buat respons default
    if (relevantMessages.length === 0) {
        return {
            analysis: "Berdasarkan keluhan yang Anda rasakan, kami menyarankan Anda untuk menjaga pola hidup sehat, memperbanyak istirahat, dan berkonsultasi lebih lanjut dengan konsultan kami.",
            tips: [
                "Perbanyak minum air putih hangat minimal 2.5 liter sehari.",
                "Konsumsi makanan kaya gizi dan kurangi gula berlebih.",
                "Jaga kualitas tidur 7-8 jam per hari."
            ],
            products: ["British Propolis"],
            testimonials: [] // Kosong
        };
    }

    // 2. Ekstrak Rekomendasi Produk Unik dari pesan yang relevan
    const productSet = new Set<string>();
    relevantMessages.forEach(msg => {
        msg.related_products.forEach(prod => productSet.add(prod));
    });
    const recommendedProducts = Array.from(productSet);

    // 3. Generation (Simulasi LLM merangkai kata berdasarkan konteks RAG)
    // Di dunia nyata, keluhan + relevantMessages ini akan dikirim ke Gemini API sebagai Prompt Template.
    const complaintsJoin = [...selectedComplaints, complaintText].filter(Boolean).join(', ');

    let simulatedAnalysis = `Saya memahami keluhan yang Anda rasakan seputar ${complaintsJoin}. Dari data pengetahuan dan riwayat pengguna di komunitas kami, masalah ini seringkali terkait dengan ketidakseimbangan nutrisi atau metabolisme yang menurun. `;

    if (recommendedProducts.includes("British Propolis")) {
        simulatedAnalysis += "Sinergi ikhtiar dengan propolis sangat disarankan karena membantu mempercepat Pemulihan, Imunitas, dan Stamina secara menyeluruh.";
    } else if (recommendedProducts.includes("Brassic Pro")) {
        simulatedAnalysis += "Kombinasi Moringa dan Echinacea terbukti efektif untuk meredakan inflamasi, merelaksasi otot, dan membantu Anda mendapatkan istirahat yang lebih berkualitas.";
    } else if (recommendedProducts.includes("Belgie Facial Wash") || recommendedProducts.includes("Belgie Anti Aging Serum")) {
        simulatedAnalysis += "Perawatan dari luar dengan kandungan antioksidan, propolis extract, dan kolagen sangat penting untuk meregenerasi sel kulit Anda.";
    } else {
        simulatedAnalysis += "Kami telah menemukan beberapa testimoni riil yang kondisinya mirip dengan Anda, beserta ikhtiar alamiah yang mereka lakukan.";
    }

    // Tips yang dinamis (disimulasikan kaku untuk mock)
    const dynamicTips = [
        "Jaga hidrasi dengan minum air hangat minimal 2 liter per hari.",
        "Kurangi asupan gula olahan dan makanan yang memicu inflamasi.",
        "Lakukan pergerakan/olahraga ringan minimal 15 menit setiap pagi.",
        "Optimalkan ikhtiar dengan rutinkan konsumsi suplemen alami."
    ];

    return {
        analysis: simulatedAnalysis,
        tips: dynamicTips,
        products: recommendedProducts.slice(0, 3), // Maksimal 3 produk
        testimonials: relevantMessages.filter(msg => msg.source === 'testimoni') // Hanya kirim testimoni ke UI
    };
}
