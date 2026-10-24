import { useRef, useState } from 'react';
import { BarChart3, ClipboardList, Home, Plus, Trash2 } from 'lucide-react';
import { businessDate } from '@/lib/businessOverview';
import { formatCurrency } from '@/lib/formatters';
import {
  MULA_PRODUCTS, LEVEL_LABELS, MULA_RULEBOOK, quoteMulaOrder, extractMulaDemoText,
  evaluateMulaMonth, reportMulaOrders, unitCost,
  type MulaLevel, type MulaLine, type MulaExpense, type MulaOrder, type MulaPurchase, type MulaQuote, type SaleMode,
} from '@/lib/mulaBusiness';

const money = (value: number | null) => value === null ? 'Perlu dilengkapi' : formatCurrency(value);
const field = 'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900';
const button = 'min-h-12 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white disabled:opacity-40';
const panel = 'space-y-4 rounded-2xl border border-slate-200 bg-white p-5';
type Tab = 'home' | 'orders' | 'add' | 'report';

function seedOrder(id: string, buyer: string, date: string, lines: MulaLine[], level: MulaLevel, expenses: MulaExpense[]): MulaOrder {
  return { id, buyer, date, lines, level, expenses, mode: 'unit', status: 'confirmed', raw: 'Contoh sintetis PRD MULA', quote: quoteMulaOrder(lines, 'unit', level, expenses), events: ['Order contoh dikonfirmasi. Harga/modal dibekukan saat konfirmasi.'] };
}

function QuoteCard({ quote }: { quote: MulaQuote }) {
  return <section className={panel} aria-label="Perhitungan pesanan">
    <h3 className="text-lg font-bold">Periksa hitungan, bukan hanya total jual</h3>
    <ul className="space-y-3 rounded-xl bg-slate-50 p-3">{quote.pricedLines.map((line, index) => <li key={index}><p className="font-semibold">{line.quantity} × {line.name}</p><p className="text-sm text-slate-600">Harga jual/botol: {money(line.unitSale)}<br />Modal estimasi/botol: {money(line.unitCost)}</p></li>)}</ul>
    <dl className="space-y-2">{[
      ['Nilai jual', quote.revenue], ['Modal estimasi', quote.cost], ['Laba kotor', quote.gross],
      ['Biaya ditanggung penjual', quote.sellerExpenses], ['Estimasi laba setelah biaya', quote.profit],
    ].map(([name, amount]) => <div key={name} className="flex flex-wrap justify-between gap-2"><dt className="text-slate-600">{name}</dt><dd className="font-bold">{money(amount as number | null)}</dd></div>)}</dl>
    {quote.issues.length > 0 && <div role="alert" className="rounded-xl bg-amber-50 p-3 text-amber-950"><p className="font-bold">Perlu dicek sebelum konfirmasi</p><ul className="mt-2 list-disc space-y-1 pl-5">{quote.issues.map(issue => <li key={issue}>{issue}</li>)}</ul></div>}
    <p className="text-sm text-slate-500">Harga mengikuti PRD MULA v3.0 untuk simulasi. Modal belum memakai alokasi lot persediaan. Tidak mengubah katalog produksi.</p>
  </section>;
}

export default function MulaDemo() {
  const saveLock = useRef(false);
  const [today] = useState(() => businessDate(new Date()));
  const [tab, setTab] = useState<Tab>('home');
  const [level, setLevel] = useState<MulaLevel>('agent');
  const [month, setMonth] = useState(today.slice(0, 7));
  const [orders, setOrders] = useState<MulaOrder[]>(() => [
    seedOrder('contoh-green', 'Bu Ani (contoh)', today, [{ sku: 'GREEN', quantity: 1 }], 'agent', [{ name: 'Ongkir', amount: 12000, payer: 'seller' }, { name: 'Infaq', amount: 5000, payer: 'seller' }]),
    seedOrder('contoh-belgie', 'Bu Siti (contoh)', today, [{ sku: 'FW', quantity: 3 }], 'agent', [{ name: 'Ongkir', amount: 12000, payer: 'seller' }, { name: 'Infaq', amount: 5000, payer: 'seller' }, { name: 'Kemasan', amount: 3000, payer: 'seller' }]),
  ]);
  const [purchases, setPurchases] = useState<MulaPurchase[]>([
    { id: 'beli-bp', date: today, sku: 'BP', quantity: 3, unitCost: 225000 },
    { id: 'beli-belgie', date: today, sku: 'FW', quantity: 4, unitCost: 195000 },
  ]);
  const [raw, setRaw] = useState('Bu Ani pesan 1 BP Green. Ongkir 12000, infaq 5000.');
  const [buyer, setBuyer] = useState('');
  const [date, setDate] = useState(today);
  const [lines, setLines] = useState<MulaLine[]>([]);
  const [mode, setMode] = useState<SaleMode>('unit');
  const [expenses, setExpenses] = useState<MulaExpense[]>([]);
  const [reviewed, setReviewed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [orderLevel, setOrderLevel] = useState<MulaLevel>('agent');
  const [notice, setNotice] = useState('');
  const [purchaseSku, setPurchaseSku] = useState('BP');
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchaseDate, setPurchaseDate] = useState(today);
  const quote = quoteMulaOrder(lines, mode, orderLevel, expenses);
  const report = reportMulaOrders(orders, month);
  const monthly = evaluateMulaMonth(level, month, purchases);
  const drafts = orders.filter(order => order.status === 'draft' && order.date.slice(0, 7) === month);
  const losses = orders.filter(order => order.status === 'confirmed' && order.date.slice(0, 7) === month && order.quote.profit !== null && order.quote.profit < 0);
  const available = MULA_PRODUCTS.map(product => ({
    ...product,
    quantity: 6 + purchases.filter(p => p.sku === product.sku).reduce((sum, p) => sum + p.quantity, 0)
      - orders.filter(o => o.status === 'confirmed').flatMap(o => o.lines).filter(l => l.sku === product.sku).reduce((sum, l) => sum + l.quantity, 0),
  }));
  const lowStock = available.filter(p => p.quantity <= 3);
  const pendingNotice = quote.issues.length ? 'Lengkapi harga/modal atau aturan paket sebelum mengonfirmasi.' : 'Pastikan pembeli, biaya, dan seluruh isi chat sudah diperiksa.';

  function startOrder() {
    saveLock.current = false;
    setEditingId(null); setBuyer(''); setLines([]); setExpenses([]); setDate(today); setMode('unit'); setReviewed(false); setOrderLevel(level); setNotice(''); setTab('add');
  }
  function extract() {
    const result = extractMulaDemoText(raw);
    setReviewed(false); setNotice(result.message);
    if (result.intent === 'order') {
      setLines(result.lines);
      const name = raw.match(/(?:bu|pak|kak|mbak)\s+([a-z]+(?:\s+(?!pesan|order|beli)[a-z]+)?)/i);
      setBuyer(name?.[0] ?? '');
      setExpenses([...raw.matchAll(/(ongkir|infaq|kemasan|admin)\s+(\d+)(?!\d)(?![.,]\d)/gi)].map(match => ({ name: match[1], amount: Number(match[2]), payer: 'seller' })));
    } else { setLines([]); setExpenses([]); setBuyer(''); }
  }
  function save(status: 'draft' | 'confirmed') {
    if (saveLock.current) return;
    if (status === 'confirmed' && (!quote.canConfirm || !buyer.trim() || !reviewed || !date || date > today)) { setNotice(pendingNotice); return; }
    if (!date || date > today) { setNotice('Pilih tanggal hari ini atau sebelumnya.'); return; }
    saveLock.current = true;
    const id = editingId ?? crypto.randomUUID();
    setOrders(previous => {
      if (previous.some(order => order.id === id && order.status !== 'draft')) return previous;
      const order: MulaOrder = { id, buyer: buyer.trim() || 'Pembeli belum diisi', date, lines: structuredClone(lines), mode, level: orderLevel, expenses: structuredClone(expenses), status, quote: structuredClone(quote), raw, events: [status === 'confirmed' ? 'Dikonfirmasi pengguna dalam simulasi; snapshot harga/modal disimpan.' : 'Draf disimpan dalam sesi demo; belum masuk omzet.'] };
      return [order, ...previous.filter(existing => existing.id !== id)];
    });
    setNotice(status === 'confirmed' ? 'Order simulasi dikonfirmasi. Cek perubahan omzet dan laba di Beranda.' : 'Draf simulasi tersimpan di sesi ini. Omzet belum berubah.');
    setEditingId(id); setTab('orders');
  }
  function reopen(order: MulaOrder) {
    saveLock.current = false;
    setEditingId(order.id); setBuyer(order.buyer); setDate(order.date); setLines(structuredClone(order.lines)); setMode(order.mode); setOrderLevel(order.level); setExpenses(structuredClone(order.expenses)); setRaw(order.raw); setReviewed(false); setNotice('Periksa kembali draf sebelum konfirmasi.'); setTab('add');
  }
  function cancel(id: string) {
    if (!window.confirm('Batalkan order simulasi ini? Omzet dan alokasi stok akan dikoreksi; jejak pembatalan tetap terlihat.')) return;
    setOrders(previous => previous.map(order => order.id === id && order.status === 'confirmed' ? { ...order, status: 'cancelled', events: [...order.events, 'Dibatalkan pengguna; nilai dikeluarkan dari laporan.'] } : order));
    setNotice('Order dibatalkan. Laporan sudah dikoreksi satu kali.');
  }
  function receive() {
    const cost = unitCost(purchaseSku, level);
    if (!purchaseDate || purchaseDate > today || !Number.isSafeInteger(purchaseQty) || purchaseQty < 1 || purchaseQty > 100000 || cost === null) { setNotice('Jumlah/tanggal harus valid dan modal harus diketahui sebelum mencatat pembelian.'); return; }
    setPurchases(previous => [...previous, { id: crypto.randomUUID(), date: purchaseDate, sku: purchaseSku, quantity: purchaseQty, unitCost: cost }]);
    setNotice('Pembelian diterima dalam simulasi. Stok dan ekuivalen berubah; omzet penjualan tetap.');
  }
  async function copySummary() {
    const text = [
      `CONTOH — MULA × Rekapan Mitra BP (${month}, WIB)`,
      `${report.count} order terkonfirmasi; ${drafts.length} draf belum masuk omzet.`,
      `Omzet: ${money(report.revenue)}`, `Modal estimasi: ${money(report.cost)}`,
      `Biaya order penjual: ${money(report.expenses)}`, `Estimasi laba setelah biaya: ${money(report.profit)}`,
      `Pembelian pemasok: ${monthly.equivalent} ekuivalen.`,
      'Bukan bukti uang diterima. Biaya umum/pendapatan lain belum termasuk. Data simulasi, bukan transaksi asli.',
    ].join('\n');
    try { await navigator.clipboard.writeText(text); setNotice('Rekap contoh disalin. Anda dapat membagikannya sendiri; aplikasi tidak mengirim pesan.'); }
    catch { setNotice('Belum bisa menyalin. Izinkan akses clipboard atau pilih angka pada laporan secara manual.'); }
  }

  return <div className="mx-auto min-h-screen max-w-xl bg-slate-50 pb-28 text-base text-slate-900">
    <header className="space-y-2 px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]"><p className="text-sm font-bold tracking-wide text-emerald-700">MULA × REKAPAN MITRA BP</p><h1 className="text-3xl font-extrabold leading-tight">Catat order.<br />Pahami usaha Anda.</h1><p className="text-slate-600">{tab === 'home' ? 'Angka jelas, tindakan berikutnya lebih mudah.' : tab === 'add' ? 'Baca chat, cek detail, baru konfirmasi.' : tab === 'orders' ? 'Draf dan transaksi final tidak dicampur.' : 'Penjualan, persediaan, dan level punya sumber hitungan sendiri.'}</p></header>
    <main className="space-y-5 px-5">
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Prototipe gabungan • Data contoh hanya di memori, hilang saat halaman dimuat ulang. Tidak terhubung ke AI, WhatsApp, atau database produksi.</p>
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">{notice}</p>}
      {tab !== 'add' && <label className="block space-y-2 font-semibold">Bulan usaha (WIB)<input className={field} type="month" value={month} onChange={event => { if (event.target.value) setMonth(event.target.value); }} /></label>}

      {tab === 'home' && <>
        <section className="space-y-4 rounded-3xl bg-emerald-950 p-5 text-white"><p className="text-emerald-200">Omzet terkonfirmasi · {month}</p><p className="break-words text-3xl font-extrabold" data-testid="home-revenue">{money(report.revenue)}</p><div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-emerald-200">Estimasi laba setelah biaya</p><p className="mt-1 text-xl font-bold">{money(report.profit)}</p></div><div><p className="text-sm text-emerald-200">Pesanan terkonfirmasi</p><p className="mt-1 text-xl font-bold">{report.count}</p></div></div><button type="button" className="min-h-14 w-full rounded-xl bg-white px-4 font-bold text-emerald-950" onClick={startOrder}>Catat pesanan baru</button><p className="text-sm text-emerald-200">Hanya order terkonfirmasi, bukan draf/batal. Omzet bukan bukti uang diterima; biaya umum belum termasuk simulasi ini.</p></section>
        <section className={panel}><h2 className="text-xl font-bold">Yang perlu Anda lakukan</h2><button type="button" onClick={() => setTab('orders')} className="min-h-12 w-full rounded-xl bg-slate-100 p-3 text-left"><strong>{drafts.length} draf menunggu pemeriksaan</strong><span className="mt-1 block text-slate-600">Belum menambah omzet.</span></button>{losses.length > 0 && <button type="button" onClick={() => setTab('orders')} className="min-h-12 w-full rounded-xl bg-red-50 p-3 text-left text-red-900"><strong>{losses.length} order memiliki estimasi laba negatif</strong><span className="mt-1 block">Periksa harga jual, modal, dan biaya yang ditanggung.</span></button>}<button type="button" onClick={() => setTab('report')} className="min-h-12 w-full rounded-xl bg-amber-50 p-3 text-left"><strong>{lowStock.length} produk perlu perhatian stok</strong><span className="mt-1 block text-slate-600">Periksa alokasi sebelum menerima pesanan.</span></button><p className="text-slate-600">Pembayaran: belum diverifikasi. Pesan “sudah transfer” tetap perlu pengecekan.</p></section>
        <section className={panel}><h2 className="text-xl font-bold">Level dan belanja pemasok</h2><p>Level simulasi: <strong>{LEVEL_LABELS[level]}</strong></p><p>{monthly.equivalent} ekuivalen pembelian / target {monthly.target ?? 'perlu review'}.</p><p className="text-slate-600">{monthly.reason}</p><p>Jika bulan berakhir dengan angka ini: <strong>{monthly.nextLevel ? LEVEL_LABELS[monthly.nextLevel] : 'Perlu review'}</strong> mulai {monthly.nextMonth}.</p><p className="text-sm text-slate-500">Level ditentukan pembelian dari pemasok, bukan penjualan ke pelanggan. BP = 1, Belgie = 0,5 ekuivalen.</p></section>
      </>}

      {tab === 'add' && <>
        <section className={panel}><h2 className="text-xl font-bold">1. Tempel chat atau isi manual</h2><label className="block space-y-2">Chat yang ingin dicatat<textarea aria-label="Chat pesanan" className={`${field} min-h-32`} value={raw} maxLength={2000} onChange={event => { setRaw(event.target.value); setReviewed(false); }} /></label><button type="button" className={`${button} w-full`} onClick={extract}>Isi draf dari teks contoh</button><p className="text-sm text-slate-500">Pembaca pola lokal terbatas, bukan AI live. Nama, semua item, dan biaya wajib diperiksa. Screenshot/share native masih rencana.</p><div className="flex flex-wrap gap-2">{['Bu Ani pesan 1 BP Green. Ongkir 12000, infaq 5000.', 'Bu Siti pesan 3 Belgie FW. Ongkir 12000, infaq 5000, kemasan 3000.', 'Ready BP Green?', 'Sudah transfer ya'].map((text, index) => <button key={text} className="min-h-12 rounded-xl border px-3 text-sm" type="button" onClick={() => { setRaw(text); setReviewed(false); }}>{['Contoh Green', 'Contoh Belgie', 'Contoh pertanyaan', 'Klaim transfer'][index]}</button>)}</div></section>
        <section className={panel}><h2 className="text-xl font-bold">2. Periksa pembeli dan produk</h2><label className="block space-y-2">Nama pembeli<input className={field} value={buyer} onChange={event => { setBuyer(event.target.value); setReviewed(false); }} /></label><label className="block space-y-2">Tanggal pesanan<input className={field} type="date" value={date} max={today} onChange={event => { setDate(event.target.value); setReviewed(false); }} /></label><label className="block space-y-2">Level modal saat transaksi<select aria-label="Level modal saat transaksi" className={field} value={orderLevel} onChange={event => { setOrderLevel(event.target.value as MulaLevel); setReviewed(false); }}>{Object.entries(LEVEL_LABELS).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label><label className="block space-y-2">Cara menjual<select aria-label="Cara menjual" className={field} value={mode} onChange={event => { setMode(event.target.value as SaleMode); setReviewed(false); }}><option value="unit">Harga satuan per botol</option><option value="bundle">Paket BP 1 / 3 / 5 / 10 / 40</option></select></label>
          {lines.map((line, index) => <div key={index} className="space-y-2 rounded-xl bg-slate-50 p-3"><label className="block space-y-1">Produk {index + 1}<select className={field} value={line.sku} onChange={event => { setLines(previous => previous.map((item, i) => i === index ? { ...item, sku: event.target.value } : item)); setReviewed(false); }}>{MULA_PRODUCTS.map(product => <option key={product.sku} value={product.sku}>{product.name}</option>)}</select></label><div className="flex items-end gap-2"><label className="block flex-1 space-y-1">Jumlah botol<input className={field} type="number" min="1" max="100000" step="1" value={line.quantity} onChange={event => { setLines(previous => previous.map((item, i) => i === index ? { ...item, quantity: Number(event.target.value) } : item)); setReviewed(false); }} /></label><button aria-label={`Hapus produk ${index + 1}`} type="button" className="min-h-12 min-w-12 rounded-xl border p-3" onClick={() => { setLines(previous => previous.filter((_, i) => i !== index)); setReviewed(false); }}><Trash2 className="h-5 w-5" /></button></div></div>)}
          <button type="button" className="min-h-12 w-full rounded-xl border border-emerald-700 font-bold text-emerald-800" onClick={() => { setLines(previous => [...previous, { sku: 'BP', quantity: 1 }]); setReviewed(false); }}>Tambah produk</button>
        </section>
        <section className={panel}><h2 className="text-xl font-bold">3. Catat seluruh biaya</h2><p className="text-slate-600">Biaya yang ditanggung penjual mengurangi laba, bukan omzet.</p>{expenses.map((expense, index) => <div key={index} className="space-y-2 rounded-xl bg-slate-50 p-3"><label className="block">Nama biaya<input className={field} value={expense.name} onChange={event => { setExpenses(previous => previous.map((item, i) => i === index ? { ...item, name: event.target.value } : item)); setReviewed(false); }} /></label><label className="block">Nominal rupiah<input className={field} type="number" min="0" step="1" value={expense.amount} onChange={event => { setExpenses(previous => previous.map((item, i) => i === index ? { ...item, amount: Number(event.target.value) } : item)); setReviewed(false); }} /></label><label className="block">Ditanggung oleh<select className={field} value={expense.payer} onChange={event => { setExpenses(previous => previous.map((item, i) => i === index ? { ...item, payer: event.target.value as 'seller' | 'buyer' } : item)); setReviewed(false); }}><option value="seller">Penjual</option><option value="buyer">Pembeli, langsung ke pihak lain</option></select></label><button type="button" className="min-h-12 px-3 text-red-700" onClick={() => { setExpenses(previous => previous.filter((_, i) => i !== index)); setReviewed(false); }}>Hapus biaya</button></div>)}<button className="min-h-12 w-full rounded-xl border font-bold" type="button" onClick={() => { setExpenses(previous => [...previous, { name: 'Ongkir', amount: 0, payer: 'seller' }]); setReviewed(false); }}>Tambah biaya</button></section>
        <QuoteCard quote={quote} />
        <section className={panel}><label className="flex min-h-12 items-start gap-3"><input className="mt-1 h-6 w-6 shrink-0" type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)} /><span>Saya sudah memeriksa semua detail dan memastikan pesanan ini ditujukan kepada usaha saya.</span></label><button type="button" className={`${button} w-full`} disabled={!quote.canConfirm || !buyer.trim() || !reviewed || !date || date > today} onClick={() => save('confirmed')}>Konfirmasi order simulasi</button><button type="button" className="min-h-12 w-full rounded-xl border font-bold" onClick={() => save('draft')}>Simpan sebagai draf simulasi</button><p className="text-sm text-slate-500">Draf belum masuk omzet. Konfirmasi hanya mengubah data di sesi demo ini.</p></section>
      </>}

      {tab === 'orders' && <><section className={panel}><h2 className="text-xl font-bold">Pesanan · {month}</h2><p className="text-slate-600">Draf bisa dilengkapi. Order final menyimpan snapshot; perubahan level tidak menghitung ulang histori.</p><button type="button" className={`${button} w-full`} onClick={startOrder}>Tambah pesanan</button></section>{orders.filter(order => order.date.slice(0, 7) === month).map(order => <article key={order.id} className={panel}><div className="flex flex-wrap justify-between gap-2"><h3 className="text-lg font-bold">{order.buyer}</h3><span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-bold">{order.status === 'confirmed' ? 'Terkonfirmasi' : order.status === 'draft' ? 'Draf / perlu dicek' : 'Dibatalkan'}</span></div><p>{order.lines.map(line => `${line.quantity} × ${MULA_PRODUCTS.find(p => p.sku === line.sku)?.name ?? line.sku}`).join(', ') || 'Produk belum diisi'}</p><p>Nilai jual: <strong>{money(order.quote.revenue)}</strong><br />Estimasi laba: <strong>{money(order.quote.profit)}</strong></p><details><summary className="min-h-12 cursor-pointer py-3 font-semibold">Lihat sumber dan jejak perubahan</summary><p className="break-words text-slate-600">{order.raw}</p><p className="mt-2 text-sm text-slate-500">{order.quote.rulebook} · {LEVEL_LABELS[order.level]}</p><ul className="mt-2 list-disc pl-5">{order.events.map((event, index) => <li key={index}>{event}</li>)}</ul></details>{order.status === 'draft' && <button type="button" className={button} onClick={() => reopen(order)}>Periksa draf</button>}{order.status === 'confirmed' && <button type="button" className="min-h-12 rounded-xl border border-red-200 px-4 font-semibold text-red-700" onClick={() => cancel(order.id)}>Batalkan order simulasi</button>}</article>)}{!orders.some(order => order.date.slice(0, 7) === month) && <p className={panel}>Belum ada pesanan pada bulan ini.</p>}</>}

      {tab === 'report' && <>
        <section className={panel}><h2 className="text-xl font-bold">Kondisi usaha · {month}</h2><dl className="space-y-3">{[['Omzet terkonfirmasi', report.revenue], ['Modal estimasi', report.cost], ['Biaya order penjual', report.expenses], ['Estimasi laba setelah biaya', report.profit]].map(([name, value]) => <div key={name} className="flex flex-wrap justify-between gap-2"><dt>{name}</dt><dd className="font-bold">{money(value as number | null)}</dd></div>)}</dl><p className="text-sm text-slate-500">{report.count} order terkonfirmasi. Draf/batal tidak masuk. Saldo kas dan pembayaran belum diverifikasi. Biaya umum serta pendapatan lain belum dimodelkan di prototipe MULA.</p><button type="button" className={`${button} w-full`} onClick={() => void copySummary()}>Salin rekap bulan ini</button></section>
        <section className={panel}><h2 className="text-xl font-bold">Level pembelian bulanan</h2><label className="block space-y-2">Level aktif simulasi<select aria-label="Level aktif simulasi" className={field} value={level} onChange={event => setLevel(event.target.value as MulaLevel)}>{Object.entries(LEVEL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><p className="text-2xl font-bold">{monthly.equivalent} ekuivalen</p><p>Target {monthly.target ?? 'belum ditetapkan'} · Perkiraan {monthly.nextMonth}: <strong>{monthly.nextLevel ? LEVEL_LABELS[monthly.nextLevel] : 'Perlu review'}</strong></p><p className="text-slate-600">{monthly.reason}</p><p className="text-sm text-slate-500">1 BP = 1; 2 Belgie = 1 ekuivalen. Jumlah fisik barang tetap utuh. Pergantian level bulan ini tidak mengubah snapshot order lama.</p></section>
        <section className={panel}><h2 className="text-xl font-bold">Pembelian pemasok / restok</h2><p className="text-slate-600">Simulasi ini mencatat barang sudah diterima, bukan rencana pembelian. Pembelian menambah stok dan progres level, bukan omzet.</p><label className="block space-y-2">Produk pemasok<select aria-label="Produk pemasok" className={field} value={purchaseSku} onChange={event => setPurchaseSku(event.target.value)}>{MULA_PRODUCTS.map(p => <option key={p.sku} value={p.sku}>{p.name}</option>)}</select></label><label className="block space-y-2">Botol diterima<input className={field} type="number" value={purchaseQty} min="1" max="100000" step="1" onChange={event => setPurchaseQty(Number(event.target.value))} /></label><label className="block space-y-2">Tanggal penerimaan<input className={field} type="date" value={purchaseDate} max={today} onChange={event => setPurchaseDate(event.target.value)} /></label><p>Modal per botol: <strong>{money(unitCost(purchaseSku, level))}</strong></p><button type="button" className={`${button} w-full`} onClick={receive} disabled={unitCost(purchaseSku, level) === null}>Catat penerimaan simulasi</button><details><summary className="min-h-12 cursor-pointer py-3 font-semibold">Riwayat pembelian bulan ini</summary><ul className="space-y-2">{purchases.filter(p => p.date.slice(0, 7) === month).map(p => <li key={p.id}>{p.date}: {p.quantity} × {MULA_PRODUCTS.find(product => product.sku === p.sku)?.name} · {money(p.quantity * p.unitCost)}</li>)}</ul></details></section>
        <section className={panel}><h2 className="text-xl font-bold">Stok setelah alokasi order</h2><p className="text-sm text-slate-500">Contoh: stok awal 6 botol per SKU + barang diterima − order terkonfirmasi. Ini saldo alokasi seluruh sesi, bukan stok fisik atau saldo historis bulan yang dipilih. Angka negatif berarti kekurangan untuk memenuhi order.</p><ul className="divide-y">{available.map(product => <li className="flex justify-between gap-3 py-3" key={product.sku}><span>{product.name}</span><strong className={product.quantity <= 3 ? 'text-amber-800' : ''}>{product.quantity} btl{product.quantity <= 3 ? ' · cek' : ''}</strong></li>)}</ul></section>
        <section className={panel}><h2 className="text-xl font-bold">Sumber & koneksi</h2><p>Tempel teks: <strong>simulasi pola lokal</strong>.</p><p>WhatsApp Business resmi, gambar, dan share native: <strong>belum terhubung</strong>.</p><p className="text-sm text-slate-500">MULA tidak mengirim atau membalas pesan WhatsApp. Chat pribadi/grup tidak otomatis dibaca. Gunakan data contoh, bukan chat pelanggan asli pada demo publik.</p></section>
      </>}
      <p className="break-words pb-3 text-sm text-slate-500">Acuan simulasi: {MULA_RULEBOOK}. Harga/modal yang tidak tersedia tetap perlu review, bukan dianggap nol.</p>
    </main>
    <nav aria-label="Navigasi utama MULA" className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white pb-[env(safe-area-inset-bottom)]"><div className="mx-auto grid max-w-xl grid-cols-4">{([
      ['home', Home, 'Beranda'], ['orders', ClipboardList, 'Pesanan'], ['add', Plus, 'Tambah'], ['report', BarChart3, 'Laporan'],
    ] as const).map(([id, Icon, label]) => <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => { if (id === 'add' && tab !== 'add' && editingId) startOrder(); else { setTab(id); setNotice(''); } window.scrollTo(0, 0); }} className={`flex min-h-20 flex-col items-center justify-center gap-1 px-2 text-sm font-bold ${tab === id ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500'}`}><Icon className="h-6 w-6" />{label}</button>)}</div></nav>
  </div>;
}
