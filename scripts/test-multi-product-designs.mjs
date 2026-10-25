import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { verifyPreviewOutput } from './lib/verify-preview-output.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
verifyPreviewOutput(dist);
const output = process.env.DESIGN_ARTIFACTS || '/workspace/artifacts/mula-design-options';
mkdirSync(output, { recursive: true });
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(dist, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!file.startsWith(`${dist}${path.sep}`) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' }[path.extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': mime }); res.end(readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const executable = process.env.PROTOTYPE_CHROMIUM || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const browser = await chromium.launch({ executablePath: executable, args: ['--no-sandbox'] });
const errors = [], external = [], screenshots = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`); });
  page.on('request', request => { if (!request.url().startsWith(base) && !/^(data:|blob:)/.test(request.url())) external.push(request.url()); });
  const device = page.locator('.p-device');
  const navigate = async route => {
    await page.evaluate(value => { location.hash = value; }, route);
    await page.waitForURL(url => url.hash === `#${route}`);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  const exportData = async () => {
    await navigate('/privacy');
    const pending = page.waitForEvent('download');
    await device.getByRole('button', { name: 'Ekspor data contoh (.json)', exact: true }).click();
    const stream = await (await pending).createReadStream();
    const chunks = []; for await (const chunk of stream) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  };
  const readStock = async sku => {
    await navigate(`/stock/${sku}`);
    const value = async label => Number(await device.locator('.p-stat').filter({ hasText: label }).locator('strong').innerText());
    return { physical: await value('Fisik'), incoming: await value('Dalam perjalanan'), reserved: await value('Alokasi order') };
  };
  const capture = async (theme, screen, route) => {
    const dismiss = device.getByRole('button', { name: 'Tutup pemberitahuan', exact: true });
    if (await dismiss.count()) await dismiss.click();
    assert.equal(await page.locator('.p-scroll').evaluate(el => el.scrollWidth > el.clientWidth + 1), false, `Overflow: ${theme}/${screen}`);
    const file = `${theme}-${screen}.png`;
    await device.locator('img').evaluateAll(async images => { await Promise.all(images.filter(img => { const box = img.getBoundingClientRect(); return box.top < innerHeight && box.bottom > 0; }).map(async img => { img.loading = 'eager'; await img.decode(); })); });
    await device.screenshot({ path: path.join(output, file) });
    screenshots.push({ theme, screen, route, file });
  };
  await page.goto(`${base}/#/home`); await device.waitFor();
  const initial = await exportData();
  const stockBefore = {};
  for (const sku of ['BP', 'BLUE', 'FW']) stockBefore[sku] = await readStock(sku);

  // Select several restock products in one picker, but save exactly one activity.
  await navigate('/purchase/new');
  await device.getByRole('button', { name: 'Hapus produk restok 1', exact: true }).click();
  assert.equal(await device.getByRole('button', { name: 'Simpan satu rencana restok', exact: true }).isDisabled(), true);
  await device.getByRole('button', { name: 'Tambah beberapa produk', exact: true }).click();
  for (const name of ['BP Reguler BP normal', 'BP Blue BP premium', 'Belgie Facial Wash Belgie']) await device.getByRole('checkbox', { name, exact: true }).check();
  await device.getByRole('button', { name: 'Tambahkan 3 produk', exact: true }).click();
  const quantities = { BP: 2, BLUE: 1, FW: 4 };
  for (let i = 1; i <= 3; i++) {
    const sku = await device.getByLabel(`Produk restok ${i}`, { exact: true }).inputValue();
    await device.getByLabel(`Botol produk ${i}`, { exact: true }).fill(String(quantities[sku]));
  }
  await device.getByText('7 botol', { exact: true }).waitFor();
  await device.getByText('5 ekuivalen', { exact: true }).waitFor();
  await device.getByLabel('Modal/botol 1 (Rp)', { exact: true }).fill('0');
  assert.equal(await device.getByRole('button', { name: 'Simpan satu rencana restok', exact: true }).isDisabled(), true);
  await device.getByLabel('Modal/botol 1 (Rp)', { exact: true }).fill('225000');
  await device.getByRole('button', { name: 'Simpan satu rencana restok', exact: true }).click();
  const purchaseId = new URL(page.url()).hash.split('/').at(-1);
  assert.ok(purchaseId.startsWith('PO-'));
  const planned = await exportData();
  assert.equal(planned.purchases.length, initial.purchases.length + 1);
  assert.equal(planned.purchases[0].lines.length, 3);
  assert.equal(planned.purchases[0].id, purchaseId);
  assert.equal(planned.purchases[0].status, 'planned');
  assert.equal(planned.purchases[0].lines.reduce((s, l) => s + l.quantity * l.unitCost, 0), 1475000);
  for (const sku of Object.keys(quantities)) assert.deepEqual(await readStock(sku), stockBefore[sku], `Plan changed stock: ${sku}`);
  await navigate(`/purchases/${purchaseId}`);
  await device.getByRole('button', { name: 'Konfirmasi pembelian ke pemasok', exact: true }).click();
  assert.equal(await device.getByRole('button', { name: 'Konfirmasi semua barang diterima', exact: true }).isDisabled(), true);
  for (const sku of Object.keys(quantities)) {
    const actual = await readStock(sku);
    assert.equal(actual.physical, stockBefore[sku].physical);
    assert.equal(actual.incoming, stockBefore[sku].incoming + quantities[sku]);
  }
  await navigate(`/purchases/${purchaseId}`);
  await device.getByRole('checkbox').check();
  await device.getByRole('button', { name: 'Konfirmasi semua barang diterima', exact: true }).click();
  await device.getByText('Diterima', { exact: true }).waitFor();
  assert.equal(await device.getByRole('button', { name: 'Konfirmasi semua barang diterima', exact: true }).count(), 0);
  for (const sku of Object.keys(quantities)) {
    const actual = await readStock(sku);
    assert.equal(actual.physical, stockBefore[sku].physical + quantities[sku]);
    assert.equal(actual.incoming, stockBefore[sku].incoming);
  }
  assert.deepEqual((await exportData()).orders, initial.orders, 'Restock changed revenue orders');
  console.log('One restock activity: 3 SKUs, 7 bottles, 5 equivalents, Rp1,475,000; planned/incoming/received stock verified.');

  // Cancel one complete incoming activity and check every SKU, including no second receipt.
  await navigate('/purchase/new?example=multi');
  await device.getByRole('button', { name: 'Periksa restok', exact: true }).click();
  await device.getByRole('checkbox').check();
  await device.getByRole('button', { name: 'Catat 3 produk dalam satu pembelian', exact: true }).click();
  const cancelledId = new URL(page.url()).hash.split('/').at(-1);
  await device.getByRole('button', { name: 'Batalkan pembelian', exact: true }).click();
  await device.getByRole('button', { name: 'Ya, batalkan pembelian contoh', exact: true }).click();
  await device.getByText('Dibatalkan', { exact: true }).waitFor();
  for (const sku of Object.keys(quantities)) {
    const actual = await readStock(sku);
    assert.equal(actual.physical, stockBefore[sku].physical + quantities[sku]);
    assert.equal(actual.incoming, stockBefore[sku].incoming);
  }
  assert.equal((await exportData()).purchases.find(p => p.id === cancelledId).status, 'cancelled');

  // Add a mixed order in one picker; a single expense applies once to the whole order.
  await navigate('/compose');
  await device.getByLabel('Nama pembeli', { exact: true }).fill('Pembeli multiproduk uji');
  await device.getByRole('button', { name: 'Lanjut pilih item', exact: true }).click();
  await device.getByRole('button', { name: 'Hapus produk 1', exact: true }).click();
  await device.getByRole('button', { name: 'Tambah beberapa produk', exact: true }).click();
  for (const name of ['BP Reguler BP normal', 'BP Blue BP premium', 'Belgie Facial Wash Belgie']) await device.getByRole('checkbox', { name, exact: true }).check();
  await device.getByRole('button', { name: 'Tambahkan 3 produk', exact: true }).click();
  for (let i = 1; i <= 3; i++) {
    const sku = await device.getByLabel(`Produk ${i}`, { exact: true }).inputValue();
    await device.getByLabel(`Jumlah botol ${i}`, { exact: true }).fill(String(quantities[sku]));
    assert.equal(await device.getByLabel(`Produk ${i}`, { exact: true }).locator('option:disabled').count(), 2);
  }
  await device.getByRole('button', { name: 'Tambah biaya', exact: true }).click();
  await device.getByLabel('Nominal biaya 1 (Rp)', { exact: true }).fill('20000');
  await device.getByRole('button', { name: 'Lihat ringkasan pesanan', exact: true }).click();
  await device.getByRole('checkbox').check();
  await device.getByRole('button', { name: 'Konfirmasi pesanan contoh', exact: true }).click();
  const orderId = new URL(page.url()).hash.split('/').at(-1);
  const afterOrder = await exportData();
  assert.equal(afterOrder.orders.length, initial.orders.length + 1);
  const order = afterOrder.orders.find(o => o.id === orderId);
  assert.equal(order.lines.length, 3); assert.equal(order.quote.revenue, 1595000);
  assert.equal(order.quote.cost, 1475000); assert.equal(order.quote.sellerExpenses, 20000); assert.equal(order.quote.profit, 100000);
  for (const sku of Object.keys(quantities)) {
    const actual = await readStock(sku);
    assert.equal(actual.physical, stockBefore[sku].physical + quantities[sku]);
    assert.equal(actual.reserved, stockBefore[sku].reserved + quantities[sku]);
  }
  await navigate(`/orders/${orderId}/receipt`);
  const receipt = await device.locator('.p-receipt').innerText();
  for (const name of ['BP Reguler', 'BP Blue', 'Belgie Facial Wash']) assert.ok(receipt.includes(name));
  assert.equal(/modal|laba/i.test(receipt), false);
  console.log('One order: 3 SKUs, 7 bottles, one Rp20,000 expense; total, profit, stock allocation and customer receipt verified.');

  // The selected reference direction is now the default across the complete prototype.
  await navigate('/screens');
  await device.getByRole('button', { name: 'Muat data contoh', exact: true }).click();
  const seed = await exportData();
  assert.equal(await page.locator('.p-stage').getAttribute('data-design'), 'bold');
  for (const [screen, route] of [
    ['welcome', '/welcome'], ['home', '/home'], ['catalog', '/catalog'], ['product', '/catalog/GREEN'],
    ['account', '/settings'], ['progress', '/orders/ORD-1029'], ['design-system', '/designs'], ['reports', '/reports'],
  ]) { await navigate(route); await capture('bold', screen, route); }

  await navigate('/catalog');
  await device.getByRole('button', { name: 'Tambahkan BP Blue ke favorit', exact: true }).click();
  await device.getByRole('button', { name: 'Favorit', exact: true }).click();
  assert.equal(await device.locator('.p-product-card').count(), 3);
  await capture('bold', 'favorites', '/catalog');
  await device.getByRole('button', { name: 'Hapus BP Blue dari favorit', exact: true }).click();
  assert.equal(await device.locator('.p-product-card').count(), 2);

  await navigate('/catalog/GREEN');
  await device.getByRole('button', { name: 'Tambah jumlah produk pilihan', exact: true }).click();
  assert.equal(await device.getByLabel('Jumlah produk pilihan', { exact: true }).inputValue(), '2');
  await device.getByLabel('Jumlah produk pilihan', { exact: true }).fill('0');
  assert.equal(await device.getByRole('button', { name: 'Tambahkan ke pesanan', exact: true }).isDisabled(), true);
  await device.getByLabel('Jumlah produk pilihan', { exact: true }).fill('2');
  await device.getByRole('button', { name: 'Tambahkan ke pesanan', exact: true }).click();
  await device.getByLabel('Nama pembeli', { exact: true }).fill('Uji dari katalog');
  await device.getByRole('button', { name: 'Lanjut pilih item', exact: true }).click();
  assert.equal(await device.getByLabel('Jumlah botol 1', { exact: true }).inputValue(), '2');

  await navigate('/compose?example=multi');
  await device.getByRole('button', { name: 'Lanjut pilih item', exact: true }).click();
  await capture('bold', 'order-cart', '/compose?example=multi');
  await device.getByRole('button', { name: 'Lihat ringkasan pesanan', exact: true }).click();
  await capture('bold', 'order-review', '/compose?example=multi');
  assert.equal(await device.getByRole('button', { name: 'Konfirmasi pesanan contoh', exact: true }).isDisabled(), true);

  await navigate('/purchase/new?example=multi');
  await device.getByRole('heading', { name: 'Daftar produk', exact: true }).evaluate(el => { const scroll = el.closest('.p-scroll'); const header = scroll.querySelector('.p-header'); scroll.scrollTop += el.getBoundingClientRect().top - scroll.getBoundingClientRect().top - header.getBoundingClientRect().height - 18; });
  await capture('bold', 'restock-cart', '/purchase/new?example=multi');
  await device.getByRole('button', { name: 'Periksa restok', exact: true }).click();
  assert.equal(await page.evaluate(() => window.scrollY), 0, 'Restock review must scroll inside the phone, not move its frame');
  assert.ok((await device.locator('.p-statusbar').boundingBox()).y >= 0, 'Restock status bar must stay visible');
  assert.equal(await device.getByRole('button', { name: 'Catat 3 produk dalam satu pembelian', exact: true }).isDisabled(), true);
  await device.getByRole('checkbox').check();
  assert.equal(await device.getByRole('button', { name: 'Catat 3 produk dalam satu pembelian', exact: true }).isEnabled(), true);
  await capture('bold', 'restock-review', '/purchase/new?example=multi');

  await navigate('/storefront');
  for (const name of ['BP Reguler', 'BP Green', 'Belgie Facial Wash']) await device.getByRole('button', { name: `Tambah ${name} ke keranjang`, exact: true }).click();
  await device.getByRole('button', { name: 'Periksa keranjang', exact: true }).click();
  assert.equal(await device.locator('.p-cart-item').count(), 3);
  assert.equal(await page.locator('.p-scroll').evaluate(el => el.scrollTop), 0, 'Opening checkout should start at the cart heading');
  await capture('bold', 'store-cart', '/storefront');
  assert.equal(await device.getByRole('button', { name: 'Kirim permintaan contoh', exact: true }).isEnabled(), true);

  const current = await exportData();
  assert.deepEqual({ ...current, exportedAt: undefined }, { ...seed, exportedAt: undefined }, 'Browsing, favorites and unsaved carts must not alter business data');
  await navigate('/home');
  await device.getByLabel('Cari pesanan pelanggan', { exact: true }).fill('Bu Ani');
  await device.getByRole('button', { name: 'Buka hasil pencarian', exact: true }).click();
  assert.equal(await device.getByLabel('Cari pesanan', { exact: true }).inputValue(), 'Bu Ani');
  assert.equal(await device.locator('.p-order-card').count(), 1);

  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['/home', '/catalog', '/catalog/GREEN', '/purchase/new?example=multi', '/settings', '/storefront']) {
      await navigate(route);
      assert.equal(await page.locator('.p-scroll').evaluate(el => el.scrollWidth > el.clientWidth + 1), false, `Overflow ${width}px ${route}`);
      const expectedSection = route.startsWith('/catalog') ? 'Produk' : route === '/settings' ? 'Akun' : 'Beranda';
      if (route !== '/storefront') assert.equal(await device.getByRole('navigation').locator('[aria-current=page]').innerText(), expectedSection, `Navigation context: ${route}`);
      const dock = device.locator('.p-action-dock');
      if (await dock.count()) {
        const bounds = await dock.boundingBox(); const nav = device.locator('.p-nav');
        assert.ok(bounds.y > 100 && bounds.y + bounds.height <= 844, `Dock outside viewport: ${width}px ${route}`);
        if (await nav.count()) assert.ok(bounds.y + bounds.height <= (await nav.boundingBox()).y + 1, `Dock overlaps navigation: ${width}px ${route}`);
        const action = dock.getByRole('button').last();
        const exposed = await action.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); });
        assert.ok(exposed, `Dock action is covered: ${width}px ${route}`);
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 640 }); await navigate('/purchase/new?example=multi');
  const shortDock = await device.locator('.p-action-dock').boundingBox();
  assert.ok(shortDock.y + shortDock.height <= 640, 'Action must remain inside a shorter viewport');
  await page.setViewportSize({ width: 390, height: 844 });
  await navigate('/screens'); await device.getByRole('button', { name: 'Muat data contoh', exact: true }).click();
  assert.equal(await page.locator('.p-stage').getAttribute('data-design'), 'bold', 'Reset must preserve selected design');
  await page.goto(`${base}/#/home?design=calm`);
  assert.equal(await page.locator('.p-stage').getAttribute('data-design'), 'bold', 'Legacy comparison links must not replace the selected design');
  assert.deepEqual(errors, [], 'Browser errors'); assert.deepEqual(external, [], 'External requests');
  const result = { capturedAt: new Date().toISOString(), screenshots, restock: { products: 3, bottles: 7, equivalent: 5, total: 1475000, oneActivity: true, receiptOnce: true, cancellation: true }, order: { products: 3, bottles: 7, revenue: 1595000, cost: 1475000, expenses: 20000, profit: 100000, oneActivity: true }, themes: ['bold'], referenceSelected: true, widths: [360, 390, 430], browserErrors: errors, externalRequests: external };
  writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
