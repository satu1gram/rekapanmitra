import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Config ───────────────────────────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Log status env vars saat cold start (tanpa expose nilai aslinya)
console.log("[startup] TELEGRAM_BOT_TOKEN set:", !!TELEGRAM_BOT_TOKEN);
console.log("[startup] GROQ_API_KEY set:", !!GROQ_API_KEY, "| prefix:", GROQ_API_KEY?.slice(0, 7));

// ─── Types ────────────────────────────────────────────────────────────────────
type MitraLevel = "reseller" | "agen" | "agen_plus" | "sap" | "se";

interface ParsedOrder {
  customer_name: string | null;
  customer_phone: string | null;
  customer_type: "mitra" | "konsumen";
  mitra_level: MitraLevel | null;
  order_date: string | null; // ISO date string yyyy-mm-dd jika disebut dalam pesan
  items: { product_name: string; quantity: number }[];
  notes: string | null;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price_per_bottle: number;
  subtotal: number;
}

interface PendingOrder {
  customer_name: string | null;
  customer_phone: string | null;
  customer_type: "mitra" | "konsumen";
  mitra_level: MitraLevel | null;
  order_date: string | null; // ISO date yyyy-mm-dd
  items: OrderItem[];
  total_price: number;
  buy_price: number;
  notes: string | null;
}

// Harga tetap per botol sesuai level mitra (dari MITRA_LEVELS di src/types/index.ts)
const MITRA_PRICES: Record<MitraLevel, number> = {
  reseller: 217000,
  agen:     198000,
  agen_plus: 180000,
  sap:      170000,
  se:       150000,
};

const MITRA_LEVEL_LABEL: Record<MitraLevel, string> = {
  reseller:  "Reseller",
  agen:      "Agen",
  agen_plus: "Agen Plus",
  sap:       "Spesial Agen Plus (SAP)",
  se:        "Special Entrepreneur (SE)",
};

// ─── Telegram Helpers ─────────────────────────────────────────────────────────
async function sendMessage(chatId: string | number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("[sendMessage] TELEGRAM_BOT_TOKEN is not set!");
    return;
  }
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[sendMessage] Telegram API error ${res.status}:`, errBody);
  }
}

// ─── AI Parsing ───────────────────────────────────────────────────────────────
// Prompt kompak ~200 token (hemat ~60% vs versi sebelumnya)
const ORDER_PARSE_PROMPT = `Parse order BP Group. Output JSON only, no markdown.

PRODUCTS: British Propolis|British Propolis Green|British Propolis Blue|Brassic Pro|Brassic Eye|Belgie Facial Wash|Belgie Night Cream|Belgie Day Cream|Belgie Anti Aging Serum|Belgie Hair Tonic|Steffi Pro|BP Norway

ALIASES: bp/reg/merah→British Propolis, green/kids/hijau→British Propolis Green, blue/biru→British Propolis Blue, bro→Brassic Pro, bre/eye→Brassic Eye, fw/facial wash→Belgie Facial Wash, nc/night cream→Belgie Night Cream, dc/day cream→Belgie Day Cream, serum→Belgie Anti Aging Serum, ht/hair tonic→Belgie Hair Tonic, steffi→Steffi Pro, norway→BP Norway

MITRA LEVELS: reseller|agen|agen_plus(agen+/agen plus)|sap(spesial agen plus)|se(special entrepreneur)

RULES: qty>0 only, SKIP items marked as bonus/gratis/free, phone=08xxx/+62xxx digits only, order_date=yyyy-mm-dd if date mentioned else null, notes=special notes only (not payment/address info), non-order→{"error":"bukan pesan order"}

OUTPUT:
{"customer_name":str|null,"customer_phone":str|null,"customer_type":"mitra"|"konsumen","mitra_level":"reseller"|"agen"|"agen_plus"|"sap"|"se"|null,"order_date":str|null,"items":[{"product_name":str,"quantity":int}],"notes":str|null}`;

async function parseOrderWithAI(text: string): Promise<ParsedOrder | { error: string }> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: ORDER_PARSE_PROMPT },
        { role: "user", content: `Today: ${new Date().toISOString().slice(0, 10)}\n\n${text}` },
      ],
      temperature: 0.1,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error(`[groq] error ${response.status}:`, errBody);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  let rawText = (data?.choices?.[0]?.message?.content || "").trim();

  // Strip markdown fences jika ada
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  // Fallback: cari JSON object dalam teks jika model menambahkan teks sebelum/sesudah JSON
  if (!rawText.startsWith("{")) {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) rawText = match[0];
  }

  return JSON.parse(rawText);
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────
async function getRegistration(chatId: string) {
  const { data } = await supabase
    .from("telegram_bot_registrations")
    .select("slug, store_name, user_id")
    .eq("chat_id", chatId)
    .maybeSingle();
  return data;
}

async function getSession(chatId: string) {
  const { data } = await supabase
    .from("telegram_bot_sessions")
    .select("state, pending_order")
    .eq("chat_id", chatId)
    .maybeSingle();
  return data;
}

async function setSession(chatId: string, state: string, pendingOrder: PendingOrder | null = null) {
  await supabase.from("telegram_bot_sessions").upsert({
    chat_id: chatId,
    state,
    pending_order: pendingOrder,
    updated_at: new Date().toISOString(),
  });
}

// Lookup owner's mitra level dari profiles → untuk hitung buy_price (modal pemilik)
const OWNER_BUY_PRICES: Record<string, number> = {
  reseller: 217000,
  agen:     198000,
  agen_plus: 180000,
  sap:      170000,
  se:       150000,
};

async function getOwnerBuyPrice(userId: string): Promise<number> {
  const { data } = await supabase
    .from("profiles")
    .select("mitra_level")
    .eq("user_id", userId)
    .maybeSingle();

  const level = data?.mitra_level || "reseller";
  return OWNER_BUY_PRICES[level] ?? 217000;
}

// Lookup customer dari DB berdasarkan phone → dapat type & tier/level mitra
async function lookupCustomerLevel(
  phone: string,
  userId: string
): Promise<{ customer_type: "mitra" | "konsumen"; mitra_level: MitraLevel | null }> {
  if (!phone) return { customer_type: "konsumen", mitra_level: null };

  const { data } = await supabase
    .from("customers")
    .select("type, tier")
    .eq("user_id", userId)
    .eq("phone", phone)
    .maybeSingle();

  if (!data) return { customer_type: "konsumen", mitra_level: null };

  const isMitra = data.type?.toLowerCase() === "mitra";
  const level = isMitra && data.tier in MITRA_PRICES
    ? (data.tier as MitraLevel)
    : null;

  return { customer_type: isMitra ? "mitra" : "konsumen", mitra_level: level };
}

// ─── Product Name → DB Category Mapping ──────────────────────────────────────
const PRODUCT_TO_CATEGORY: Record<string, string> = {
  "british propolis": "BP",
  "british propolis green": "KID",
  "british propolis blue": "BLUE",
  "brassic pro": "BRO",
  "brassic eye": "BRE",
  "belgie facial wash": "BELGIE_FW",
  "belgie night cream": "BELGIE_NC",
  "belgie day cream": "BELGIE_DC",
  "belgie anti aging serum": "BELGIE_SERUM",
  "belgie hair tonic": "BELGIE_HT",
  "steffi pro": "STEFFI",
  "bp norway": "NORWAY",
};

function resolveCategory(productName: string): string {
  const lower = productName.toLowerCase().trim();
  // Sort by key length descending so more specific keys (e.g. "british propolis green")
  // are matched before shorter prefixes (e.g. "british propolis")
  const sortedEntries = Object.entries(PRODUCT_TO_CATEGORY).sort((a, b) => b[0].length - a[0].length);
  for (const [key, cat] of sortedEntries) {
    if (lower === key || lower.includes(key)) return cat;
  }
  // Keyword fallback
  if (lower.includes("green") || lower.includes("kid") || lower.includes("hijau")) return "KID";
  if (lower.includes("blue") || lower.includes("biru")) return "BLUE";
  if (lower.includes("norway")) return "NORWAY";
  if (lower.includes("facial wash") || lower.includes("fw")) return "BELGIE_FW";
  if (lower.includes("night cream") || lower.includes("nc")) return "BELGIE_NC";
  if (lower.includes("day cream") || lower.includes("dc")) return "BELGIE_DC";
  if (lower.includes("serum")) return "BELGIE_SERUM";
  if (lower.includes("hair tonic") || lower.includes("ht")) return "BELGIE_HT";
  if (lower.includes("bro") || lower.includes("brassic pro")) return "BRO";
  if (lower.includes("bre") || lower.includes("brassic eye")) return "BRE";
  if (lower.includes("belgie")) return "BELGIE_FW"; // Default Belgie
  if (lower.includes("steffi")) return "STEFFI";
  return "BP"; // default
}

// Tier thresholds: total qty >= min → gunakan package_type ini
const TIER_THRESHOLDS = [
  { min: 200, package_type: "200_botol" },
  { min: 40, package_type: "40_botol" },
  { min: 10, package_type: "10_botol" },
  { min: 5, package_type: "5_botol" },
  { min: 3, package_type: "3_botol" },
  { min: 1, package_type: "satuan" },
];

function resolvePackageType(totalQty: number): string {
  for (const tier of TIER_THRESHOLDS) {
    if (totalQty >= tier.min) return tier.package_type;
  }
  return "satuan";
}

// ─── Product Matching ─────────────────────────────────────────────────────────
async function matchProductsWithPrice(
  rawItems: { product_name: string; quantity: number }[],
  mitraLevel: MitraLevel | null
): Promise<OrderItem[]> {
  // Filter qty 0, lalu deduplicate produk yang sama
  const itemMap = new Map<string, { product_name: string; quantity: number }>();
  for (const item of rawItems) {
    if (!item.quantity || item.quantity <= 0) continue;
    const key = resolveCategory(item.product_name);
    if (itemMap.has(key)) {
      itemMap.get(key)!.quantity += item.quantity;
    } else {
      itemMap.set(key, { product_name: item.product_name, quantity: item.quantity });
    }
  }
  const items = Array.from(itemMap.values());

  // Map mitra level ke package_type di master_products
  const MITRA_LEVEL_TO_PACKAGE: Record<MitraLevel, string> = {
    reseller:  "3_botol",
    agen:      "5_botol",
    agen_plus: "10_botol",
    sap:       "40_botol",
    se:        "200_botol",
  };

  // Selalu query master_products untuk harga aktual per produk
  // Mitra: gunakan package_type sesuai level mereka
  // Konsumen: gunakan package_type sesuai total qty
  const { data: allProducts } = await supabase
    .from("master_products")
    .select("name, category, package_type, quantity_per_package, price")
    .eq("is_active", true);

  const products = allProducts || [];
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  const applicablePackageType = mitraLevel
    ? (MITRA_LEVEL_TO_PACKAGE[mitraLevel] ?? resolvePackageType(totalQty))
    : resolvePackageType(totalQty);

  return items.map((item) => {
    const category = resolveCategory(item.product_name);
    const matched = products.find(
      (p: any) => p.category === category && p.package_type === applicablePackageType
    ) || products.find(
      (p: any) => p.category === category && p.package_type === "satuan"
    );

    // Hitung subtotal dari harga paket langsung agar tidak ada sisa pembulatan
    // Contoh: 3_botol price=650.000, qty_per_pkg=3, beli 3 → subtotal=650.000 tepat
    const pkgPrice = matched ? Number(matched.price) : 250000;
    const pkgQty   = matched ? Number(matched.quantity_per_package) : 1;
    const pricePerBottle = Math.round(pkgPrice / pkgQty);
    const subtotal = Math.round((pkgPrice / pkgQty) * item.quantity);

    return {
      product_id: "",
      product_name: item.product_name,
      quantity: item.quantity,
      price_per_bottle: pricePerBottle,
      subtotal,
    };
  });
}

// ─── Format currency ──────────────────────────────────────────────────────────
function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// ─── Command Handlers ─────────────────────────────────────────────────────────
async function handleStart(chatId: string, slug: string | undefined) {
  if (!slug) {
    await sendMessage(
      chatId,
      "Halo! 👋 Saya bot <b>Rekapan Mitra</b>.\n\n" +
      "Saya membantu kamu membuat order otomatis dari pesan pelanggan.\n\n" +
      "Untuk mulai, hubungkan bot dengan toko kamu:\n" +
      "<code>/daftar [slug_toko]</code>\n\n" +
      "Slug toko bisa dilihat di menu <b>Toko Online</b> di aplikasi Rekapan.\n\n" +
      "Ketik /bantuan untuk info lebih lanjut."
    );
    return;
  }

  const { data: store } = await supabase
    .from("store_settings")
    .select("user_id, store_name, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (!store || !store.is_active) {
    await sendMessage(
      chatId,
      `❌ Toko dengan slug <code>${slug}</code> tidak ditemukan atau tidak aktif.\n\n` +
      "Pastikan:\n" +
      "• Slug sudah benar (cek di menu Toko Online)\n" +
      "• Toko sudah diaktifkan di aplikasi Rekapan"
    );
    return;
  }

  await supabase.from("telegram_bot_registrations").upsert({
    chat_id: chatId,
    user_id: store.user_id,
    slug,
    store_name: store.store_name,
    updated_at: new Date().toISOString(),
  });

  await setSession(chatId, "idle");

  await sendMessage(
    chatId,
    `✅ Berhasil terhubung ke toko <b>${store.store_name}</b>!\n\n` +
    "Cara pakai:\n" +
    "• Forward atau ketik pesan order dari pelanggan\n" +
    "• Saya akan parse & minta konfirmasi sebelum order dibuat\n\n" +
    "Contoh pesan order:\n" +
    "<i>min order 2 bp green sama 1 brassic eye, a.n Siti Wahyuni 08123456789</i>\n\n" +
    "Ketik /bantuan untuk lihat panduan lengkap."
  );
}

async function handleBantuan(chatId: string) {
  await sendMessage(
    chatId,
    "📋 <b>Panduan Bot Rekapan Mitra</b>\n\n" +
    "<b>Perintah:</b>\n" +
    "/daftar [slug] — Hubungkan bot ke toko kamu\n" +
    "/bantuan — Tampilkan panduan ini\n" +
    "/batal — Batalkan order yang sedang diproses\n\n" +
    "<b>Produk yang dikenali:</b>\n" +
    "• BP / British Propolis\n" +
    "• BP Green / British Propolis Green\n" +
    "• BP Blue / British Propolis Blue\n" +
    "• Brassic Pro\n" +
    "• Brassic Eye\n" +
    "• Belgie (skincare)\n" +
    "• Steffi Pro\n" +
    "• BP Norway\n\n" +
    "<b>Contoh format pesan:</b>\n" +
    "<i>order 2 bp green, 1 brassic eye\n" +
    "a.n Budi Santoso\n" +
    "08123456789</i>"
  );
}

async function handleConfirmation(
  chatId: string,
  text: string,
  session: { state: string; pending_order: PendingOrder | null },
  registration: { slug: string; store_name: string }
) {
  const pendingOrder = session.pending_order;

  if (text.toLowerCase() === "ya" || text.toLowerCase() === "y") {
    if (!pendingOrder) {
      await setSession(chatId, "idle");
      await sendMessage(chatId, "Tidak ada order yang menunggu konfirmasi.");
      return;
    }

    const payload = {
      slug: registration.slug,
      customer_name: pendingOrder.customer_name || "Pelanggan",
      customer_phone: pendingOrder.customer_phone || "-",
      customer_address: "",
      customer_type: pendingOrder.customer_type || "konsumen",
      tier: pendingOrder.mitra_level || "satuan",
      buy_price: pendingOrder.buy_price || 0,
      order_date: pendingOrder.order_date || null,
      items: pendingOrder.items,
    };

    const { data: result, error } = await (supabase as any).rpc("submit_public_order", {
      payload,
    });

    await setSession(chatId, "idle");

    if (error || !result?.success) {
      await sendMessage(
        chatId,
        `❌ Gagal membuat order.\n\nError: ${result?.error || error?.message || "Unknown error"}\n\nCoba lagi atau hubungi admin.`
      );
      return;
    }

    const shortId = result.order_id?.slice(0, 8) ?? "???";
    const itemLines = pendingOrder.items
      .map((i) => `• ${i.product_name} x${i.quantity} = ${formatRp(i.subtotal)}`)
      .join("\n");

    await sendMessage(
      chatId,
      `🎉 <b>Order Berhasil Dibuat!</b>\n\n` +
      `🧾 ID: <code>${shortId}...</code>\n` +
      `👤 ${pendingOrder.customer_name || "Pelanggan"}\n` +
      `📱 ${pendingOrder.customer_phone || "-"}\n\n` +
      `<b>Produk:</b>\n${itemLines}\n\n` +
      `💰 <b>Total: ${formatRp(pendingOrder.total_price)}</b>\n\n` +
      `Status: <i>menunggu bayar</i>\n` +
      `Cek detail di aplikasi Rekapan ✅`
    );
    return;
  }

  if (
    text.toLowerCase() === "tidak" ||
    text.toLowerCase() === "batal" ||
    text.toLowerCase() === "n"
  ) {
    await setSession(chatId, "idle");
    await sendMessage(chatId, "❌ Order dibatalkan.");
    return;
  }

  // Respon lain saat menunggu konfirmasi
  await sendMessage(
    chatId,
    "⏳ Masih ada order yang menunggu konfirmasi.\n\n" +
    "Ketik <b>ya</b> untuk buat order atau <b>batal</b> untuk batalkan."
  );
}

async function handleOrderMessage(chatId: string, text: string, registration: { slug: string; user_id: string }) {
  await sendMessage(chatId, "⏳ Sedang memproses pesan...");

  let parsed: ParsedOrder | { error: string };
  try {
    parsed = await parseOrderWithAI(text);
  } catch (e) {
    console.error("AI parsing failed:", e);
    await sendMessage(
      chatId,
      "❌ Gagal memproses pesan. Pastikan koneksi stabil dan coba lagi."
    );
    return;
  }

  if ("error" in parsed) {
    await sendMessage(
      chatId,
      "🤔 Pesan ini tidak terdeteksi sebagai order produk.\n\n" +
      "Contoh format yang bisa saya proses:\n" +
      "<i>min order 2 bp green sama 1 brassic eye\n" +
      "a.n Siti Wahyuni 08123456789</i>\n\n" +
      "Atau forward langsung pesan dari pelanggan."
    );
    return;
  }

  if (!parsed.items || parsed.items.length === 0) {
    await sendMessage(
      chatId,
      "❌ Tidak ditemukan produk dalam pesan.\n\n" +
      "Pastikan nama produk dan jumlah disebutkan dengan jelas."
    );
    return;
  }

  // ─ Tentukan mitra level: DB lookup (lebih akurat) > hasil AI > default konsumen ─
  let finalMitraLevel = parsed.mitra_level;
  let finalCustomerType = parsed.customer_type || "konsumen";

  if (parsed.customer_phone && registration.user_id) {
    const dbInfo = await lookupCustomerLevel(parsed.customer_phone, registration.user_id);
    if (dbInfo.mitra_level) {
      // DB lebih dipercaya daripada deteksi teks
      finalMitraLevel = dbInfo.mitra_level;
      finalCustomerType = "mitra";
    }
  }

  // Cocokkan produk + hitung harga sesuai level
  const itemsWithPrice = await matchProductsWithPrice(parsed.items, finalMitraLevel);
  const totalQty = itemsWithPrice.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = itemsWithPrice.reduce((sum, i) => sum + i.subtotal, 0);

  // buy_price = modal pemilik toko (bukan harga jual ke customer)
  // Ambil dari profiles.mitra_level pemilik toko
  const ownerBuyPrice = await getOwnerBuyPrice(registration.user_id);
  const buyPrice = ownerBuyPrice * totalQty;

  const pendingOrder: PendingOrder = {
    customer_name: parsed.customer_name,
    customer_phone: parsed.customer_phone,
    customer_type: finalCustomerType,
    mitra_level: finalMitraLevel,
    order_date: parsed.order_date || null,
    items: itemsWithPrice,
    total_price: totalPrice,
    buy_price: buyPrice,
    notes: parsed.notes,
  };

  // Nama pelanggan WAJIB — kalau tidak terdeteksi, tanya dulu
  if (!parsed.customer_name?.trim()) {
    await setSession(chatId, "waiting_customer_name", pendingOrder);
    await sendMessage(
      chatId,
      "⚠️ <b>Nama pelanggan tidak terdeteksi.</b>\n\n" +
      "Ketik nama pelanggannya:"
    );
    return;
  }

  await showConfirmation(chatId, pendingOrder, totalQty);
}

// ─── Helper: tampilkan pesan konfirmasi ───────────────────────────────────────
async function showConfirmation(chatId: string, pendingOrder: PendingOrder, totalQty: number) {
  const itemLines = pendingOrder.items
    .map((i) => `• ${i.product_name} x${i.quantity} — ${formatRp(i.price_per_bottle)}/btl = ${formatRp(i.subtotal)}`)
    .join("\n");

  // Baris tier/level
  let tierLine: string;
  if (pendingOrder.mitra_level) {
    const label = MITRA_LEVEL_LABEL[pendingOrder.mitra_level];
    tierLine = `🏷 Level: <b>${label}</b> (harga mitra flat)`;
  } else {
    const tierLabel: Record<string, string> = {
      satuan: "Satuan", "3_botol": "Reseller (3+)", "5_botol": "Agen (5+)",
      "10_botol": "Agen Plus (10+)", "40_botol": "SAP (40+)", "200_botol": "SE (200+)",
    };
    const appliedTier = tierLabel[resolvePackageType(totalQty)] || "Satuan";
    tierLine = `🏷 Tier: <b>${appliedTier}</b> (total ${totalQty} botol)`;
  }

  const dateLabel = pendingOrder.order_date
    ? new Date(pendingOrder.order_date + "T00:00:00+07:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "Hari ini";

  const confirmMsg =
    `📦 <b>Konfirmasi Order</b>\n\n` +
    `📅 Tanggal: ${dateLabel}\n` +
    `👤 Nama: ${pendingOrder.customer_name}\n` +
    `📱 HP: ${pendingOrder.customer_phone || "<i>tidak terdeteksi</i>"}\n` +
    `👥 Tipe: ${pendingOrder.mitra_level ? "Mitra" : "Konsumen"}\n\n` +
    `<b>Produk:</b>\n${itemLines}\n\n` +
    `${tierLine}\n` +
    `💰 <b>Total: ${formatRp(pendingOrder.total_price)}</b>\n` +
    (pendingOrder.notes ? `\n📝 Catatan: ${pendingOrder.notes}\n` : "") +
    `\nKetik <b>ya</b> untuk buat order atau <b>batal</b> untuk batalkan.`;

  await setSession(chatId, "confirm_order", pendingOrder);
  await sendMessage(chatId, confirmMsg);
}

// ─── Handler: menunggu nama pelanggan ─────────────────────────────────────────
async function handleWaitingCustomerName(
  chatId: string,
  text: string,
  session: { state: string; pending_order: PendingOrder | null }
) {
  const name = text.trim();
  if (!name || name.length < 2) {
    await sendMessage(chatId, "⚠️ Nama tidak valid. Ketik nama pelanggannya:");
    return;
  }

  const pendingOrder = session.pending_order;
  if (!pendingOrder) {
    await setSession(chatId, "idle");
    await sendMessage(chatId, "❌ Sesi habis. Kirim ulang pesan order-nya.");
    return;
  }

  // Update nama di pending order, pertahankan mitra level yang sudah dideteksi
  const updatedOrder: PendingOrder = { ...pendingOrder, customer_name: name };
  const totalQty = updatedOrder.items.reduce((sum, i) => sum + i.quantity, 0);

  await showConfirmation(chatId, updatedOrder, totalQty);
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  // Health check
  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, service: "telegram-bot" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const update = await req.json();
    const message = update.message || update.edited_message;

    // Abaikan update selain pesan teks
    if (!message) return new Response("OK");

    const chatId = String(message.chat.id);
    const text = (message.text || message.caption || "").trim();

    // ─── Commands ────────────────────────────────────────────────────────────
    if (text.startsWith("/start") || text.startsWith("/daftar")) {
      const parts = text.split(" ");
      const slug = parts[1]?.toLowerCase().trim();
      await handleStart(chatId, slug);
      return new Response("OK");
    }

    if (text.startsWith("/bantuan") || text.startsWith("/help")) {
      await handleBantuan(chatId);
      return new Response("OK");
    }

    if (text.startsWith("/batal") || text.startsWith("/batalkan")) {
      await setSession(chatId, "idle");
      await sendMessage(chatId, "❌ Order dibatalkan.");
      return new Response("OK");
    }

    // ─── Cek registrasi ──────────────────────────────────────────────────────
    const registration = await getRegistration(chatId);
    if (!registration) {
      await sendMessage(
        chatId,
        "Kamu belum terdaftar! 👋\n\n" +
        "Kirim perintah berikut untuk menghubungkan bot dengan toko kamu:\n" +
        "<code>/daftar [slug_toko]</code>\n\n" +
        "Slug toko ada di menu <b>Toko Online</b> di aplikasi Rekapan."
      );
      return new Response("OK");
    }

    // ─── Cek session state ───────────────────────────────────────────────────
    const session = await getSession(chatId);
    const state = session?.state || "idle";

    if (state === "confirm_order") {
      await handleConfirmation(chatId, text, session!, registration);
      return new Response("OK");
    }

    if (state === "waiting_customer_name") {
      await handleWaitingCustomerName(chatId, text, session!);
      return new Response("OK");
    }

    // ─── Parse pesan sebagai order ───────────────────────────────────────────
    if (!text) {
      await sendMessage(
        chatId,
        "Maaf, saya hanya bisa memproses pesan teks.\n\n" +
        "Forward atau ketik pesan order dari pelanggan."
      );
      return new Response("OK");
    }

    await handleOrderMessage(chatId, text, registration);
    return new Response("OK");
  } catch (e) {
    console.error("telegram-bot unhandled error:", e);
    // Selalu return 200 ke Telegram agar tidak di-retry terus
    return new Response("OK");
  }
});
