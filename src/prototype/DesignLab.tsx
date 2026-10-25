import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowUpRight } from 'lucide-react';
import { BOLD_PALETTE } from './designOptions';
import { Page, Card, Note, Pill } from './ui';

export function DesignLab() {
  return <Page title="Arah desain MULA" subtitle="Bold Fintech · mengacu pada referensi pilihan Anda">
    <section className="p-hero"><Pill><CheckCircle2 size={13} />Desain yang dipilih</Pill><strong>Jelas angkanya.<br />Ringan mencatatnya.</strong><p className="p-small">Foto produk yang mudah dikenali, keranjang yang rapi, dan satu langkah utama pada setiap layar.</p></section>
    <div className="p-design-palette">{BOLD_PALETTE.map(color => <div key={color.name}><span style={{ background: color.value }} /><strong>{color.name}</strong><small>{color.value}</small><p>{color.role}</p></div>)}</div>
    <Card><h2>Dari referensi ke MULA</h2><div className="p-design-principles">{[
      ['01', 'Awal yang berkarakter', 'Layar pembuka dengan judul tegas, visual produk, dan satu tombol mulai.'],
      ['02', 'Temukan lebih cepat', 'Pencarian di atas, kategori ringkas, dan kartu produk dengan foto asli katalog.'],
      ['03', 'Keranjang yang transparan', 'Thumbnail, jumlah yang bisa langsung diubah, modal per SKU, dan ringkasan satu transaksi.'],
      ['04', 'Tahu langkah berikutnya', 'Progres order dan restok mengikuti aktivitas yang benar-benar dicatat. Pembayaran tetap terpisah.'],
      ['05', 'Satu bahasa visual', 'Permukaan putih, jarak lapang, ikon konsisten, dan navigasi empat tujuan yang tetap.'],
    ].map(([number, title, description]) => <div key={number}><span>{number}</span><div><h3>{title}</h3><p className="p-small">{description}</p></div></div>)}</div></Card>
    <Card><h2>Coba perjalanan utamanya</h2>{[
      ['/welcome', 'Mulai & pengenalan'], ['/home', 'Beranda usaha'], ['/catalog', 'Katalog produk'], ['/catalog/GREEN', 'Detail produk'],
      ['/compose?example=multi', 'Order beberapa produk'], ['/purchase/new?example=multi', 'Restok beberapa produk'], ['/orders/ORD-1031', 'Progres pesanan'], ['/settings', 'Akun & usaha'],
    ].map(([route, title]) => <Link className="p-row" key={route} to={route}><span className="p-row-copy"><strong>{title}</strong></span><ArrowUpRight size={19} /></Link>)}</Card>
    <Note>Seluruh angka dan transaksi masih berupa data contoh. Melihat serta mencoba prototipe tidak mengubah usaha di production.</Note>
  </Page>;
}
