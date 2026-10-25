import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { verifyPreviewOutput } from './lib/verify-preview-output.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)); const dist = path.join(root, 'dist');
verifyPreviewOutput(dist);
const output = process.env.FINANCE_ARTIFACTS || '/workspace/artifacts/mula-finance-usability';
mkdirSync(output, { recursive: true });
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(dist, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!file.startsWith(`${dist}${path.sep}`) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': mime }); res.end(readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const executable = process.env.PROTOTYPE_CHROMIUM || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const browser = await chromium.launch({ executablePath: executable, args: ['--no-sandbox'] });
const errors = [], external = [], screenshots = [], positions = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const device = page.locator('.p-device');
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => { if (!request.url().startsWith(base) && !/^(blob:|data:)/.test(request.url())) external.push(request.url()); });
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const navigate = async route => { await page.evaluate(value => { location.hash = value; }, route); await page.waitForURL(url => url.hash === `#${route}`); await settle(); };
  const scrollTo = async selector => device.locator(selector).first().evaluate(element => {
    const scroller = element.closest('.p-scroll'); const header = scroller.querySelector('.p-header');
    scroller.scrollTop += element.getBoundingClientRect().top - scroller.getBoundingClientRect().top - (header?.getBoundingClientRect().height ?? 0) - 15;
  });
  const capture = async (screen, name) => {
    const dismiss = device.getByRole('button', { name: 'Tutup pemberitahuan', exact: true }); if (await dismiss.count()) await dismiss.click();
    await settle();
    await device.locator('img').evaluateAll(async images => { await Promise.all(images.filter(img => { const r = img.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }).map(async img => { img.loading = 'eager'; await img.decode(); })); });
    assert.equal(await page.locator('.p-scroll').evaluate(element => element.scrollWidth > element.clientWidth + 1), false, `Horizontal overflow ${screen}`);
    assert.equal(await page.evaluate(() => window.scrollY), 0, 'Outer phone frame should not scroll');
    const file = `${screen}.png`; await device.screenshot({ path: path.join(output, file) });
    screenshots.push({ screen, name, route: new URL(page.url()).hash.slice(1), file });
  };
  const readCards = async () => {
    const result = {};
    for (const key of ['received', 'outstanding', 'cost', 'profit']) result[key] = Number((await device.locator(`[data-money=${key}] strong`).innerText()).replace(/[^\d-]/g, ''));
    return result;
  };
  await page.goto(`${base}/#/home`); await settle();
  const baseline = await readCards();
  assert.deepEqual(baseline, { received: 835000, outstanding: 1400000, cost: 1995000, profit: 189000 });
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 }); await navigate('/home');
    const task = device.getByRole('link', { name: /1 draf perlu diperiksa/ });
    const box = await task.boundingBox(); const nav = await device.getByRole('navigation').boundingBox();
    assert.ok(box.y >= 0 && box.y + box.height <= nav.y, `Draft task hidden below fold at ${width}`);
    const card = await device.locator('[data-money=profit]').boundingBox();
    assert.ok(card.y + card.height <= nav.y, `Four money meanings should fit before navigation at ${width}`);
    positions.push({ width, taskTop: box.y, taskBottom: box.y + box.height, navTop: nav.y });
  }
  await page.setViewportSize({ width: 390, height: 844 }); await navigate('/home');
  await capture('home', 'Empat arti uang dan tugas penting');
  await device.getByRole('button', { name: 'Catat penjualan', exact: true }).click();
  await device.getByLabel('Nama pembeli', { exact: true }).waitFor();
  assert.ok(new URL(page.url()).hash.endsWith('/compose'), 'Manual sale is one tap from home');
  await device.getByRole('button', { name: 'Simpan draf dulu', exact: true }).click();
  await device.getByText('Pembeli belum diisi', { exact: true }).waitFor();
  await navigate('/home'); assert.deepEqual(await readCards(), baseline, 'An incomplete draft must not become revenue');

  await device.getByRole('link', { name: /Kenapa uang masuk berbeda dengan laba/ }).click();
  assert.ok(await device.locator('.p-finance-lesson').evaluate(element => element.open));
  await scrollTo('.p-finance-lesson');
  await device.getByLabel('Pelajari dari pesanan', { exact: true }).selectOption('ORD-1031');
  assert.ok((await device.locator('.p-finance-lesson-body').innerText()).replace(/\s+/g, ' ').includes('Rp 23.000'));
  await capture('lesson', 'Contoh pesanan: laba dihitung, pembayaran belum masuk');

  await navigate('/capture/paste');
  await device.getByLabel('Isi chat pesanan', { exact: true }).fill('Bu Ani pesan 2 reguler, 1 blue, 4 belgie fw. Ongkir 20rb, infaq 5rb.');
  await device.getByRole('checkbox').check(); await device.getByRole('button', { name: 'Baca teks contoh', exact: true }).click();
  await device.getByRole('button', { name: 'Lanjut pilih item', exact: true }).click();
  assert.equal(await device.getByLabel('Nominal biaya 1 (Rp)', { exact: true }).inputValue(), '20000');
  assert.equal(await device.getByLabel('Nominal biaya 2 (Rp)', { exact: true }).inputValue(), '5000');
  assert.ok((await device.locator('.p-live-finance').innerText()).replace(/\s+/g, ' ').includes('Rp 95.000'));
  await scrollTo('.p-live-finance'); await capture('live-profit', 'Harga, modal dan biaya sebelum konfirmasi');
  await device.getByRole('button', { name: 'Lihat ringkasan pesanan', exact: true }).click();
  await device.getByRole('checkbox').check(); await device.getByRole('button', { name: 'Konfirmasi pesanan contoh', exact: true }).click();
  const orderId = new URL(page.url()).hash.split('/').at(-1);
  await navigate('/home'); const afterSale = await readCards();
  assert.deepEqual(afterSale, { received: 835000, outstanding: 2995000, cost: 3470000, profit: 284000 });
  await navigate(`/orders/${orderId}/payment`);
  await device.getByLabel('Uang diterima (Rp)', { exact: true }).fill('100000');
  assert.ok((await device.locator('.p-payment-preview').innerText()).replace(/\s+/g, ' ').includes('Rp 1.495.000'));
  await scrollTo('.p-payment-preview'); await capture('payment', 'Pembayaran tambahan dan sisa setelah dicatat');
  await device.getByRole('checkbox').check(); await device.getByRole('button', { name: 'Konfirmasi penerimaan contoh', exact: true }).click();
  await navigate('/home'); const afterPayment = await readCards();
  assert.deepEqual(afterPayment, { ...afterSale, received: 935000, outstanding: 2895000 });
  await navigate('/reports?view=payments&scope=all'); await capture('bills', 'Sisa tagihan yang bisa langsung dicatat pembayarannya');
  await navigate('/reports?view=profit'); await capture('profit', 'Rumus laba dengan modal dan biaya dipisahkan');
  await scrollTo('.p-purchase-explainer'); await capture('restock-cost', 'Belanja stok bukan modal terjual yang dihitung ulang');

  await navigate('/capture/paste');
  await device.getByLabel('Isi chat pesanan', { exact: true }).fill('Bu Rani pesan 1 reguler. Ongkir belum tahu.');
  await device.getByRole('button', { name: 'Baca teks contoh', exact: true }).click();
  await device.getByRole('button', { name: 'Lanjut pilih item', exact: true }).click();
  assert.equal(await device.getByLabel('Nominal biaya 1 (Rp)', { exact: true }).inputValue(), '');
  await device.getByLabel('Nominal biaya 1 (Rp)', { exact: true }).fill('20000');
  await device.getByLabel('Nominal biaya 1 (Rp)', { exact: true }).fill('');
  assert.equal(await device.getByLabel('Nominal biaya 1 (Rp)', { exact: true }).inputValue(), '', 'Clearing an unknown cost must keep it unknown, not zero');
  await device.getByRole('button', { name: 'Lihat ringkasan pesanan', exact: true }).click();
  for (const checkbox of await device.getByRole('checkbox').all()) await checkbox.check();
  assert.equal(await device.getByRole('button', { name: 'Konfirmasi pesanan contoh', exact: true }).isDisabled(), true, 'Acknowledging an unknown cost must not turn it into zero');
  await scrollTo('.p-disclosure'); await capture('unknown-cost', 'Biaya belum diketahui memblokir laba dan konfirmasi');
  await device.getByRole('button', { name: 'Simpan draf dulu', exact: true }).click();
  const incompleteId = new URL(page.url()).hash.split('/').at(-1);
  await navigate(`/compose?edit=${incompleteId}`);
  await device.getByRole('button', { name: 'Lanjut pilih item', exact: true }).click();
  assert.equal(await device.getByLabel('Nominal biaya 1 (Rp)', { exact: true }).inputValue(), '');
  await device.getByRole('button', { name: 'Lihat ringkasan pesanan', exact: true }).click();
  assert.equal(await device.getByRole('checkbox', { name: /melengkapi bagian yang belum terbaca/ }).count(), 1, 'Capture warnings must survive saving and reopening a draft');
  assert.equal(await device.getByRole('button', { name: 'Konfirmasi pesanan contoh', exact: true }).isDisabled(), true);
  await navigate('/home'); assert.deepEqual(await readCards(), afterPayment);
  await navigate('/purchase/new');
  await device.getByLabel('Tanggal pembelian', { exact: true }).fill('2020-01-15');
  await device.getByRole('button', { name: 'Simpan satu rencana restok', exact: true }).click();
  assert.equal(await device.getByLabel('Tanggal pembelian aktual', { exact: true }).inputValue(), '2020-01-15');
  await device.getByLabel('Tanggal pembelian aktual', { exact: true }).fill('2020-02-01');
  await device.getByRole('button', { name: 'Konfirmasi pembelian ke pemasok', exact: true }).click();
  await device.getByText('2020-02-01', { exact: true }).waitFor();
  await navigate('/home'); assert.deepEqual(await readCards(), afterPayment, 'Supplier confirmation must not inflate money from customers or profit');
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['/reports', '/reports?view=payments', '/reports?view=profit', '/reports?view=learn']) {
      await navigate(route);
      assert.equal(await page.locator('.p-scroll').evaluate(element => element.scrollWidth > element.clientWidth + 1), false, `Overflow ${route} ${width}`);
      if (route.endsWith('view=profit')) assert.equal(await device.locator('.p-money-list strong').evaluateAll(elements => elements.every(element => element.getBoundingClientRect().height <= parseFloat(getComputedStyle(element).lineHeight) * 1.4)), true, `Currency should stay readable on one line at ${width}px`);
    }
  }
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  const result = { capturedAt: new Date().toISOString(), evidenceType: 'Automated simulated scenario; not a human participant study', baselineCommit: 'f2f8319', screenshots, positions, baseline, afterSale, afterPayment, costParsing: { '20rb': 20000, '5rb': 5000, sellerCosts: 25000, orderProfit: 95000 }, incompleteDraftExcluded: true, unknownCostBlocked: true, purchaseActualDatePreserved: true, manualSaleOneTap: true, browserErrors: errors, externalRequests: external };
  writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
