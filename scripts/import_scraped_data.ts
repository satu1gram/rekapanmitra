// scripts/import_scraped_data.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config({ path: '.env' });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: VITE_SUPABASE_URL atau VITE_SUPABASE_PUBLISHABLE_KEY tidak ditemukan di .env/local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_PATH = path.join(process.cwd(), 'src/lib/telegram_raw_data.json');
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY!;

// Fungsi untuk mendapatkan vector dari teks menggunakan Google Gemini Embedding
async function getEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'models/gemini-embedding-001',
            content: { parts: [{ text }] }
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gagal generate embedding: ${err}`);
    }

    const data: any = await response.json();
    return data.embedding.values;
}

// Fungsi sederhana untuk menebak produk dari isi teks
function inferProductName(content: string): string | null {
    const text = content.toLowerCase();
    if (text.includes('anak') || text.includes('kids') || text.includes('green') || text.includes('propolis anak')) return 'British Propolis Green';
    if (text.includes('british propolis') || text.includes('bp red') || text.includes('propolis')) return 'British Propolis';
    if (text.includes('belgie') || text.includes('facial wash') || text.includes('serum') || text.includes('cream')) return 'Belgie Skincare';
    if (text.includes('brassic eye')) return 'Brassic Eye';
    if (text.includes('brassic pro')) return 'Brassic Pro';
    if (text.includes('norway') || text.includes('salmon')) return 'BP Norway';
    if (text.includes('steffi')) return 'Steffi Pro';
    return null;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    if (!fs.existsSync(DATA_PATH)) {
        console.error('File telegram_raw_data.json tidak ditemukan. Jalankan scraper Python terlebih dahulu.');
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    console.log(`Ditemukan ${rawData.length} pesan untuk diproses.`);

    let count = 0;
    for (const msg of rawData) {
        // Filter: hanya ambil yang ada foto_url-nya (asumsi ini testimoni kuat)
        // ATAU pesan yang cukup panjang (> 50 karakter)
        if (!msg.photo_url && (!msg.text || msg.text.length < 50)) continue;

        console.log(`[${count + 1}] Memproses testimoni dari: ${msg.sender}...`);

        try {
            // 1. Generate Embedding agar bisa dibaca AI (match_messages)
            console.log(`   Generating embedding...`);
            const embedding = await getEmbedding(msg.text);

            // 2. Tebak Produk agar muncul di widget produk spesifik
            const guessedProduct = inferProductName(msg.text);

            // 3. Simpan ke database
            const { error } = await supabase
                .from('telegram_messages')
                .upsert({
                    id: msg.id,
                    content: msg.text,
                    sender: msg.sender,
                    created_at: msg.date,
                    is_testimoni: true,
                    status: 'approved',
                    foto_url: msg.photo_url,
                    nama_pengirim: msg.sender,
                    produk: guessedProduct,
                    bintang: 5,
                    embedding: embedding // Field krusial untuk AI!
                }, { onConflict: 'id' });

            if (error) {
                console.error(`   ❌ Gagal:`, error.message);
            } else {
                console.log(`   ✅ BERHASIL (Produk: ${guessedProduct || 'Umum'})`);
                count++;
            }

            // Delay agar tidak kena rate limit Gemini (gratisan: 15 RPM)
            await delay(4500);

        } catch (err: any) {
            console.error(`   ❌ Error:`, err.message);
        }
    }

    console.log(`\nSelesai! Berhasil memproses ${count} testimoni.`);
}

main();
