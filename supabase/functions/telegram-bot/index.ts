import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Config ───────────────────────────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────
type BotStep = "idle" | "selecting_product" | "inputting_qty" | "adding_more" | "searching_customer" | "confirming";

interface SessionData {
  items: { product_id: string; product_name: string; quantity: number; price: number }[];
  last_product_id?: string;
  customer_info?: { id?: string; name: string; type: string; tier?: string };
}

// ─── Pricing Logic Pusat (Mixed Order Support) ────────────────────────────────
function calculatePrice(productName: string, totalQty: number, selectedTier: string, hasBeauty: boolean) {
  const name = productName.toUpperCase();
  const isBeauty = name.includes('BELGIE') || name.includes('STEFFI');
  
  let activeTier = (selectedTier || 'satuan').toLowerCase();
  if (activeTier === 'satuan') {
    if (totalQty >= 200) activeTier = 'se';
    else if (totalQty >= 40) activeTier = 'sap';
    else if (totalQty >= 10) activeTier = 'agen_plus';
    else if (totalQty >= 5) activeTier = 'agen';
    else if (totalQty >= 3) activeTier = 'reseller';
  }

  const pricingMap: Record<string, { bp: number; beauty: number }> = {
    'satuan':    { bp: 250000, beauty: 250000 },
    'reseller':  { bp: hasBeauty ? 217000 : 216666, beauty: 195000 },
    'agen':      { bp: 198000, beauty: 195000 },
    'agen_plus': { bp: 180000, beauty: 180000 },
    'sap':       { bp: 170000, beauty: 170000 },
    'se':        { bp: 150000, beauty: 150000 },
  };

  const tierData = pricingMap[activeTier] || pricingMap['satuan'];
  const price = isBeauty ? tierData.beauty : tierData.bp;
  return Math.round(price);
}

// ─── Telegram Helpers ─────────────────────────────────────────────────────────
async function sendMessage(chatId: string | number, text: string, replyMarkup?: any) {
  const body: any = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;
  return await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(r => r.json());
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────
async function getConnection(chatId: string) {
  const { data } = await supabase.from("telegram_connections").select("tenant_id").eq("chat_id", chatId).eq("is_active", true).maybeSingle();
  return data;
}

async function getSession(chatId: string, tenantId: string) {
  const { data } = await supabase.from("telegram_sessions").select("*").eq("chat_id", chatId).maybeSingle();
  if (!data) {
    const { data: newSess } = await supabase.from("telegram_sessions")
      .insert({ chat_id: chatId, tenant_id: tenantId, current_step: "idle", session_data: { items: [] } })
      .select("*").single();
    return newSess;
  }
  return data;
}

async function updateSession(chatId: string, updates: any) {
  await supabase.from("telegram_sessions").update({ ...updates, updated_at: new Date().toISOString() }).eq("chat_id", chatId);
}

// ─── Core Logic ───────────────────────────────────────────────────────────────
serve(async (req) => {
  try {
    const update = await req.json();
    const message = update.message;
    const callbackQuery = update.callback_query;
    const chatId = (message?.chat?.id || callbackQuery?.message?.chat?.id)?.toString();
    if (!chatId) return new Response("OK");

    const connection = await getConnection(chatId);
    if (!connection && !message?.text?.startsWith("/daftar")) {
      await sendMessage(chatId, "👋 Halo! Gunakan: <code>/daftar [slug_toko]</code> untuk menghubungkan akun Anda.");
      return new Response("OK");
    }

    if (message?.text?.startsWith("/daftar")) {
      const slug = message.text.split(" ")[1];
      if (!slug) return new Response("OK");
      const { data: store } = await supabase.from("store_settings").select("user_id, store_name").eq("slug", slug).maybeSingle();
      if (!store) { await sendMessage(chatId, "❌ Toko tidak ditemukan."); return new Response("OK"); }
      await supabase.from("telegram_connections").upsert({ chat_id: chatId, tenant_id: store.user_id, is_active: true }, { onConflict: "chat_id" });
      await sendMessage(chatId, `✅ Terhubung ke <b>${store.store_name}</b>!`);
      return new Response("OK");
    }

    const session = await getSession(chatId, connection.tenant_id);
    const sessionData: SessionData = session.session_data || { items: [] };

    if (callbackQuery) {
      const data = callbackQuery.data;
      await answerCallbackQuery(callbackQuery.id);

      if (data.startsWith("prod_")) {
        const prodId = data.replace("prod_", "");
        const { data: prod } = await supabase.from("master_products").select("name").eq("id", prodId).single();
        await updateSession(chatId, { current_step: "inputting_qty", session_data: { ...sessionData, last_product_id: prodId } });
        await sendMessage(chatId, `Berapa jumlah untuk <b>${prod.name.replace(" Satuan", "")}</b>?`);
      } else if (data === "finish_selection") {
        if (sessionData.items.length === 0) { await sendMessage(chatId, "⚠️ Pilih produk dulu."); } 
        else {
          await updateSession(chatId, { current_step: "searching_customer" });
          await sendMessage(chatId, "👤 <b>Siapa nama pelanggan/mitra?</b>\n(Ketik nama untuk mencari)");
        }
      } else if (data.startsWith("cust_")) {
        const custId = data.replace("cust_", "");
        const { data: cust } = await supabase.from("customers").select("id, name, type, tier").eq("id", custId).single();
        const totalQty = sessionData.items.reduce((s, i) => s + i.quantity, 0);
        const hasBeauty = sessionData.items.some(i => i.product_name.toUpperCase().includes('BELGIE') || i.product_name.toUpperCase().includes('STEFFI'));
        const updatedItems = sessionData.items.map(item => ({ ...item, price: calculatePrice(item.product_name, totalQty, cust.tier || 'satuan', hasBeauty) }));
        const finalData = { ...sessionData, items: updatedItems, customer_info: { id: cust.id, name: cust.name, type: cust.type, tier: cust.tier } };
        await updateSession(chatId, { session_data: finalData });
        await showSummary(chatId, finalData);
      } else if (data === "new_customer") {
        const totalQty = sessionData.items.reduce((s, i) => s + i.quantity, 0);
        const hasBeauty = sessionData.items.some(i => i.product_name.toUpperCase().includes('BELGIE') || i.product_name.toUpperCase().includes('STEFFI'));
        const updatedItems = sessionData.items.map(item => ({ ...item, price: calculatePrice(item.product_name, totalQty, 'satuan', hasBeauty) }));
        const finalData = { ...sessionData, items: updatedItems, customer_info: { name: sessionData.customer_info?.name || "Pelanggan Baru", type: "konsumen" } };
        await updateSession(chatId, { session_data: finalData });
        await showSummary(chatId, finalData);
      } else if (data === "confirm_yes") {
        await submitOrder(chatId, sessionData, connection.tenant_id);
      } else if (data === "confirm_no") {
        await updateSession(chatId, { current_step: "idle", session_data: { items: [] } });
        await sendMessage(chatId, "❌ Order dibatalkan.");
      } else if (data === "add_more") {
        await showProductList(chatId, connection.tenant_id);
      }
      return new Response("OK");
    }

    const text = message?.text;
    if (text === "/start" || text === "/batal") {
      await updateSession(chatId, { current_step: "idle", session_data: { items: [] } });
      await sendMessage(chatId, "Siap melayani! Ketik apa saja untuk memulai pesanan baru.");
      return new Response("OK");
    }

    switch (session.current_step) {
      case "idle":
      case "adding_more":
        await showProductList(chatId, connection.tenant_id);
        break;

      case "inputting_qty":
        const qty = parseInt(text);
        if (isNaN(qty) || qty <= 0) { await sendMessage(chatId, "⚠️ Masukkan angka jumlah yang valid."); } 
        else {
          const prodId = sessionData.last_product_id!;
          const { data: baseProd } = await supabase.from("master_products").select("name").eq("id", prodId).single();
          const newItems = [...sessionData.items, { product_id: prodId, product_name: baseProd.name.replace(" Satuan", ""), quantity: qty, price: 250000 }];
          await updateSession(chatId, { current_step: "adding_more", session_data: { ...sessionData, items: newItems, last_product_id: undefined } });
          await sendMessage(chatId, `✅ <b>${baseProd.name.replace(" Satuan", "")} x${qty}</b> ditambahkan ke keranjang.`, {
            inline_keyboard: [
              [{ text: "➕ Tambah Produk", callback_data: "add_more" }],
              [{ text: "🏁 Selesai & Pilih Pelanggan", callback_data: "finish_selection" }]
            ]
          });
        }
        break;

      case "searching_customer":
        const { data: customers } = await supabase.from("customers").select("id, name, type, tier").eq("user_id", connection.tenant_id).ilike("name", `%${text}%`).limit(5);
        await updateSession(chatId, { session_data: { ...sessionData, customer_info: { name: text, type: "konsumen" } } });
        if (!customers || customers.length === 0) {
          await sendMessage(chatId, `🔍 Tidak ditemukan "${text}". Pakai nama ini sebagai pelanggan baru?`, {
            inline_keyboard: [[{ text: `🆕 Gunakan "${text}"`, callback_data: "new_customer" }]]
          });
        } else {
          const buttons = customers.map(c => ([{ text: `👤 ${c.name} (${c.type})`, callback_data: `cust_${c.id}` }]));
          buttons.push([{ text: `🆕 Gunakan "${text}" (Baru)`, callback_data: "new_customer" }]);
          await sendMessage(chatId, "🎯 Pilih pelanggan yang sesuai:", { inline_keyboard: buttons });
        }
        break;
    }
    return new Response("OK");
  } catch (err) { console.error(err); return new Response("OK"); }
});

async function showProductList(chatId: string, tenantId: string) {
  const { data: products } = await supabase.from("master_products").select("id, name").eq("package_type", "satuan").eq("is_active", true).order("name");
  const buttons = [];
  const list = products || [];
  for (let i = 0; i < list.length; i += 3) {
    buttons.push(list.slice(i, i + 3).map(p => ({ 
      text: p.name.replace(" British Propolis", "").replace("British Propolis", "BP").replace(" Satuan", ""), 
      callback_data: `prod_${p.id}` 
    })));
  }
  buttons.push([{ text: "🏁 SELESAI", callback_data: "finish_selection" }]);
  await updateSession(chatId, { current_step: "selecting_product" });
  await sendMessage(chatId, "🛒 <b>Pilih Produk:</b>", { inline_keyboard: buttons });
}

async function showSummary(chatId: string, sessionData: SessionData) {
  let total = 0;
  const itemLines = sessionData.items.map(item => { 
    const subtotal = item.price * item.quantity; 
    total += subtotal; 
    return `• ${item.product_name} x${item.quantity} = Rp ${subtotal.toLocaleString("id-ID")}`; 
  }).join("\n");

  const summary = `📋 <b>REKAP ORDER</b>\n` +
                  `👤 Pelanggan: <b>${sessionData.customer_info?.name}</b>\n` +
                  `─────────────────\n` +
                  `${itemLines}\n` +
                  `─────────────────\n` +
                  `💰 <b>TOTAL: Rp ${total.toLocaleString("id-ID")}</b>\n\n` +
                  `Apakah rekap di atas sudah benar?`;

  await updateSession(chatId, { current_step: "confirming" });
  await sendMessage(chatId, summary, { 
    inline_keyboard: [
      [{ text: "✅ YA, KIRIM", callback_data: "confirm_yes" }], 
      [{ text: "❌ BATAL", callback_data: "confirm_no" }]
    ] 
  });
}

async function submitOrder(chatId: string, sessionData: SessionData, tenantId: string) {
  const { data: store } = await supabase.from("store_settings").select("slug").eq("user_id", tenantId).single();
  const payload = { 
    slug: store.slug, 
    customer_name: sessionData.customer_info?.name, 
    customer_phone: "-",
    customer_type: sessionData.customer_info?.type || "konsumen",
    tier: sessionData.customer_info?.tier || "satuan",
    items: sessionData.items.map(i => ({ 
      product_id: i.product_id, 
      product_name: i.product_name,
      quantity: i.quantity, 
      price_per_bottle: i.price, 
      subtotal: i.price * i.quantity 
    })),
    buy_price: 0
  };
  const { data: result, error } = await (supabase as any).rpc("submit_public_order", { payload });
  if (error || !result?.success) { 
    console.error("Order Submit Error:", error || result?.error);
    await sendMessage(chatId, `❌ Gagal menyimpan order. Silakan coba beberapa saat lagi.`); 
  } 
  else { 
    await sendMessage(chatId, `✅ <b>Order Berhasil Dicatat!</b>\nOrder ID: <code>${result.order_id.slice(0,8)}</code>`); 
  }
  await updateSession(chatId, { current_step: "idle", session_data: { items: [] } });
}
