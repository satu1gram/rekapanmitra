import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowUpRight } from 'lucide-react';
import { BOLD_PALETTE } from './designOptions';
import { Page, Card, Note, Pill } from './ui';

export function DesignLab() {
  return <Page title="Arah desain MULA" subtitle="Bold Fintech · fokus uang, tagihan, modal dan laba">
    <section className="p-hero"><Pill><CheckCircle2 size={13} />Desain yang dipilih</Pill><strong>Uang lebih jelas.<br />Jualan lebih tenang.</strong><p className="p-small">Pahami uang yang sudah diterima, sisa tagihan, modal produk dan estimasi laba. Selesaikan pekerjaan penting langsung dari beranda.</p></section>
    <div className="p-design-palette">{BOLD_PALETTE.map(color => <div key={color.name}><span style={{ background: color.value }} /><strong>{color.name}</strong><small>{color.value}</small><p>{color.role}</p></div>)}</div>
    <Card><h2>Dari masalah ke tindakan</h2><div className="p-design-principles">{[
      ['01', 'Empat arti uang', 'Pembayaran, tagihan, modal produk terjual dan estimasi laba dipisahkan beserta asal angkanya.'],
      ['02', 'Tagihan bisa ditindaklanjuti', 'Lihat semua periode, pilih pelanggan, lalu catat pembayaran tambahan yang benar-benar diterima.'],
      ['03', 'Laba bisa dijelaskan', 'Pilih satu pesanan untuk melihat harga jual, modal, biaya, pembayaran dan sisanya.'],
      ['04', 'Biaya tidak ditebak', 'Format 20rb dibaca sebagai 20.000. Nominal ambigu tetap kosong dan perlu dilengkapi.'],
      ['05', 'Stok tetap terpisah', 'Pembelian pemasok bukan penjualan dan tidak dikurangi dua kali dari laba produk yang terjual.'],
    ].map(([number, title, description]) => <div key={number}><span>{number}</span><div><h3>{title}</h3><p className="p-small">{description}</p></div></div>)}</div></Card>
    <Card><h2>Coba perjalanan utamanya</h2>{[
      ['/welcome', 'Mulai & pengenalan'], ['/home', 'Beranda uang & pekerjaan'], ['/reports?view=learn', 'Kenapa uang berbeda dengan laba?'], ['/reports?view=payments&scope=all', 'Tagihan semua periode'],
      ['/compose?example=multi', 'Order beberapa produk'], ['/purchase/new?example=multi', 'Restok beberapa produk'], ['/orders/ORD-1031', 'Progres pesanan'], ['/settings', 'Akun & usaha'],
    ].map(([route, title]) => <Link className="p-row" key={route} to={route}><span className="p-row-copy"><strong>{title}</strong></span><ArrowUpRight size={19} /></Link>)}</Card>
    <Note>Seluruh angka dan transaksi masih berupa data contoh. Melihat serta mencoba prototipe tidak mengubah usaha di production.</Note>
  </Page>;
}
