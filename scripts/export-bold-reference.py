"""Export the verified UI screenshots. Requires ReportLab; run browser checks first."""
import json
import os
import zipfile
from pathlib import Path

from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph

folder = Path(os.environ.get('DESIGN_ARTIFACTS', '/workspace/artifacts/mula-bold-fintech'))
manifest = json.loads((folder / 'manifest.json').read_text())
output = folder.parent / 'MULA-Bold-Fintech-Reference.pdf'
font_root = Path(os.environ.get('DESIGN_FONT_ROOT', '/usr/share/fonts/truetype/dejavu'))
pdfmetrics.registerFont(TTFont('Mula', str(font_root / 'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('Mula-Bold', str(font_root / 'DejaVuSans-Bold.ttf')))
ink, muted, blue, lime = '#14244a', '#63728c', '#3058ed', '#d7f86b'
c = canvas.Canvas(str(output), pagesize=(1260, 1480), pageCompression=1)
c.setTitle('MULA — Bold Fintech · Referensi UI/UX'); c.setAuthor('Rekapan Mitra BP')
body = ParagraphStyle('body', fontName='Mula', fontSize=9, leading=14, textColor=HexColor(muted))
small = ParagraphStyle('small', fontName='Mula', fontSize=8, leading=12, textColor=HexColor(muted))
shots = {s['screen']: s for s in manifest['screenshots']}
base = 'https://rekapanmitra-mobile-demo.pages.dev/#'
titles = {
    'welcome': 'Mulai bersama MULA', 'home': 'Beranda usaha', 'product': 'Detail produk',
    'order-cart': 'Keranjang order', 'order-review': 'Review satu pesanan', 'progress': 'Progres pesanan',
    'favorites': 'Produk favorit', 'account': 'Akun & usaha', 'catalog': 'Jelajahi produk',
    'restock-cart': 'Restok beberapa produk', 'restock-review': 'Ringkasan restok',
    'store-cart': 'Keranjang pelanggan', 'reports': 'Laporan usaha', 'design-system': 'Sistem desain',
}

def text(value, x, y, width, style=body):
    p = Paragraph(value, style); _, height = p.wrap(width, 1200)
    p.drawOn(c, x, y - height)
    return height

def phone(screen, x, y, width, radius=19):
    height = width * 844 / 390
    c.setFillColor(HexColor('#e0e5ee')); c.roundRect(x - 2, y - 3, width + 4, height + 6, radius + 2, fill=1, stroke=0)
    c.saveState(); clip = c.beginPath(); clip.roundRect(x, y, width, height, radius)
    c.clipPath(clip, fill=0, stroke=0)
    c.drawImage(str(folder / shots[screen]['file']), x, y, width=width, height=height)
    c.restoreState(); c.setStrokeColor(HexColor('#dfe4ef')); c.setLineWidth(.8)
    c.roundRect(x, y, width, height, radius, fill=0, stroke=1)
    c.linkURL(base + shots[screen]['route'], (x, y, x + width, y + height), relative=0, thickness=0)

def footer(W, page):
    c.setStrokeColor(HexColor('#e0e5ee')); c.line(28, 28, W - 28, 28)
    c.setFont('Mula', 8); c.setFillColor(HexColor(muted))
    c.drawString(28, 15, 'MULA × Rekapan Mitra BP · Prototipe Bold Fintech · 25 Oktober 2026 WIB')
    c.drawRightString(W - 28, 15, str(page))

W, H = 1260, 1480
c.setFillColor(HexColor('#f1f3f7')); c.rect(0, 0, W, H, fill=1, stroke=0)
c.setFont('Mula-Bold', 34); c.setFillColor(HexColor(ink)); c.drawString(36, H - 54, 'MULA · Bold Fintech')
c.setFont('Mula', 13); c.setFillColor(HexColor(muted)); c.drawString(36, H - 80, 'Referensi Anda, diterjemahkan menjadi perjalanan usaha British Propolis.')
for index, color in enumerate([ink, blue, lime, '#ffffff']):
    c.setFillColor(HexColor(color)); c.roundRect(W - 188 + index * 37, H - 68, 28, 28, 9, fill=1, stroke=0)
board = ['welcome', 'home', 'product', 'order-cart', 'progress', 'favorites', 'account', 'catalog']
width = 279
height = width * 844 / 390
for index, screen in enumerate(board):
    col, row = index % 4, index // 4
    x = 36 + col * 303
    top = H - 147 - row * (height + 65)
    c.setFont('Mula-Bold', 12); c.setFillColor(HexColor(ink)); c.drawString(x + 3, top + 19, f'{index + 1:02d}  {titles[screen]}')
    phone(screen, x, top - height, width, 25)
footer(W, 1); c.showPage()

details = [
    ('Order: satu aktivitas, semua produk', 'Pembeli, harga, modal dan biaya diperiksa sebelum satu konfirmasi. Pengiriman tetap terpisah dari pembayaran.', ['order-cart', 'order-review', 'progress']),
    ('Restok dan keranjang pelanggan', 'Modal per SKU, satu total pembelian, penerimaan seluruh kiriman. Permintaan toko masuk sebagai draf pemilik.', ['restock-cart', 'restock-review', 'store-cart']),
    ('Awal yang jelas, produk mudah dikenali', 'Judul tegas, foto produk lokal, pencarian, pintasan harian dan banner keuangan memakai palet Bold Fintech.', ['welcome', 'home', 'catalog']),
    ('Detail, favorit dan ruang usaha', 'Harga serta stok dapat diperiksa, produk favorit bisa difilter, dan menu usaha dikelompokkan dalam satu bahasa visual.', ['product', 'favorites', 'account']),
    ('Sistem visual dan kondisi bisnis', 'Satu arah desain diterapkan pada seluruh prototipe. Angka laporan berasal dari transaksi contoh yang dikonfirmasi.', ['design-system', 'reports']),
]
for page, (title, subtitle, screens) in enumerate(details, 2):
    W, H = landscape(A4); c.setPageSize((W, H))
    c.setFillColor(HexColor('#f5f6fa')); c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFont('Mula-Bold', 18); c.setFillColor(HexColor(ink)); c.drawString(28, H - 33, title)
    text(subtitle, 28, H - 46, W - 56)
    cell = (W - 56) / 3
    for index, screen in enumerate(screens):
        x = 28 + index * cell
        c.setFont('Mula-Bold', 11); c.setFillColor(HexColor(ink)); c.drawString(x + 7, H - 93, titles[screen])
        iw = 192; ih = iw * 844 / 390
        phone(screen, x + (cell - iw) / 2, 55, iw, 15)
    if len(screens) == 2:
        x = 28 + 2 * cell + 8
        c.setFont('Mula-Bold', 12); c.setFillColor(HexColor(ink)); c.drawString(x, H - 93, 'Yang diperiksa')
        text('54 layar · 69 tes aplikasi · 4 guard build. Alur multiproduk, stok, biaya, nota, favorit, pencarian dan checkout diuji di browser.', x, H - 113, cell - 24)
        text('Layout 360/390/430 px; panel aksi diperiksa agar tidak bertumpuk dengan navigasi. Gambar pada screenshot ditunggu hingga termuat.', x, H - 197, cell - 24)
        c.setFont('Mula-Bold', 12); c.setFillColor(HexColor(ink)); c.drawString(x, H - 300, 'Coba interaktif')
        text('rekapanmitra-mobile-demo.pages.dev/<br/>#/home', x, H - 320, cell - 24)
        c.linkURL(base + '/home', (x, H - 370, x + cell - 25, H - 312), relative=0, thickness=0)
        text('Tersedia setelah deployment preview selesai. Semua transaksi dan AI masih simulasi. Production tidak diubah; APK/IPA belum dibuat.', x, H - 400, cell - 24, small)
    footer(W, page); c.showPage()
c.save()
archive = folder.parent / 'MULA-Bold-Fintech-Screens.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for item in sorted(folder.iterdir()):
        if item.is_file(): z.write(item, item.name)
print(json.dumps({'pdf': str(output), 'pages': 6, 'pdfBytes': output.stat().st_size, 'zip': str(archive), 'screenshots': len(shots)}))
