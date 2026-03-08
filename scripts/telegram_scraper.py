import os
import json
import asyncio
from datetime import datetime
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError

# --- PENGATURAN ---
# 1. Buka https://my.telegram.org/ dan login.
# 2. Pergi ke "API development tools" dan buat aplikasi baru.
# 3. Salin `api_id` (angka) dan `api_hash` (teks panjang) ke bawah ini.

API_ID = 37220251 # GANTI DENGAN API ID ANDA (Angka, tanpa tanda kutip)
API_HASH = '39ce4be2d15ebf4ac86091c9275da90a' # GANTI DENGAN API HASH ANDA (String, gunakan tanda kutip)
GROUP_LINK = 'https://t.me/+aEs5CmlwJbozYWZl' 
PHONE_NUMBER = '' # Opsional: Isi dengan nomor HP Anda dalam format internasional (misal +62812...)

# File output tempat data akan disimpan
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '../src/lib/telegram_raw_data.json')

# Nama file sesi
session_name = '.credentials/telegram_session'

async def scrape_group():
    print("Memulai sesi Telegram...")
    
    # Session nama file lokal (telegram_session.session)
    client = TelegramClient('telegram_session', API_ID, API_HASH)
    
    await client.start()
    print("Client berhasil login!")
    
    try:
        # Resolve group entity
        print(f"Mencoba bergabung / mengakses grup: {GROUP_LINK}")
        entity = await client.get_entity(GROUP_LINK)
    except Exception as e:
        print(f"Gagal mengambil grup. Pastikan Anda sudah join terlebih dahulu di aplikasi Telegram Anda. Pesan Error: {e}")
        return

    print("Berhasil terhubung ke grup! Memulai ekstraksi pesan...")
    
    messages_data = []
    
    # Ambil hingga 1000 pesan terakhir (bisa disesuaikan batasnya)
    # Gunakan reverse=True jika ingin dari pesan terlama ke terbaru.
    async for message in client.iter_messages(entity, limit=1000):
        # Hanya ambil pesan teks yang ada isinya
        if message.text and len(message.text.strip()) > 10:
            
            # Cari tahu pengirim
            sender_name = "Pengguna Anonim"
            if message.sender:
                if getattr(message.sender, 'first_name', None):
                    sender_name = message.sender.first_name
                    if getattr(message.sender, 'last_name', None):
                        sender_name += f" {message.sender.last_name}"
                elif getattr(message.sender, 'title', None): 
                    sender_name = message.sender.title
                elif getattr(message, 'post_author', None): 
                    sender_name = message.post_author
            
            # --- HANDLE MEDIA (PHOTO) ---
            photo_path = None
            if message.photo:
                try:
                    # Buat folder download jika belum ada
                    download_dir = os.path.join(os.path.dirname(__file__), '../public/downloads/testimoni')
                    os.makedirs(download_dir, exist_ok=True)
                    
                    # Download media
                    filename = f"testi_{message.id}.jpg"
                    target_path = os.path.join(download_dir, filename)
                    
                    print(f"Mengunduh foto untuk pesan {message.id}...")
                    path = await message.download_media(file=target_path)
                    if path:
                        # Gunakan path relatif untuk web dev agar bisa diakses via /downloads/...
                        photo_path = f"/downloads/testimoni/{filename}"
                        print(f"Foto berhasil diunduh: {photo_path}")
                except Exception as e:
                    print(f"Gagal mengunduh foto {message.id}: {e}")
                    
            msg_obj = {
                "id": str(message.id),
                "date": message.date.isoformat() if message.date else datetime.now().isoformat(),
                "text": message.text,
                "sender": sender_name,
                "photo_url": photo_path # Simpan path lokal (atau nantinya URL Supabase)
            }
            messages_data.append(msg_obj)
            
    print(f"Berhasil mengekstrak {len(messages_data)} pesan teks.")
    
    # Simpan ke file JSON
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(messages_data, f, ensure_ascii=False, indent=2)
        
    print(f"File berhasil disimpan di: {OUTPUT_FILE}")

if __name__ == '__main__':
    if not API_ID or not API_HASH:
        print("ERROR: Anda belum mengisi API_ID dan API_HASH di dalam script ini!")
        print("Silakan buka file ini dan isi terlebih dahulu.")
    else:
        # Jalankan asynchronous main
        asyncio.run(scrape_group())
