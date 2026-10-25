"""Export the financial redesign and its measured baseline. Requires ReportLab."""
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

folder = Path(os.environ.get('FINANCE_ARTIFACTS', '/workspace/artifacts/mula-finance-usability'))
manifest = json.loads((folder / 'manifest.json').read_text())
output = folder.parent / 'MULA-Finance-Redesign.pdf'
fonts = Path(os.environ.get('DESIGN_FONT_ROOT', '/usr/share/fonts/truetype/dejavu'))
pdfmetrics.registerFont(TTFont('Mula', str(fonts / 'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('Mula-Bold', str(fonts / 'DejaVuSans-Bold.ttf')))
ink, muted, blue, lime = '#14244a', '#63728c', '#3058ed', '#d7f86b'
W, H = 1260, 1480
c = canvas.Canvas(str(output), pagesize=(W, H), pageCompression=1)
c.setTitle('MULA — Uang lebih jelas · Redesign berbasis evidence'); c.setAuthor('Rekapan Mitra BP')
body = ParagraphStyle('body', fontName='Mula', fontSize=9, leading=14, textColor=HexColor(muted))
small = ParagraphStyle('small', fontName='Mula', fontSize=8, leading=12, textColor=HexColor(muted))
shots = {shot['screen']: shot for shot in manifest['screenshots']}
shots['baseline'] = {'file': 'baseline-home.png', 'route': '/home'}
titles = {'home': 'Uang & pekerjaan harian', 'lesson': 'Kenapa uang dan laba berbeda?', 'payment': 'Pembayaran tambahan', 'bills': 'Tagihan yang bisa dituntaskan', 'profit': 'Modal dan laba dipisahkan', 'restock-cost': 'Belanja stok berbeda', 'live-profit': 'Biaya langsung terlihat', 'unknown-cost': 'Nominal tidak ditebak', 'baseline': 'Versi sebelumnya'}

def text(value, x, y, width, style=body):
    paragraph = Paragraph(value, style); _, height = paragraph.wrap(width, 1200)
    paragraph.drawOn(c, x, y - height)

def phone(screen, x, y, width, radius=19):
    height = width * 844 / 390
    c.setFillColor(HexColor('#dfe5ef')); c.roundRect(x - 2, y - 3, width + 4, height + 6, radius + 2, fill=1, stroke=0)
    c.saveState(); clip = c.beginPath(); clip.roundRect(x, y, width, height, radius); c.clipPath(clip, fill=0, stroke=0)
    c.drawImage(str(folder / shots[screen]['file']), x, y, width=width, height=height)
    c.restoreState()

def footer(width, number):
    c.setStrokeColor(HexColor('#dfe5ef')); c.line(28, 28, width - 28, 28)
    c.setFont('Mula', 8); c.setFillColor(HexColor(muted))
    c.drawString(28, 15, 'MULA × Mitra BP · Prototipe Bold Fintech · 25 Oktober 2026 WIB · Data sintetis')
    c.drawRightString(width - 28, 15, str(number))

def background(width, height, title, subtitle):
    c.setFillColor(HexColor('#f3f5fa')); c.rect(0, 0, width, height, fill=1, stroke=0)
    c.setFont('Mula-Bold', 19); c.setFillColor(HexColor(ink)); c.drawString(28, height - 34, title)
    text(subtitle, 28, height - 46, width - 56)

c.setFillColor(HexColor('#f1f3f7')); c.rect(0, 0, W, H, fill=1, stroke=0)
c.setFont('Mula-Bold', 34); c.setFillColor(HexColor(ink)); c.drawString(36, H - 54, 'MULA · Uang lebih jelas')
c.setFont('Mula', 13); c.setFillColor(HexColor(muted)); c.drawString(36, H - 80, 'Uang diterima, tagihan, modal produk dan laba dipisahkan agar mudah ditindaklanjuti.')
c.setFont('Mula', 10); c.drawString(36, H - 102, 'Skenario berurutan: nominal berubah setelah order baru dan pembayaran dicatat. Semua data sintetis.')
for i, color in enumerate([ink, blue, lime, '#ffffff']):
    c.setFillColor(HexColor(color)); c.roundRect(W - 188 + i * 37, H - 68, 28, 28, 9, fill=1, stroke=0)
board = ['home', 'lesson', 'payment', 'bills', 'profit', 'restock-cost', 'live-profit', 'unknown-cost']
iw = 279; ih = iw * 844 / 390
for i, screen in enumerate(board):
    x = 36 + i % 4 * 303; top = H - 147 - i // 4 * (ih + 65)
    c.setFont('Mula-Bold', 11); c.setFillColor(HexColor(ink)); c.drawString(x + 3, top + 19, f'{i + 1:02d}  {titles[screen]}')
    phone(screen, x, top - ih, iw, 25)
footer(W, 1); c.showPage()

W, H = landscape(A4); c.setPageSize((W, H))
background(W, H, 'Sebelum dan sesudah: perubahan yang dapat diperiksa', 'Dasar: prioritas langsung pengguna, audit aturan, dan walkthrough otomatis. Belum ada studi partisipan manusia.')
for x, screen, title in [(42, 'baseline', 'Sebelum · f2f8319'), (310, 'home', 'Sesudah · fokus keuangan')]:
    c.setFont('Mula-Bold', 12); c.setFillColor(HexColor(ink)); c.drawString(x, H - 96, title)
    phone(screen, x + 10, 50, 190, 17)
pos = next(row for row in manifest['positions'] if row['width'] == 390)
x = 580
c.setFont('Mula-Bold', 12); c.setFillColor(HexColor(ink)); c.drawString(x, H - 96, 'Prioritas dari pengguna')
text('“Uang masuk, tagihan, modal, dan laba membingungkan.”', x, H - 112, 225)
c.setFont('Mula-Bold', 12); c.setFillColor(HexColor(ink)); c.drawString(x, H - 188, 'Yang berubah')
text(f'Shortcut draf sebelumnya y=842, di bawah navigasi y=768. Kini y={pos["taskTop"]:.0f}–{pos["taskBottom"]:.0f}, dapat dipakai tanpa scroll pada viewport 390 × 844.', x, H - 204, 225)
text('Satu ketukan membuka catat penjualan. Empat kartu menjelaskan arti uang; contoh order menghubungkan pembayaran, tagihan, modal dan laba.', x, H - 294, 225)
c.setFont('Mula-Bold', 12); c.setFillColor(HexColor(ink)); c.drawString(x, H - 394, 'Batas evidence')
text('Persona mitra adalah simulasi. Akses sumber publik BP ditolak proxy. Temuan tidak disebut sebagai wawancara atau prevalensi keluhan seluruh mitra.', x, H - 410, 225)
footer(W, 2); c.showPage()

pages = [
    ('Empat makna uang, satu contoh yang mudah diikuti', 'Pembayaran mengurangi tagihan. Modal dan laba bukan uang yang otomatis sudah diterima.', ['home', 'lesson', 'payment']),
    ('Tagihan dan modal dapat ditelusuri', 'Tagihan lintas periode tetap terlihat. Nilai pembelian pemasok tidak dikurangi dua kali dalam perhitungan laba.', ['bills', 'profit', 'restock-cost']),
    ('Biaya yang jelas, hasil yang dapat dipercaya', 'Bug biaya 20rb + 5rb diperbaiki dari Rp25 menjadi Rp25.000. Biaya yang belum diketahui tetap kosong dan memblokir konfirmasi.', ['live-profit', 'unknown-cost']),
]
for number, (title, subtitle, screens) in enumerate(pages, 3):
    background(W, H, title, subtitle); cell = (W - 56) / 3
    for i, screen in enumerate(screens):
        x = 28 + i * cell
        c.setFont('Mula-Bold', 10); c.setFillColor(HexColor(ink)); c.drawString(x + 7, H - 94, titles[screen])
        phone(screen, x + (cell - 190) / 2, 55, 190, 15)
    if len(screens) == 2:
        x = 28 + 2 * cell + 8
        c.setFont('Mula-Bold', 12); c.setFillColor(HexColor(ink)); c.drawString(x, H - 94, 'Verifikasi yang dilakukan')
        text('93 tes aplikasi · 4 guard build · 54 layar · alur multiproduk dan keuangan otomatis. Tidak ada page error atau permintaan eksternal pada pengujian.', x, H - 112, cell - 24)
        text('Sesudah menerima Rp100.000: pembayaran bertambah Rp100.000 dan tagihan turun Rp100.000; modal dan laba tetap. Draf tanpa pembeli tidak menambah penjualan.', x, H - 209, cell - 24)
        text('Periode mengikuti bulan pesanan. Prototipe belum menyediakan saldo rekening, rekonsiliasi bank, atau ledger transfer harian. Uji mitra manusia masih dibutuhkan.', x, H - 316, cell - 24)
        c.setFont('Mula-Bold', 12); c.setFillColor(HexColor(ink)); c.drawString(x, H - 420, 'Coba versi interaktif')
        text('rekapanmitra-mobile-demo.pages.dev/<br/>#/reports?view=learn', x, H - 438, cell - 24, small)
        c.linkURL('https://rekapanmitra-mobile-demo.pages.dev/#/reports?view=learn', (x, H - 488, W - 28, H - 433), relative=0, thickness=0)
    footer(W, number); c.showPage()
c.save()
archive = folder.parent / 'MULA-Finance-Usability-Screens.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for item in sorted(folder.iterdir()):
        if item.is_file(): z.write(item, item.name)
print(json.dumps({'pdf': str(output), 'pages': 5, 'screenshots': len(manifest['screenshots']), 'bytes': output.stat().st_size, 'zip': str(archive)}))
