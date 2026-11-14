const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const root = process.argv[2], out = process.argv[3];
require('fs').mkdirSync(out, { recursive: true });
const types = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(root, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(4300, '127.0.0.1');

const uid = '11111111-1111-1111-1111-111111111111';
const now = new Date();
const d = (daysAgo, h = 10) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, h).toISOString();
const orders = [
  { id: 'o1', user_id: uid, customer_id: 'c1', customer_name: 'Bu Rina', customer_phone: '081234567890', tier: 'reseller', quantity: 3, price_per_bottle: 240000, total_price: 720000, buy_price: 675000, margin: 28000, status: 'selesai', transfer_proof_url: null, created_at: d(0, 9), updated_at: d(0) },
  { id: 'o2', user_id: uid, customer_id: 'c2', customer_name: 'Pak Budi', customer_phone: '', tier: 'satuan', quantity: 1, price_per_bottle: 285000, total_price: 285000, buy_price: 225000, margin: 60000, status: 'pending', transfer_proof_url: null, created_at: d(0, 8), updated_at: d(0) },
  { id: 'o3', user_id: uid, customer_id: null, customer_name: 'Mbak Sari', customer_phone: '', tier: 'agen', quantity: 5, price_per_bottle: 225000, total_price: 1125000, buy_price: 1125000, margin: -15000, status: 'selesai', transfer_proof_url: null, created_at: d(1), updated_at: d(1) },
];
const cat = (c, t, q, p) => ({ id: `${c}-${t}`, name: `${c} ${t}`, category: c, package_type: t, quantity_per_package: q, price: p, is_active: true });
const catalog = [cat('BP', 'satuan', 1, 265000), cat('BP', '3_botol', 3, 720000), cat('BP', '5_botol', 5, 1125000), cat('BLUE', 'satuan', 1, 285000), cat('BLUE', '3_botol', 3, 780000), cat('BELGIE', 'satuan', 1, 195000), cat('KID', 'satuan', 1, 285000), cat('KID', '3_botol', 3, 780000)];
const data = {
  profiles: [{ id: 'p1', user_id: uid, name: 'Salinov', phone: '0812', location: null, mitra_level: 'agen', custom_buy_price: null, custom_level_name: null, onboarding_completed: true, created_at: d(30), updated_at: d(1) }],
  orders, customers: [{ id: 'c1', user_id: uid, name: 'Bu Rina', phone: '081234567890', tier: 'reseller', total_orders: 4, total_spent: 2880000, created_at: d(20), updated_at: d(0) }],
  stock_entries: [{ id: 's1', user_id: uid, type: 'in', quantity: 20, tier: 'agen', buy_price_per_bottle: 225000, total_buy_price: 4500000, notes: 'Restok dari upline', order_id: null, transfer_proof_url: null, created_at: d(2) }],
  user_stock: [{ id: 'us', user_id: uid, current_stock: 3, updated_at: d(0) }],
  master_products: catalog,
  general_expenses: [{ id: 'g1', user_id: uid, name: 'Plastik', amount: 30000, category: 'packaging', notes: null, expense_date: d(3).slice(0, 10), created_at: d(3) }],
  general_income: [],
  monthly_targets: [{ year: now.getFullYear(), month: now.getMonth(), target_profit: 500000, target_qty: 40, target_stock: 30 }],
  order_items: [{ id: 'i1', order_id: 'o1', user_id: uid, product_name: 'BP', product_id: 'BP-3_botol', quantity: 3, price_per_bottle: 240000, subtotal: 720000, created_at: d(0) }],
  store_settings: [],
  order_expenses: [{ id: 'e1', order_id: 'o1', user_id: uid, name: 'Ongkir', amount: 12000, created_at: d(0) }],
};
const posted = [];
const mode = process.argv[4] || 'full';
if (mode === 'onboarding') data.profiles[0].onboarding_completed = false;
if (mode === 'empty') { data.orders.length = 0; }
if (mode === 'store') {
  // Data contoh yang tampak hidup untuk screenshot store. Semua fiktif.
  data.profiles[0].name = 'Dewi Rahayu';
  const people = [['Bu Rina', '0812-3456-7801', 'reseller'], ['Pak Budi', '0812-3456-7802', 'satuan'], ['Mbak Sari', '0812-3456-7803', 'agen'], ['Bu Wati', '0812-3456-7804', 'satuan'], ['Kak Dimas', '0812-3456-7805', 'reseller']];
  data.customers = people.map(([name, phone, tier], i) => ({ id: 'c' + (i + 1), user_id: uid, name, phone, tier, type: 'konsumen', total_orders: 3 + i, total_spent: (3 + i) * 520000, created_at: d(30 + i), updated_at: d(i) }));
  const plan = [[0, 0, 3, 240000, 'selesai'], [0, 1, 1, 285000, 'pending'], [0, 4, 2, 195000, 'menunggu_bayar'], [1, 2, 5, 225000, 'terkirim'], [2, 3, 1, 265000, 'selesai'], [3, 4, 2, 195000, 'selesai'], [5, 0, 2, 285000, 'selesai'], [7, 1, 2, 265000, 'selesai'], [9, 2, 3, 260000, 'selesai'], [12, 3, 1, 195000, 'selesai'], [15, 4, 3, 240000, 'selesai'], [19, 0, 5, 225000, 'selesai']];
  data.orders = plan.map(([ago, ci, qty, price, status], i) => { const c = data.customers[ci]; const total = qty * price; const buy = qty * 225000; return { id: 'o' + (i + 1), user_id: uid, customer_id: c.id, customer_name: c.name, customer_phone: c.phone, tier: c.tier, quantity: qty, price_per_bottle: price, total_price: total, buy_price: buy, margin: total - buy, status, transfer_proof_url: null, created_at: d(ago, 9 + (i % 6)), updated_at: d(ago) }; });
  data.order_items = data.orders.map((o, i) => ({ id: 'i' + i, order_id: o.id, user_id: uid, product_name: ['BP', 'BLUE', 'BELGIE', 'KID'][i % 4], product_id: null, quantity: o.quantity, price_per_bottle: o.price_per_bottle, subtotal: o.total_price, created_at: o.created_at }));
  data.user_stock = [{ id: 'us', user_id: uid, current_stock: 18, updated_at: d(0) }];
  data.stock_entries = [{ id: 's1', user_id: uid, type: 'in', quantity: 30, tier: 'agen', buy_price_per_bottle: 225000, total_buy_price: 6750000, notes: 'Restok dari upline', created_at: d(25) }, { id: 's2', user_id: uid, type: 'in', quantity: 20, tier: 'agen', buy_price_per_bottle: 225000, total_buy_price: 4500000, notes: 'Restok bulanan', created_at: d(8) }];
  data.general_expenses = [{ id: 'g1', user_id: uid, name: 'Plastik dan lakban', amount: 45000, category: 'packaging', notes: null, expense_date: d(3).slice(0, 10), created_at: d(3) }, { id: 'g2', user_id: uid, name: 'Iklan', amount: 100000, category: 'marketing', notes: null, expense_date: d(6).slice(0, 10), created_at: d(6) }];
  data.monthly_targets = [{ year: now.getFullYear(), month: now.getMonth(), target_profit: 1500000, target_qty: 40, target_stock: 30 }];
}
(async () => {
  // Use the preinstalled browser when the project's Playwright pins another version.
  const exe = process.env.PW_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const b = await chromium.launch(exe ? { executablePath: fs.statSync(exe).isDirectory() ? undefined : exe } : {});
  const vp = mode === 'store' ? { width: +(process.env.STORE_W || 440), height: +(process.env.STORE_H || 956) } : { width: 390, height: 844 };
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mode === 'store' ? +(process.env.STORE_DPR || 3) : 2 });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/*supabase.co/**', async route => {
    const req = route.request(); const url = new URL(req.url());
    if (url.pathname.includes('/storage/v1/')) { posted.push({ method: req.method(), table: 'storage', body: url.pathname }); return route.fulfill({ status: 200, json: { Key: 'transfer-proofs/x.jpg', Id: '1' } }); }
    if (url.pathname.includes('/functions/v1/delete-account')) { posted.push({ method: 'POST', table: 'fn:delete-account', body: req.postDataJSON() }); return route.fulfill({ status: 200, json: { ok: true } }); }
    if (url.pathname.includes('/auth/v1/token')) { const b = req.postDataJSON(); posted.push({ method: 'POST', table: 'auth:token', body: { email: b.email, password: b.password ? '***' : '' } }); const exp = Math.floor(Date.now()/1000)+3600; return route.fulfill({ status: 200, json: { access_token: 'x.eyJzdWIiOiIxIn0.x', refresh_token: 'r2', token_type: 'bearer', expires_in: 3600, expires_at: exp, user: { id: uid, email: 'mitra@contoh.id', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '' } } }); }
    if (url.pathname.includes('/auth/v1/signup')) { posted.push({ method: 'POST', table: 'auth:signup', body: { email: req.postDataJSON()?.email } }); return route.fulfill({ status: 200, json: { id: 'u-new', email: req.postDataJSON()?.email, aud: 'authenticated', role: '', identities: [{ id: 'i1' }], app_metadata: {}, user_metadata: {}, created_at: '' } }); }
    if (url.pathname.includes('/auth/v1/resend')) { posted.push({ method: 'POST', table: 'auth:resend', body: req.postDataJSON() }); return route.fulfill({ status: 200, json: {} }); }
    if (url.pathname.includes('/auth/v1/recover')) { posted.push({ method: 'POST', table: 'auth:recover', body: req.postDataJSON() }); return route.fulfill({ status: 200, json: {} }); }
    if (url.pathname.includes('/auth/v1/logout')) { posted.push({ method: 'POST', table: 'auth:logout', body: null }); return route.fulfill({ status: 204, body: '' }); }
    if (url.pathname.includes('/functions/v1/parse-order')) { posted.push({ method: 'POST', table: 'fn:parse-order', body: req.postDataJSON() }); return route.fulfill({ status: 200, json: { intent: 'order', pelanggan: 'Bu Rina', hp: '081234567890', tanggal: '', items: [{ nama: 'bp', qty: 2 }, { nama: 'green', qty: 1 }, { nama: 'kopi', qty: 1 }], catatan: 'kirim sore' } }); }
    const table = url.pathname.split('/rest/v1/')[1];
    if (!table) return route.fulfill({ status: 200, json: {} });
    if (req.method() !== 'GET') {
      const body = req.postDataJSON?.() ?? null; posted.push({ method: req.method(), table, body });
      const row = Array.isArray(body) ? body[0] : body;
      const created = { id: 'new-' + table, ...(row || {}), created_at: (row && row.created_at) || new Date().toISOString() };
      if (table.startsWith('profiles') && req.method() === 'PATCH' && row) Object.assign(data.profiles[0], row);
      if (table === 'orders' && req.method() === 'POST') { data.orders.unshift({ ...created, id: 'o-new', updated_at: created.created_at }); created.id = 'o-new'; }
      const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
      return route.fulfill({ status: 201, json: single ? created : [created] });
    }
    if (mode === 'error' && table.startsWith('orders')) return route.abort('internetdisconnected');
    if (mode === 'loading' && table.startsWith('orders')) { await new Promise(r => setTimeout(r, 8000)); }
    if (mode === 'slow' && !table.startsWith('profiles')) await new Promise(r => setTimeout(r, 2500));
    if (mode === 'slowroot' && table.startsWith('profiles')) await new Promise(r => setTimeout(r, 2500));
    let rows = data[table] ?? [];
    for (const [k, v] of url.searchParams) { if (v.startsWith('eq.')) rows = rows.filter(r => r[k] === undefined || String(r[k]) === v.slice(3)); }
    const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    return route.fulfill({ status: 200, json: single ? (rows[0] ?? null) : rows, headers: { 'content-range': `0-${rows.length}/*` } });
  });
  const shot = async name => { await page.waitForTimeout(700); await page.screenshot({ path: `${out}/${name}.png` }); };
  const go = async path => { await page.goto('http://127.0.0.1:4300' + path); await page.waitForTimeout(2200); };
  await page.goto('http://127.0.0.1:4300/'); await page.waitForTimeout(1500);
  if (!['loggedout', 'daftar'].includes(mode)) await page.evaluate(uid => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem('sb-kqoitztjohxjnjoxctoz-auth-token', JSON.stringify({ access_token: 'x.eyJzdWIiOiIxIn0.x', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: exp, user: { id: uid, email: 'mitra@contoh.id', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '' } }));
  }, uid);

  data.master_products.push(cat('BP', '10_botol', 10, 2100000), cat('BLUE', '5_botol', 5, 1225000), cat('BLUE', '10_botol', 10, 2250000), cat('KID', '5_botol', 5, 1225000), cat('BELGIE', '3_botol', 3, 585000), cat('BELGIE', '5_botol', 5, 975000), cat('BELGIE_FW', 'satuan', 1, 195000));
  // ---- assertion helpers ----
  const results = [];
  const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });
  const txt = async () => (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const path = () => new URL(page.url()).pathname;
  const sent = (table, method) => posted.filter(p => p.table.startsWith(table) && (!method || p.method === method));
  const step = async (name, fn) => {
    try { await fn(); } catch (e) { check(name, false, 'exception: ' + e.message.split(String.fromCharCode(10))[0]); await page.screenshot({ path: `${out}/fail-${name}.png` }); }
  };
  const btn = name => page.getByRole('button', { name });
  const tap = async (name, wait = 500) => { await btn(name).last().click(); await page.waitForTimeout(wait); };

  if (mode === 'full') {
    await step('beranda', async () => {
      await go('/'); const t = await txt();
      check('Beranda: kartu omset tampil', /Omset \w+ Rp[\d.]+/.test(t));
      check('Beranda: perlu dikerjakan tampil', t.includes('Perlu dikerjakan'));
      check('Beranda: target bulanan nominal', /Rp105rb \/ Rp500rb/.test(t));
      await shot('01-beranda');
    });
    await step('tab-nav', async () => {
      for (const [tab, p] of [['Riwayat', '/riwayat'], ['Stok', '/stok'], ['Akun', '/akun'], ['Beranda', '/']]) {
        await page.getByRole('tab', { name: tab }).click(); await page.waitForTimeout(900);
        check(`Tab bar: ${tab} membuka ${p}`, path() === p, path());
      }
    });
    await step('riwayat', async () => {
      await go('/riwayat');
      await page.getByLabel('Cari order berdasarkan pelanggan').fill('rina'); await page.waitForTimeout(400);
      check('Riwayat: cari "rina" hanya Bu Rina', (await page.getByText('Pak Budi').count()) === 0 && (await page.getByText('Bu Rina').count()) > 0);
      await page.getByLabel('Hapus pencarian').click(); await page.waitForTimeout(300);
      await page.getByRole('radio', { name: /Belum selesai/ }).click(); await page.waitForTimeout(300);
      check('Riwayat: filter belum selesai', /1 order ditemukan/.test(await txt()));
      await page.getByRole('radio', { name: 'Semua' }).click();
      await tap(/Ketuk untuk memilih bulan/); await tap('Tahun sebelumnya', 200); await tap('Okt 2025');
      check('Riwayat: pilih Oktober 2025 dari pemilih bulan', /Oktober 2025/.test(await txt()) && /Belum ada order di Oktober/.test(await txt()));
      await shot('02-riwayat-okt');
    });
    await step('order-validasi', async () => {
      await go('/order/new');
      await tap(/^Simpan order/, 500);
      const t = await txt();
      check('Order: kosong menampilkan kesalahan per bagian', t.includes('Isi dulu Pelanggan dan Produk') && t.includes('Pilih atau ketik nama pelanggan.') && t.includes('Tambahkan minimal satu produk.'));
      check('Order: belum ada yang tersimpan saat validasi gagal', sent('orders', 'POST').length === 0);
      await shot('02b-order-validasi');
    });
    await step('order-pelanggan', async () => {
      await go('/order/new');
      await tap(/^Pelanggan:/, 600);
      let t = await txt();
      check('Pelanggan: daftar terakhir tampil sebelum mengetik', t.includes('Pelanggan terakhir') && t.includes('Bu Rina'));
      check('Pelanggan: yang hanya ada di riwayat order ikut muncul', t.includes('Pak Budi') && t.includes('Mbak Sari') && t.includes('dari riwayat'));
      await shot('02c-pelanggan-daftar');
      await page.getByLabel('Nama pelanggan', { exact: true }).fill('sar'); await page.waitForTimeout(300);
      t = await txt();
      check('Pelanggan: mengetik menyaring daftar', t.includes('Cocok dengan “sar”') && t.includes('Mbak Sari') && !t.includes('Pak Budi'));
      await page.getByLabel('Nama pelanggan', { exact: true }).fill('zzz'); await page.waitForTimeout(300);
      check('Pelanggan: tidak ada yang cocok menawarkan pelanggan baru', (await txt()).includes('Tambah “zzz” sebagai pelanggan baru'));
      await tap('Hapus nama pelanggan', 300);
      check('Pelanggan: tombol X di kolom mengosongkan nama', (await page.getByLabel('Nama pelanggan', { exact: true }).inputValue()) === '');
      await page.getByLabel('Nama pelanggan', { exact: true }).fill('sar'); await page.waitForTimeout(200);
      await tap('Pilih Mbak Sari', 500);
      check('Pelanggan: memilih dari daftar mengisi form order', (await txt()).includes('Mbak Sari · '));
    });
    await step('order-buat', async () => {
      const before = sent('orders', 'POST').length;
      await go('/order/new');
      const add = n => btn('Tambah ' + n).first().click();
      await add('British Propolis'); await page.waitForTimeout(150); await add('British Propolis'); await page.waitForTimeout(150); await add('BP Blue'); await page.waitForTimeout(400);
      let t = await txt();
      check('Order: 3 botol pakai harga Reseller', t.includes('Harga Reseller') && t.includes('Simpan order Rp740.000'));
      check('Order: modal per produk sesuai level Agen (untung Rp45rb)', t.includes('Untung Rp45rb'));
      await add('British Propolis'); await page.waitForTimeout(150); await add('British Propolis'); await page.waitForTimeout(400);
      t = await txt();
      check('Order: 5 botol otomatis harga Agen', t.includes('Harga Agen') && t.includes('Simpan order Rp1.145.000'));
      await tap(/^Pelanggan:/); await page.getByLabel('Nama pelanggan', { exact: true }).fill('Bu Dewi');
      await page.getByRole('radio', { name: 'Jenjang Agen Plus' }).click(); await tap('Pakai pelanggan ini');
      check('Order: jenjang pelanggan Agen Plus menurunkan harga', (await txt()).includes('Simpan order Rp1.065.000'));
      await tap(/^Simpan order/);
      check('Order: konfirmasi simpan muncul sebelum kirim', (await page.getByText('Simpan order ini?').count()) === 1 && sent('orders', 'POST').length === before);
      await shot('03-order-konfirmasi');
      await tap('Ya, simpan order', 1800);
      const o = sent('orders', 'POST').slice(-1)[0]?.body, items = sent('order_items', 'POST').slice(-1)[0]?.body;
      check('Order: tersimpan ke orders', o && o.total_price === 1065000 && o.quantity === 5 && o.tier === 'agen_plus', JSON.stringify(o).slice(0, 160));
      check('Order: item tersimpan dengan product_id katalog', Array.isArray(items) && items.length === 2 && items.every(i => i.product_id), JSON.stringify(items).slice(0, 160));
      check('Order: pelanggan baru tercatat', sent('customers', 'POST').some(p => p.body?.name === 'Bu Dewi'));
      check('Order: pindah ke detail order', path() === '/order/o-new', path());
    });
    await step('order-batal', async () => {
      await go('/order/new'); await btn('Tambah BP Green').first().click(); await page.waitForTimeout(300);
      await tap('Tutup');
      check('Order: X dengan isian memunculkan konfirmasi batal', (await page.getByText('Batalkan order ini?').count()) === 1);
      await tap('Lanjut mengisi', 300);
      check('Order: Lanjut mengisi menutup konfirmasi', (await page.getByText('Batalkan order ini?').count()) === 0 && path() === '/order/new');
    });
    await step('order-ulang', async () => {
      await go('/order/new'); await tap(/^Pelanggan:/); await page.getByLabel('Nama pelanggan', { exact: true }).fill('rina'); await page.waitForTimeout(300);
      await tap('Pilih Bu Rina', 1200); await tap('Pakai', 400);
      check('Order: ulangi order terakhir pelanggan', /Ringkas · 3 botol/.test(await txt()));
    });
    await step('order-status', async () => {
      await go('/order/o2'); await tap('Tandai terkirim', 900);
      check('Detail order: tandai terkirim mengirim status', sent('orders', 'PATCH').some(p => p.body?.status === 'terkirim'));
    });
    await step('order-hapus', async () => {
      await go('/order/o3'); await btn('Hapus').first().click(); await page.waitForTimeout(400);
      check('Detail order: hapus minta konfirmasi', (await page.getByText('Hapus order ini?').count()) === 1);
      await btn('Hapus').last().click(); await page.waitForTimeout(1500);
      check('Detail order: hapus mengirim DELETE', sent('orders', 'DELETE').length > 0);
    });
    await step('restok', async () => {
      await go('/restok/new');
      check('Restok: tidak menampilkan stok saat ini', !/Stok kamu|Stok saat ini/.test(await txt()));
      await page.getByRole('radio', { name: '20 botol' }).click(); await page.waitForTimeout(200);
      check('Restok: total belanja ikut jumlah', (await txt()).includes('Rp4.500.000')); await shot('09-restok');
      await tap(/^Simpan restok/, 1500);
      const e = sent('stock_entries', 'POST').slice(-1)[0]?.body;
      check('Restok: tersimpan 20 botol', e && (Array.isArray(e) ? e[0] : e).quantity === 20, JSON.stringify(e).slice(0, 120));
      check('Restok: saldo stok diperbarui', sent('user_stock').length > 0);
    });
    await step('stok', async () => {
      await go('/stok'); const t = await txt();
      check('Stok: kartu stok di tangan + status menipis', /Stok di tangan Menipis 3 botol/.test(t));
      await shot('04-stok');
      await btn(/^Masuk 20 botol/).first().click(); await page.waitForTimeout(400);
      check('Stok: ketuk catatan memunculkan pilihan', (await page.getByText('Restok 20 botol').count()) > 0);
      await shot('05-stok-pilihan');
      await tap('Ubah catatan', 1200);
      check('Stok: Ubah catatan membuka form restok', path() === '/restok/s1', path());
      await go('/stok'); await btn(/^Masuk 20 botol/).first().click(); await page.waitForTimeout(300);
      await btn('Hapus').last().click(); await page.waitForTimeout(300); await btn('Hapus').last().click(); await page.waitForTimeout(1200);
      check('Stok: hapus catatan mengirim DELETE', sent('stock_entries', 'DELETE').length > 0);
    });
    await step('asisten', async () => {
      await go('/asisten'); await page.getByLabel('Isi chat').fill('Bu Rina pesan bp 2 green 1'); await tap(/^Baca chat/, 2000);
      check('Asisten: chat dikirim ke AI', sent('fn:parse-order').length > 0);
      check('Asisten: draf order terbuka', path() === '/order/new' && (await txt()).includes('Bu Rina'), path());
    });
    await step('keuangan', async () => {
      await go('/keuangan/form?kind=expense');
      await page.getByLabel('Nominal').fill('15000'); await page.getByLabel('Keterangan').fill('Lakban');
      await tap(/^Simpan/, 1200);
      check('Keuangan: pengeluaran tersimpan', sent('general_expenses', 'POST').some(p => (Array.isArray(p.body) ? p.body[0] : p.body)?.amount === 15000));
    });
    await step('target', async () => {
      await go('/target'); await page.getByLabel('Untung kotor', { exact: true }).fill('750000'); await tap(/^Simpan/, 1200);
      check('Target: tersimpan', sent('monthly_targets').length > 0 && (await txt()).includes('tersimpan'));
    });
    await step('pelanggan', async () => {
      await go('/pelanggan'); await btn(/^Bu Rina/).first().click(); await page.waitForTimeout(1000);
      check('Pelanggan: detail terbuka', path() === '/pelanggan/c1' && (await txt()).includes('Total belanja'));
      await tap('Tambah order untuk pelanggan ini', 1200);
      check('Pelanggan: tambah order terisi nama', path() === '/order/new' && (await txt()).includes('Bu Rina'));
    });
    await step('toko', async () => {
      await go('/toko'); await tap('Simpan pengaturan toko', 1000);
      check('Toko: pengaturan tersimpan', sent('store_settings').length > 0 && (await txt()).includes('Pengaturan toko tersimpan'));
    });
    await step('akun', async () => {
      await go('/akun'); await tap('Ganti', 300); await page.getByRole('radio', { name: /^Agen Plus,/ }).click(); await tap('Simpan level', 1000);
      check('Akun: ganti level tersimpan', sent('profiles', 'PATCH').some(p => p.body?.mitra_level === 'agen_plus'));
      await tap(/^Keluar/, 400);
      check('Akun: keluar minta konfirmasi', (await page.getByText('Keluar dari akun?').count()) === 1);
      await btn('Keluar').last().click(); await page.waitForTimeout(1500);
      check('Akun: keluar kembali ke halaman sambutan', /Saya sudah punya akun/.test(await txt()) && sent('auth:logout').length > 0);
    });
  }

  if (mode === 'store') {
    const tag = process.env.STORE_TAG || 'store';
    const snap = name => shot(`${tag}-${name}`);
    await step('store', async () => {
      await go('/'); await snap('1-beranda');
      await go('/riwayat'); await snap('2-riwayat');
      await go('/order/new');
      const add = n => btn('Tambah ' + n).first().click();
      await add('British Propolis'); await page.waitForTimeout(150); await add('British Propolis'); await page.waitForTimeout(150); await add('BP Blue'); await page.waitForTimeout(150); await add('Belgie'); await page.waitForTimeout(300);
      await tap(/^Pelanggan:/); await page.getByLabel('Nama pelanggan', { exact: true }).fill('Bu Rina'); await tap('Pakai pelanggan ini', 500);
      await snap('3-catat-order');
      await go('/stok'); await snap('4-stok');
      await go('/keuangan'); await snap('5-keuangan');
      await go('/pelanggan'); await snap('6-pelanggan');
      await go('/target'); await snap('7-target');
      await go('/akun'); await snap('8-akun');
    });
  }
  if (mode === 'hapus') {
    await step('hapus-akun', async () => {
      await go('/hapus-akun');
      check('Hapus akun: tombol nonaktif sebelum konfirmasi', await btn(/^Hapus akun permanen/).isDisabled());
      await page.getByLabel('Kata sandi').fill('rahasia'); await page.getByLabel('Konfirmasi').fill('HAPUS AKUN');
      await tap(/^Hapus akun permanen/, 2500);
      check('Hapus akun: memanggil fungsi delete-account', sent('fn:delete-account').length > 0);
    });
  }
  if (mode === 'loggedout') {
    await step('sambutan', async () => {
      await go('/');
      check('Sambutan: layar pertama saat belum masuk', (await txt()).includes('Catat order dalam hitungan detik') && (await page.getByRole('img', { name: /British Propolis/ }).count()) > 0);
      await tap('Lanjut', 600); check('Sambutan: Lanjut ke slide 2', (await txt()).includes('Harga ikut jumlah botol'));
      await tap('Lanjut', 600); check('Sambutan: slide 3 punya tombol Buat akun', (await txt()).includes('Stok dan keuangan ikut rapi') && (await btn('Buat akun').count()) > 0);
      await shot('l1-sambutan');
      await tap('Saya sudah punya akun', 1200);
      check('Sambutan: "Saya sudah punya akun" membuka halaman masuk', path() === '/login', path());
    });
    await step('login', async () => {
      check('Login: halaman masuk tampil', (await txt()).includes('Lupa kata sandi'));
      await tap(/^Masuk$/, 500);
      check('Login: kolom kosong memunculkan pesan di halaman', (await txt()).includes('Isi email dan kata sandi dulu.') && sent('auth:token').length === 0);
      await page.getByLabel('Email').fill('mitra@contoh.id'); await page.getByLabel('Kata sandi', { exact: true }).fill('rahasia');
      check('Login: pesan error hilang saat mengetik', !(await txt()).includes('Isi email dan kata sandi dulu.'));
      await tap(/^Masuk$/, 3000);
      check('Login: masuk dan sampai di Beranda', sent('auth:token').length > 0 && /Omset \w+/.test(await txt()));
    });
  }
  if (mode === 'daftar') {
    await step('daftar', async () => {
      await go('/register');
      const cta = () => page.getByRole('button', { name: /Lengkapi tiga isian|Daftar dan kirim/ }).last();
      check('Daftar: tombol nonaktif sebelum tiga isian lengkap', await cta().isDisabled());
      await page.getByLabel('Nama', { exact: true }).last().fill('Dewi'); await page.getByLabel('Email').last().fill('dewi@contoh.id');
      await page.getByLabel('Kata sandi', { exact: true }).last().fill('abc'); await page.waitForTimeout(200);
      check('Daftar: indikator sandi terlalu pendek', (await txt()).includes('Terlalu pendek'));
      await page.getByLabel('Kata sandi', { exact: true }).last().fill('rahasia2026'); await page.waitForTimeout(200);
      check('Daftar: indikator sandi kuat dan tombol aktif', (await txt()).includes('Kuat') && !(await cta().isDisabled()));
      await shot('d1-daftar');
      await cta().click(); await page.waitForTimeout(1500);
      check('Daftar: akun dibuat lalu ke Verifikasi email', sent('auth:signup').length === 1 && path() === '/verify' && (await txt()).includes('dewi@contoh.id'), path());
      await shot('d2-verifikasi');
      await tap('Kirim ulang link', 1200);
      check('Verifikasi: kirim ulang memanggil server dan mulai hitung mundur', sent('auth:resend').length === 1 && /Kirim ulang dalam 0:4\d/.test(await txt()));
    });
    await step('lupa', async () => {
      await go('/forgot'); await page.getByLabel('Email').last().fill('mitra@contoh.id'); await tap(/^Kirim link reset/, 1200);
      check('Lupa sandi: link terkirim', sent('auth:recover').length === 1 && (await txt()).includes('Link terkirim'));
      await shot('d3-lupa');
    });
  }
  if (mode === 'slow') {
    // Each page, opened cold with slow data: a skeleton must show first, then the real content replaces it.
    const pages = [
      ['Beranda', '/', 'Omset', 'beranda'], ['Riwayat', '/riwayat', 'Riwayat order', 'riwayat'], ['Stok', '/stok', 'Stok di tangan', 'stok'],
      ['Pelanggan', '/pelanggan', 'pelanggan', 'pelanggan'], ['Detail pelanggan', '/pelanggan/c1', 'Total belanja', 'pelanggan-detail'], ['Keuangan', '/keuangan', 'Total pengeluaran', 'keuangan'],
      ['Form keuangan', '/keuangan/form?kind=expense&id=g1', 'Ubah pengeluaran', 'keuangan-form'], ['Target', '/target', 'Capaian', 'target'], ['Toko', '/toko', 'Info toko', 'toko'],
      ['Detail order', '/order/o1', 'Order dicatat', 'order-detail'], ['Ubah order', '/order/o1/edit', 'Ringkasan', 'order-edit'], ['Order baru', '/order/new', 'Pilih produk', 'order-baru'], ['Ubah restok', '/restok/s1', 'Harga beli', 'restok-edit'],
    ];
    for (const [name, p, content, shotName] of pages) await step('skeleton-' + shotName, async () => {
      await page.goto('http://127.0.0.1:4300' + p);
      // The bundle takes a moment to start and the opening screen has its own skeleton; wait for the page's skeleton.
      await page.waitForFunction(() => {
        const bars = [...document.querySelectorAll('[role=progressbar]')];
        return bars.length > 0 && !bars.some(b => b.getAttribute('aria-label') === 'Memuat beranda');
      }, null, { timeout: 8000 }).catch(() => undefined);
      await page.waitForTimeout(150);
      const during = await page.getByRole('progressbar').count();
      const early = await txt();
      await shot('s-' + shotName);
      await page.waitForTimeout(p === '/target' ? 6200 : 3600);
      await shot('f-' + shotName);
      const late = await txt();
      check(`Skeleton: ${name} menampilkan skeleton saat memuat`, during > 0, `progressbar=${during}`);
      check(`Skeleton: ${name} tidak menampilkan spinner/teks "Memuat data…"`, !/Memuat data…/.test(early));
      check(`Skeleton: ${name} diganti isi asli`, (await page.getByRole('progressbar').count()) === 0 && late.includes(content), `progressbar=${await page.getByRole('progressbar').count()}`);
    });
  }
  if (mode === 'slow') await step('skeleton-akun', async () => {
    await page.goto('http://127.0.0.1:4300/akun'); await page.waitForTimeout(1100);
    check('Skeleton: Akun terbuka langsung (profil sudah dimuat layar pembuka)', (await page.getByRole('progressbar').count()) === 0 && (await txt()).includes('Level mitra'));
  });
  if (mode === 'slowroot') await step('skeleton-root', async () => {
    await page.goto('http://127.0.0.1:4300/');
    await page.getByRole('progressbar').first().waitFor({ timeout: 8000 }).catch(() => undefined); await page.waitForTimeout(150);
    check('Skeleton: layar pembuka (profil dimuat) memakai bentuk Beranda', (await page.getByLabel('Memuat beranda').count()) > 0);
    await shot('s-root'); await page.waitForTimeout(3800);
    check('Skeleton: layar pembuka diganti Beranda', (await page.getByRole('progressbar').count()) === 0 && /Omset/.test(await txt()));
  });
  if (mode === 'empty') await step('kosong', async () => { await go('/'); check('Akun baru: Beranda kosong mengajak catat order', (await txt()).includes('Catat order pertamamu')); await shot('06-kosong'); });
  if (mode === 'error') await step('gagal', async () => { await go('/'); check('Offline: panel gagal memuat + coba lagi', (await txt()).includes('Data belum bisa dimuat') && (await btn(/Coba lagi/).count()) > 0); });
  if (mode === 'onboarding') await step('onboarding', async () => {
    await go('/');
    check('Onboarding: profil belum lengkap diarahkan ke Lengkapi profil', (await txt()).includes('Kenalan dulu, yuk'));
    await shot('o1-profil');
    await tap(/^Lanjut$/, 500);
    check('Onboarding: langkah 2 Level mitra', (await txt()).includes('Kamu mitra level apa?'));
    await page.getByRole('radio', { name: /^Level kustom/ }).click(); await page.waitForTimeout(300);
    check('Onboarding: level kustom perlu nama dan modal', await page.getByRole('button', { name: 'Isi nama level dan modal' }).isDisabled());
    await page.getByLabel('Nama level', { exact: true }).fill('Distributor'); await page.getByLabel('Modal/botol', { exact: true }).fill('200000'); await page.waitForTimeout(300);
    check('Onboarding: contoh untung ikut modal kustom', (await txt()).includes('untung Rp65.000'));
    await shot('o2-level');
    await tap(/^Lanjut$/, 500);
    await page.getByRole('radio', { name: '10 botol' }).click(); await page.waitForTimeout(200);
    await shot('o3-stok');
    await tap('Simpan dan selesai', 1500);
    const prof = sent('profiles', 'PATCH').slice(-1)[0]?.body;
    check('Onboarding: profil tersimpan dengan level kustom', prof && prof.onboarding_completed === true && prof.mitra_level === 'custom' && prof.custom_buy_price === 200000, JSON.stringify(prof).slice(0, 160));
    check('Onboarding: stok awal 10 botol tercatat', sent('stock_entries', 'POST').some(p => (Array.isArray(p.body) ? p.body[0] : p.body)?.quantity === 10));
    check('Onboarding: layar Selesai tampil', (await txt()).includes('Akunmu siap') && (await txt()).includes('Mulai dari sini'));
    await shot('o4-selesai');
    await tap('Ke Beranda', 2500);
    check('Onboarding: Ke Beranda membuka Beranda', path() === '/' && /Catat order pertamamu|Omset/.test(await txt()), path());
  });

  const consoleErrors = errors.filter(e => !(mode === 'error' && /ERR_INTERNET_DISCONNECTED/.test(e))).filter(e => !/favicon|Unexpected text node|shadow\*|pointerEvents|useNativeDriver|props.pointerEvents|deprecated/i.test(e));
  check(`Tidak ada error JavaScript (${mode})`, consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok || !r.detail ? '' : '  -> ' + r.detail}`);
  await b.close(); server.close();
  process.exitCode = results.every(r => r.ok) ? 0 : 1;
})();
