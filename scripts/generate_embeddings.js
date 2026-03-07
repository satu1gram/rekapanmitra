import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ---- KONFIGURASI ----
// 1. Dapatkan Supabase URL dan Service Role Key (bukan Anon key) dari pengaturan Supabase Anda.
// Service Role Key diperlukan karena kita akan bypass RLS untuk insert data mentah
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kqoitztjohxjnjoxctoz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxb2l0enRqb2h4am5qb3hjdG96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5OTk1NywiZXhwIjoyMDg2MDc1OTU3fQ.CLjlfwJ0dhzHdCXdB0_er_4DYemXfaTMH8zGinniI2Y';

// 2. Dapatkan Gemini API Key (tersedia gratis di Google AI Studio)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCEPyV_QtV6EREB2u11utsoNffFtglNwQ0';

// ---- INisialisasi ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAW_DATA_PATH = path.join(__dirname, '../src/lib/telegram_raw_data.json');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Fungsi untuk mendapatkan vector dari teks menggunakan Google Gemini Embedding
async function getEmbedding(text) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'models/gemini-embedding-001',
            content: {
                parts: [{ text: text }],
            }
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gagal generate embedding: ${err}`);
    }

    const data = await response.json();
    return data.embedding.values;
}

// Tambahkan delay agar tidak kena rate limit API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function processData() {
    try {
        console.log("Membaca data raw JSON dari", RAW_DATA_PATH);
        const rawData = JSON.parse(fs.readFileSync(RAW_DATA_PATH, 'utf-8'));

        console.log(`Ditemukan ${rawData.length} pesan. Memulai proses embedding...`);
        let scucceedCount = 0;
        let skipCount = 0;

        // Proses bertahap (per baris)
        for (let i = 0; i < rawData.length; i++) {
            const message = rawData[i];

            // Skip pesan terlalu pendek yang gak informatif
            if (message.text.length < 20) {
                skipCount++;
                continue;
            }

            console.log(`[${i + 1}/${rawData.length}] Memproses ID ${message.id}...`);

            try {
                // 1. Dapatkan Vektor Text dari Gemini API
                const embedding = await getEmbedding(message.text);

                // 2. Simpan Vektor dan Teks ke Supabase
                const { error } = await supabase
                    .from('telegram_messages')
                    .upsert({
                        id: message.id,
                        content: message.text,
                        sender: message.sender,
                        created_at: message.date,
                        embedding: embedding
                    });

                if (error) {
                    console.error(`Gagal insert data ke DB untuk ID ${message.id}:`, error);
                } else {
                    scucceedCount++;
                }

                // Tambahkan delay 2 detik antar request agar aman dari limit free tier Gemini (15 Req/Menit)
                await delay(2500);

            } catch (err) {
                console.error(`Error memproses ID ${message.id}:`, err.message);
            }
        }

        console.log("\n✅ === PROSES SELESAI ===");
        console.log(`Berhasil insert/update DB: ${scucceedCount}`);
        console.log(`Dilewati (Terlalu Pendek): ${skipCount}`);

    } catch (e) {
        console.error("Terjadi kesalahan fatal:", e);
    }
}

// Verifikasi kredensial sebelum jalan
if (SUPABASE_URL.includes('GANTI_DENGAN_') || GEMINI_API_KEY.includes('GANTI_DENGAN_')) {
    console.log("ERROR: Harap isi SUPABASE_URL, SUPABASE_SERVICE_KEY, dan GEMINI_API_KEY di file ini terlebih dulu!");
} else {
    processData();
}
