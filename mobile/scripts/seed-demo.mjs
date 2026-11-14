// Membuat (atau mengisi ulang) akun demo untuk peninjau App Store / Play Store.
//
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo.mjs
//
// Opsional: SUPABASE_URL, DEMO_EMAIL, DEMO_PASSWORD (kalau kosong, kata sandi acak dibuat dan dicetak sekali).
// Kunci service role JANGAN di-commit dan jangan dipakai di aplikasi. Jalankan dari laptop sendiri.
// Skrip ini hanya menyentuh data milik akun demo itu, dan menolak berjalan pada akun admin.
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const url = process.env.SUPABASE_URL || 'https://kqoitztjohxjnjoxctoz.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error('SUPABASE_SERVICE_ROLE_KEY belum diisi.'); process.exit(1); }
const email = (process.env.DEMO_EMAIL || 'reviewer@mitrabp.biz.id').toLowerCase();
const generated = !process.env.DEMO_PASSWORD;
const password = process.env.DEMO_PASSWORD || `Demo-${randomBytes(6).toString('base64url')}9`;

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const must = (label, { error, data }) => { if (error) { console.error(`Gagal: ${label}\n`, error.message); process.exit(1); } return data; };

// 1. Akun auth (sudah terverifikasi, jadi reviewer tidak perlu membuka email).
let user;
for (let page = 1; !user && page <= 20; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) must('daftar pengguna', { error });
  user = data.users.find(u => u.email?.toLowerCase() === email);
  if (data.users.length < 200) break;
}
if (user) {
  must('ubah kata sandi', await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true }));
} else {
  user = must('buat akun', await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: 'Dewi Reviewer' } })).user;
}
const uid = user.id;

// 2. Jangan pernah menyentuh akun admin.
const existing = must('baca profil', await admin.from('profiles').select('role').eq('user_id', uid).maybeSingle());
if (existing?.role && existing.role !== 'mitra') { console.error('Akun ini bukan mitra biasa. Dihentikan.'); process.exit(1); }

// 3. Bersihkan data demo lama supaya skrip bisa diulang.
for (const t of ['order_expenses', 'order_items', 'orders', 'stock_entries', 'general_expenses', 'general_income', 'monthly_targets', 'customers', 'store_settings']) {
  must(`hapus ${t}`, await admin.from(t).delete().eq('user_id', uid));
}

// 4. Profil siap pakai (onboarding sudah selesai).
must('profil', await admin.from('profiles').upsert({ user_id: uid, name: 'Dewi Reviewer', phone: '081200000000', location: 'Malang', mitra_level: 'agen', onboarding_completed: true }, { onConflict: 'user_id' }));

// 5. Pelanggan.
const custRows = [
  ['Bu Rina', '081234567801', 'reseller'], ['Pak Budi', '081234567802', 'satuan'], ['Mbak Sari', '081234567803', 'agen'],
  ['Bu Wati', '081234567804', 'satuan'], ['Kak Dimas', '081234567805', 'reseller'],
].map(([name, phone, tier]) => ({ user_id: uid, name, phone, tier, type: 'konsumen', city: 'Malang' }));
const customers = must('pelanggan', await admin.from('customers').insert(custRows).select('id,name,phone,tier'));
const cust = Object.fromEntries(customers.map(c => [c.name, c]));

// 6. Katalog untuk tautan produk (opsional, bila ada).
const catalog = must('katalog', await admin.from('master_products').select('id,category,package_type').eq('is_active', true));
const productId = cat => catalog.find(p => p.category === cat && p.package_type === 'satuan')?.id ?? null;

// 7. Order 6 minggu terakhir. [hariLalu, pelanggan, produk, qty, hargaPerBotol, modalPerBotol, status]
const day = n => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(9 + (n % 7), 15, 0, 0); return d.toISOString(); };
const plan = [
  [0, 'Bu Rina', 'BP', 3, 240000, 225000, 'selesai'], [0, 'Pak Budi', 'BLUE', 1, 285000, 225000, 'pending'],
  [1, 'Mbak Sari', 'BP', 5, 225000, 225000, 'terkirim'], [2, 'Bu Wati', 'BP', 1, 265000, 225000, 'menunggu_bayar'],
  [3, 'Kak Dimas', 'BELGIE', 2, 195000, 150000, 'selesai'], [5, 'Bu Rina', 'KID', 2, 285000, 225000, 'selesai'],
  [7, 'Pak Budi', 'BP', 2, 265000, 225000, 'selesai'], [9, 'Mbak Sari', 'BLUE', 3, 260000, 225000, 'selesai'],
  [12, 'Bu Wati', 'BELGIE', 1, 195000, 150000, 'selesai'], [15, 'Kak Dimas', 'BP', 3, 240000, 225000, 'selesai'],
  [19, 'Bu Rina', 'BP', 5, 225000, 225000, 'selesai'], [24, 'Pak Budi', 'KID', 1, 285000, 225000, 'selesai'],
  [30, 'Mbak Sari', 'BP', 2, 265000, 225000, 'selesai'], [38, 'Bu Wati', 'BLUE', 2, 270000, 225000, 'selesai'],
];
for (const [ago, who, prod, qty, price, cost, status] of plan) {
  const c = cust[who]; const total = qty * price; const buy = qty * cost;
  const order = must('order', await admin.from('orders').insert({
    user_id: uid, customer_id: c.id, customer_name: c.name, customer_phone: c.phone, tier: c.tier, quantity: qty,
    price_per_bottle: price, total_price: total, buy_price: buy, margin: total - buy, status, created_at: day(ago), updated_at: day(ago),
  }).select('id').single());
  must('item order', await admin.from('order_items').insert({ order_id: order.id, user_id: uid, product_id: productId(prod), product_name: prod, quantity: qty, price_per_bottle: price, subtotal: total, created_at: day(ago) }));
  if (ago % 3 === 0) must('biaya order', await admin.from('order_expenses').insert({ order_id: order.id, user_id: uid, name: 'Ongkir', amount: 12000, created_at: day(ago) }));
}

// 8. Stok, biaya umum, target, toko.
must('stok masuk', await admin.from('stock_entries').insert([
  { user_id: uid, type: 'in', quantity: 30, tier: 'agen', buy_price_per_bottle: 225000, total_buy_price: 6750000, notes: 'Restok dari upline', created_at: day(40) },
  { user_id: uid, type: 'in', quantity: 20, tier: 'agen', buy_price_per_bottle: 225000, total_buy_price: 4500000, notes: 'Restok bulanan', created_at: day(10) },
]));
must('stok saat ini', await admin.from('user_stock').upsert({ user_id: uid, current_stock: 18 }, { onConflict: 'user_id' }));
must('biaya umum', await admin.from('general_expenses').insert([
  { user_id: uid, name: 'Plastik dan lakban', amount: 45000, category: 'packaging', expense_date: day(3).slice(0, 10) },
  { user_id: uid, name: 'Iklan', amount: 100000, category: 'marketing', expense_date: day(8).slice(0, 10) },
]));
const now = new Date();
must('target', await admin.from('monthly_targets').upsert({ user_id: uid, year: now.getFullYear(), month: now.getMonth(), target_profit: 1500000, target_qty: 40, target_stock: 30 }, { onConflict: 'user_id,year,month' }));
must('toko', await admin.from('store_settings').insert({ user_id: uid, slug: 'demo-reviewer', store_name: 'Toko Demo Dewi', welcome_message: 'Halo! Pesan produk favoritmu di sini.', is_active: true }));

const counts = {};
for (const t of ['customers', 'orders', 'order_items', 'stock_entries']) counts[t] = (await admin.from(t).select('id', { count: 'exact', head: true }).eq('user_id', uid)).count;
console.log('\nAkun demo siap.\n  Email     :', email, '\n  Kata sandi:', generated ? password : '(sesuai DEMO_PASSWORD)', '\n  Data      :', counts);
if (generated) console.log('\nSimpan kata sandi ini di App Store Connect (App Review Information) dan Play Console (App access).');
