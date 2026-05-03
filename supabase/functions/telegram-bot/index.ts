import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * CONFIGURATION & ENVIRONMENT VARIABLES
 * Diambil dari Supabase Edge Function Secrets
 */
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * TYPE DEFINITIONS
 * Mendefinisikan struktur data untuk sesi percakapan
 */
type BotStep = "idle" | "selecting_product" | "inputting_qty" | "adding_more" | "searching_customer" | "confirming";

interface SessionData {
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    buy_price: number;
  }[];
  last_product_id?: string;
  customer_info?: {
    id?: string;
    name: string;
    type: string;
    tier?: string
  };
  expenses?: {
    name: string;
    amount: number
  }[];
  order_date?: string;
  buy_price?: number; // Total Modal
}

/**
 * LOGIKA HARGA PUSAT & MODAL
 */
function getPricingForTier(tier: string, isBeauty: boolean, customLevels: any[] = []) {
  // Cek Level Kustom Terlebih Dahulu
  const custom = customLevels.find(l => l.level_code === tier);
  if (custom) {
    return custom.buy_price_per_bottle;
  }

  // Map Harga Standar
  const pricingMap: Record<string, { bp: number; beauty: number }> = {
    'satuan': { bp: 250000, beauty: 250000 },
    'reseller': { bp: 217000, beauty: 195000 },
    'agen': { bp: 198000, beauty: 195000 },
    'agen_plus': { bp: 180000, beauty: 180000 },
    'sap': { bp: 170000, beauty: 170000 },
    'se': { bp: 150000, beauty: 150000 },
  };

  const data = pricingMap[tier.toLowerCase()] || pricingMap['satuan'];
  return isBeauty ? data.beauty : data.bp;
}

function calculatePrice(productName: string, totalQty: number, selectedTier: string, hasBeauty: boolean) {
  const name = productName.toUpperCase();
  const isBeauty = name.includes('BELGIE') || name.includes('STEFFI');

  let activeTier = (selectedTier || 'satuan').toLowerCase();
  if (activeTier === 'satuan' || !selectedTier) {
    if (totalQty >= 200) activeTier = 'se';
    else if (totalQty >= 40) activeTier = 'sap';
    else if (totalQty >= 10) activeTier = 'agen_plus';
    else if (totalQty >= 5) activeTier = 'agen';
    else if (totalQty >= 3) activeTier = 'reseller';
  }

  return Math.round(getPricingForTier(activeTier, isBeauty));
}

/**
 * MULTI-LINE FULL TEXT PARSER
 * Fungsi cerdas untuk membedah input teks sekaligus
 */
async function parseFullText(text: string, tenantId: string): Promise<SessionData | null> {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return null;

  const data: SessionData = { items: [], expenses: [] };

  // 0. Ambil Level User & Produk
  const { data: profile } = await supabase.from("profiles").select("mitra_level").eq("user_id", tenantId).single();
  const { data: customLevels } = await supabase.from("user_mitra_levels").select("level_code, buy_price_per_bottle").eq("user_id", tenantId);
  const { data: allProds } = await supabase.from("master_products").select("id, name, category").eq("package_type", "satuan");

  const myLevel = profile?.mitra_level || 'satuan';

  for (const [i, line] of lines.entries()) {
    const lowerLine = line.toLowerCase();

    // 1. Deteksi Tanggal
    const dateRegex = /\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
    if (dateRegex.test(line)) {
      data.order_date = line;
      continue;
    }

    // 2. Deteksi Nama Pelanggan & Level Mitra (Explicit)
    const isNameLine = lowerLine.includes('order ') || 
                       (i === 1 && data.order_date) || 
                       (i === 0 && !data.order_date && !lowerLine.includes('order '));

    if (isNameLine) {
      let namePart = line.replace(/order\s+/i, '').trim();
      
      // Deteksi Level Mitra: (Mitra SAP), (SAP), Mitra SAP, dsb.
      const levelRegex = /\(?\b(?:mitra\s+)?(SE|SAP|AGEN\s+PLUS|AGEN|RESELLER)\b\)?/i;
      const levelMatch = namePart.match(levelRegex);
      let detectedTier = undefined;
      
      if (levelMatch) {
        detectedTier = levelMatch[1].toLowerCase().replace(/\s+/g, '_');
        namePart = namePart.replace(levelMatch[0], '').replace(/\(\s*\)/, '').trim();
      }

      const { data: existingCust } = await supabase.from("customers")
        .select("id, name, type, tier")
        .eq("user_id", tenantId)
        .ilike("name", `%${namePart}%`)
        .maybeSingle();

      if (existingCust) {
        data.customer_info = { 
          id: existingCust.id, 
          name: existingCust.name, 
          type: existingCust.type, 
          tier: detectedTier || existingCust.tier 
        };
      } else {
        data.customer_info = { 
          name: namePart, 
          type: 'mitra', 
          tier: detectedTier || 'satuan' 
        };
      }
      continue;
    }

    // 3. Deteksi Ongkir / Biaya Tambahan (Modal diabaikan dari teks)
    if (lowerLine.includes('ongkir') || lowerLine.includes('biaya')) {
      const match = line.match(/(.+?)\s+([\d.]+)/);
      if (match) {
        data.expenses?.push({
          name: match[1].trim(),
          amount: parseInt(match[2].replace(/\./g, ''))
        });
      }
      continue;
    }

    // 4. Deteksi Produk (Mendukung "+" untuk multiple produk di satu baris)
    const segments = line.split('+');
    for (const segment of segments) {
      // Cara baru yang lebih simpel: Cari angka dan cari teks (minimal 2 huruf)
      const qtyMatch = segment.match(/\d+/);
      const nameMatch = segment.match(/[a-zA-Z]{2,}/);

      if (qtyMatch && nameMatch) {
        const qty = parseInt(qtyMatch[0]);
        const namePart = nameMatch[0].toUpperCase();

        // Skip jika sepertinya ini tanggal atau bagian dari tanggal
        if (data.order_date && data.order_date.toUpperCase().includes(namePart)) continue;

        const matched = allProds?.find(p => {
          const pName = p.name.toUpperCase().replace(' SATUAN', '').trim();
          const pCat = (p.category || '').toUpperCase();

          // Prioritas 1: Exact Match dengan Category (BP, BRO, BRE, NORWAY, dll)
          if (pCat === namePart) return true;

          // Prioritas 2: Exact Match dengan Nama
          if (pName === namePart) return true;

          // Prioritas 3: Mapping Khusus Singkatan (Sesuai Kategori Database)
          const mapping: Record<string, string> = {
            'BP': 'BP',
            'KID': 'KID',
            'KIDS': 'KID',
            'HT': 'BELGIE_HT',
            'FW': 'BELGIE_FW',
            'NC': 'BELGIE_NC',
            'DC': 'BELGIE_DC',
            'SERUM': 'BELGIE_SERUM',
            'BLUE': 'BLUE',
            'NORWAY': 'NORWAY',
            'STEFFI': 'STEFFI',
            'BRO': 'BRO',
            'BRE': 'BRE'
          };
          
          if (mapping[namePart]) {
            const target = mapping[namePart];
            if (pCat === target || pName.includes(target.replace('_', ' '))) return true;
          }

          // Prioritas 4: Loose Match (Hanya jika namePart cukup panjang)
          if (namePart.length >= 3 && (pName.includes(namePart) || pCat.includes(namePart))) return true;

          return false;
        });

        if (matched) {
          const isBeauty = matched.name.toUpperCase().includes('BELGIE') || matched.name.toUpperCase().includes('STEFFI');
          data.items.push({
            product_id: matched.id,
            product_name: matched.name.replace(' Satuan', ''),
            quantity: qty,
            price: 250000,
            buy_price: getPricingForTier(myLevel, isBeauty, customLevels || [])
          });
        }
      }
    }
  }

  if (data.items.length > 0) {
    // Fallback Nama Pelanggan
    if (!data.customer_info && lines[1]) {
      const namePart = lines[1].replace(/order\s+/i, '').trim();
      const { data: existingCust } = await supabase.from("customers").select("id, name, type, tier").eq("user_id", tenantId).ilike("name", `%${namePart}%`).maybeSingle();
      data.customer_info = existingCust ? { id: existingCust.id, name: existingCust.name, type: existingCust.type, tier: existingCust.tier } : { name: namePart, type: 'konsumen' };
    }

    const totalQty = data.items.reduce((s, i) => s + i.quantity, 0);
    const hasBeauty = data.items.some(i => i.product_name.toUpperCase().includes('BELGIE') || i.product_name.toUpperCase().includes('STEFFI'));

    // Update Harga Satuan & Total Modal
    let totalModal = 0;
    data.items = data.items.map(i => {
      const price = calculatePrice(i.product_name, totalQty, data.customer_info?.tier || 'satuan', hasBeauty);
      totalModal += (i.buy_price * i.quantity);
      return { ...i, price };
    });

    data.buy_price = totalModal;
    return data;
  }

  return null;
}

/**
 * TELEGRAM COMMUNICATION HELPERS
 */
async function sendMessage(chatId: string | number, text: string, replyMarkup?: any) {
  return await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup
    }),
  }).then(r => r.json());
}

async function updateSession(chatId: string, updates: any) {
  await supabase
    .from("telegram_sessions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("chat_id", chatId);
}

/**
 * MAIN REQUEST HANDLER
 * Melayani Webhook dari Telegram
 */
serve(async (req) => {
  try {
    const update = await req.json();
    const message = update.message;
    const callbackQuery = update.callback_query;
    const chatId = (message?.chat?.id || callbackQuery?.message?.chat?.id)?.toString();

    if (!chatId) return new Response("OK");

    // Validasi Koneksi Toko
    const { data: conn } = await supabase
      .from("telegram_connections")
      .select("tenant_id")
      .eq("chat_id", chatId)
      .eq("is_active", true)
      .maybeSingle();

    if (!conn && !message?.text?.startsWith("/daftar")) return new Response("OK");

    // ─── 1. MODE FULL TEXT (PARSER) ───
    if (message?.text && message.text.includes('\n')) {
      const parsedData = await parseFullText(message.text, conn.tenant_id);
      if (parsedData && parsedData.items.length > 0) {
        await updateSession(chatId, {
          current_step: "confirming",
          session_data: parsedData
        });
        await showSummary(chatId, parsedData);
        return new Response("OK");
      }
    }

    // Ambil Status Sesi Terakhir
    const { data: session } = await supabase
      .from("telegram_sessions")
      .select("*")
      .eq("chat_id", chatId)
      .maybeSingle();

    const sessionData: SessionData = session?.session_data || { items: [] };

    // ─── 2. HANDLE TOMBOL (CALLBACK) ───
    if (callbackQuery) {
      const d = callbackQuery.data;

      if (d === "confirm_yes") {
        await submitOrder(chatId, sessionData, conn.tenant_id);
      } else if (d === "confirm_no") {
        await updateSession(chatId, { current_step: "idle", session_data: { items: [] } });
        await sendMessage(chatId, "❌ Pesanan telah dibatalkan.");
      } else if (d === "add_more") {
        await showProductList(chatId, conn.tenant_id);
      } else if (d.startsWith("prod_")) {
        const pId = d.replace("prod_", "");
        const { data: p } = await supabase.from("master_products").select("name").eq("id", pId).single();
        await updateSession(chatId, {
          current_step: "inputting_qty",
          session_data: { ...sessionData, last_product_id: pId }
        });
        await sendMessage(chatId, `Berapa jumlah untuk <b>${p.name.replace(" Satuan", "")}</b>?`);
      } else if (d === "finish_selection") {
        await updateSession(chatId, { current_step: "searching_customer" });
        await sendMessage(chatId, "👤 <b>Siapa nama pelanggan/mitra?</b>\n(Ketik nama untuk mencari)");
      } else if (d.startsWith("cust_")) {
        const cId = d.replace("cust_", "");
        const { data: c } = await supabase.from("customers").select("id, name, type, tier").eq("id", cId).single();
        const { data: profile } = await supabase.from("profiles").select("mitra_level").eq("user_id", conn.tenant_id).single();
        const { data: customLevels } = await supabase.from("user_mitra_levels").select("level_code, buy_price_per_bottle").eq("user_id", conn.tenant_id);

        const myLevel = profile?.mitra_level || 'satuan';
        const tQty = sessionData.items.reduce((s, i) => s + i.quantity, 0);
        const hasB = sessionData.items.some(i => i.product_name.toUpperCase().includes('BELGIE') || i.product_name.toUpperCase().includes('STEFFI'));

        let totalModal = 0;
        const items = sessionData.items.map(i => {
          const isB = i.product_name.toUpperCase().includes('BELGIE') || i.product_name.toUpperCase().includes('STEFFI');
          const buyPrice = getPricingForTier(myLevel, isB, customLevels || []);
          totalModal += (buyPrice * i.quantity);
          return {
            ...i,
            price: calculatePrice(i.product_name, tQty, c.tier || 'satuan', hasB),
            buy_price: buyPrice
          };
        });
        const final = { ...sessionData, items, buy_price: totalModal, customer_info: { id: c.id, name: c.name, type: c.type, tier: c.tier } };
        await updateSession(chatId, { session_data: final });
        await showSummary(chatId, final);
      } else if (d === "new_customer") {
        const { data: profile } = await supabase.from("profiles").select("mitra_level").eq("user_id", conn.tenant_id).single();
        const { data: customLevels } = await supabase.from("user_mitra_levels").select("level_code, buy_price_per_bottle").eq("user_id", conn.tenant_id);

        const myLevel = profile?.mitra_level || 'satuan';
        const tQty = sessionData.items.reduce((s, i) => s + i.quantity, 0);
        const hasB = sessionData.items.some(i => i.product_name.toUpperCase().includes('BELGIE') || i.product_name.toUpperCase().includes('STEFFI'));

        let totalModal = 0;
        const items = sessionData.items.map(i => {
          const isB = i.product_name.toUpperCase().includes('BELGIE') || i.product_name.toUpperCase().includes('STEFFI');
          const buyPrice = getPricingForTier(myLevel, isB, customLevels || []);
          totalModal += (buyPrice * i.quantity);
          return {
            ...i,
            price: calculatePrice(i.product_name, tQty, 'satuan', hasB),
            buy_price: buyPrice
          };
        });
        const final = { ...sessionData, items, buy_price: totalModal, customer_info: { name: sessionData.customer_info?.name || "Pelanggan Baru", type: "konsumen" } };
        await updateSession(chatId, { session_data: final });
        await showSummary(chatId, final);
      }
      return new Response("OK");
    }

    // ─── 3. HANDLE TEKS (INTERACTIVE FLOW) ───
    if (message?.text) {
      if (session?.current_step === "inputting_qty") {
        const q = parseInt(message.text);
        if (isNaN(q)) {
          await sendMessage(chatId, "⚠️ Mohon masukkan angka jumlah yang benar.");
        } else {
          const { data: p } = await supabase.from("master_products").select("name").eq("id", sessionData.last_product_id).single();
          const items = [...sessionData.items, {
            product_id: sessionData.last_product_id!,
            product_name: p.name.replace(" Satuan", ""),
            quantity: q,
            price: 250000,
            buy_price: 0 // Akan diupdate saat pilih pelanggan
          }];
          await updateSession(chatId, {
            current_step: "adding_more",
            session_data: { ...sessionData, items, last_product_id: undefined }
          });
          await sendMessage(chatId, `✅ <b>${p.name.replace(" Satuan", "")} x${q}</b> ditambahkan.`, {
            inline_keyboard: [
              [{ text: "➕ Tambah Lagi", callback_data: "add_more" }],
              [{ text: "🏁 Selesai", callback_data: "finish_selection" }]
            ]
          });
        }
      } else if (session?.current_step === "searching_customer") {
        const { data: custs } = await supabase.from("customers").select("id, name, type, tier").eq("user_id", conn.tenant_id).ilike("name", `%${message.text}%`).limit(5);
        await updateSession(chatId, { session_data: { ...sessionData, customer_info: { name: message.text, type: "konsumen" } } });
        const btns = (custs || []).map(c => ([{ text: `👤 ${c.name}`, callback_data: `cust_${c.id}` }]));
        btns.push([{ text: `🆕 Gunakan "${message.text}" (Baru)`, callback_data: "new_customer" }]);
        await sendMessage(chatId, "🎯 Pilih pelanggan atau gunakan nama baru:", { inline_keyboard: btns });
      } else {
        // Default: Tampilkan List Produk
        await showProductList(chatId, conn.tenant_id);
      }
    }

    return new Response("OK");
  } catch (err) {
    console.error(err);
    return new Response("OK");
  }
});

/**
 * TAMPILKAN DAFTAR PRODUK (GRID 3 KOLOM)
 */
async function showProductList(chatId: string, tenantId: string) {
  const { data: prods } = await supabase
    .from("master_products")
    .select("id, name")
    .eq("package_type", "satuan")
    .eq("is_active", true)
    .order("name");

  const buttons = [];
  const list = prods || [];

  for (let i = 0; i < list.length; i += 3) {
    buttons.push(list.slice(i, i + 3).map(p => ({
      text: p.name.replace(" British Propolis", "").replace("British Propolis", "BP").replace(" Satuan", ""),
      callback_data: `prod_${p.id}`
    })));
  }

  buttons.push([{ text: "🏁 SELESAI & PILIH PELANGGAN", callback_data: "finish_selection" }]);

  await updateSession(chatId, { current_step: "selecting_product" });
  await sendMessage(chatId, "🛒 <b>Pilih Produk Anda:</b>", { inline_keyboard: buttons });
}

/**
 * TAMPILKAN RINGKASAN ORDER (SUMMARY)
 */
async function showSummary(chatId: string, sessionData: SessionData) {
  let total = 0;
  const itemLines = sessionData.items.map(i => {
    total += (i.price * i.quantity);
    return `• ${i.product_name} x${i.quantity} = Rp ${(i.price * i.quantity).toLocaleString("id-ID")}`;
  }).join("\n");

  const expTotal = sessionData.expenses?.reduce((s, e) => s + e.amount, 0) || 0;
  const expLines = sessionData.expenses?.map(e => `• ${e.name}: Rp ${e.amount.toLocaleString("id-ID")}`).join("\n");

  let summary = `📋 <b>REKAP ORDER</b>\n`;
  if (sessionData.order_date) summary += `📅 Tanggal: <b>${sessionData.order_date}</b>\n`;
  summary += `👤 Pelanggan: <b>${sessionData.customer_info?.name}</b>\n`;
  summary += `─────────────────\n${itemLines}\n`;

  if (expTotal > 0) {
    summary += `─────────────────\n📉 <b>PENGELUARAN TAMBAHAN:</b>\n${expLines}\n`;
  }

  summary += `─────────────────\n💰 <b>TOTAL AKHIR: Rp ${total.toLocaleString("id-ID")}</b>\n`;
  if (sessionData.buy_price) {
    summary += `📦 <b>MODAL: Rp ${sessionData.buy_price.toLocaleString("id-ID")}</b>\n`;
  }
  summary += `\nSimpan pesanan ini ke database?`;

  await updateSession(chatId, { current_step: "confirming" });
  await sendMessage(chatId, summary, {
    inline_keyboard: [
      [{ text: "✅ YA, SIMPAN", callback_data: "confirm_yes" }],
      [{ text: "❌ BATALKAN", callback_data: "confirm_no" }]
    ]
  });
}

/**
 * SIMPAN ORDER KE DATABASE
 */
async function submitOrder(chatId: string, sessionData: SessionData, tenantId: string) {
  const { data: store } = await supabase.from("store_settings").select("slug").eq("user_id", tenantId).single();

  // Format Tanggal: "15 April 2026" -> "2026-04-15"
  let formattedDate = undefined;
  if (sessionData.order_date) {
    const months: Record<string, string> = {
      'januari': '01', 'februari': '02', 'maret': '03', 'april': '04', 'mei': '05', 'juni': '06',
      'juli': '07', 'agustus': '08', 'september': '09', 'oktober': '10', 'november': '11', 'desember': '12',
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
      'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    const parts = sessionData.order_date.split(' ');
    if (parts.length >= 3) {
      const day = parts[0].padStart(2, '0');
      const month = months[parts[1].toLowerCase()] || '01';
      const year = parts[2];
      formattedDate = `${year}-${month}-${day}`;
    }
  }

  const payload = {
    slug: store.slug,
    customer_name: sessionData.customer_info?.name,
    customer_phone: "-",
    customer_type: sessionData.customer_info?.type || "konsumen",
    tier: sessionData.customer_info?.tier || "satuan",
    items: sessionData.items.map(i => ({
      product_id: i.product_id,
      product_name: i.product_name, // WAJIB ADA
      quantity: i.quantity,
      price_per_bottle: i.price,
      subtotal: i.price * i.quantity
    })),
    buy_price: sessionData.buy_price,
    order_date: formattedDate // SESUAI RPC
  };

  const { data: res, error } = await (supabase as any).rpc("submit_public_order", { payload });

  if (error || !res?.success) {
    console.error("RPC Error:", error || res?.error);
    await sendMessage(chatId, `❌ Gagal menyimpan order. Terjadi kesalahan teknis.`);
  } else {
    const orderId = res.order_id;

    // Simpan Biaya Tambahan (Ongkir/Lainnya)
    if (sessionData.expenses && sessionData.expenses.length > 0) {
      let totalExpenses = 0;
      for (const e of sessionData.expenses) {
        const { error: expErr } = await supabase.from("order_expenses").insert({
          order_id: orderId,
          user_id: tenantId, // WAJIB ADA
          name: e.name,
          amount: e.amount
        });
        if (!expErr) totalExpenses += e.amount;
        else console.error("Expense Error:", expErr);
      }

      // Update Margin di tabel Orders (dikurangi pengeluaran tambahan)
      if (totalExpenses > 0) {
        const { data: currentOrder } = await supabase.from("orders").select("margin").eq("id", orderId).single();
        if (currentOrder) {
          await supabase.from("orders")
            .update({ margin: currentOrder.margin - totalExpenses })
            .eq("id", orderId);
        }
      }
    }
    await sendMessage(chatId, `✅ <b>Order Berhasil Dicatat!</b>\nProfit otomatis terhitung setelah biaya tambahan.`);
  }

  // Reset Sesi ke Idle
  await updateSession(chatId, { current_step: "idle", session_data: { items: [] } });
}
