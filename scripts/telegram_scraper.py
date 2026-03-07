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

# File output tempat data akan disimpan
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '../src/lib/telegram_raw_data.json')
# ------------------

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
            
            # Cari tahu pengirim (bisa dari nama akun atau admin title)
            sender_name = "Pengguna Anonim"
            if message.sender:
                if getattr(message.sender, 'first_name', None):
                    sender_name = message.sender.first_name
                    if getattr(message.sender, 'last_name', None):
                        sender_name += f" {message.sender.last_name}"
                elif getattr(message.sender, 'title', None): # misal dari Channel
                    sender_name = message.sender.title
                elif getattr(message, 'post_author', None): # Custom admin title
                    sender_name = message.post_author
                    
            msg_obj = {
                "id": str(message.id),
                "date": message.date.isoformat() if message.date else datetime.now().isoformat(),
                "text": message.text,
                "sender": sender_name
            }
            messages_data.append(msg_obj)
            
    print(f"Berhasil mengekstrak {len(messages_data)} pesan teks.")
    
    # Simpan ke file JSON
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(messages_data, f, ensure_ascii=False, indent=2)
        
    print(f"File berhasil disimpan di: {OUTPUT_FILE}")

if __name__ == '__main__':
    if API_ID == 0 or API_HASH == 'GANTI_DENGAN_API_HASH_ANDA':
        print("ERROR: Anda belum mengisi API_ID dan API_HASH di dalam script ini!")
        print("Silakan buka file ini dan isi terlebih dahulu.")
    else:
        # Jalankan asynchronous main
        asyncio.run(scrape_group())
