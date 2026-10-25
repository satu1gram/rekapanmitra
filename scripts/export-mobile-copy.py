"""Export the compact Rekapan Mitra copy review from browser screenshots."""
import json
import os
import subprocess
import zipfile
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

folder = Path(os.environ.get('COPY_ARTIFACTS', '/workspace/artifacts/rekapan-mobile-copy'))
output = folder.parent / 'Rekapan-Mitra-Mobile.pdf'
font_root = Path('/usr/share/fonts/truetype/dejavu')
pdfmetrics.registerFont(TTFont('Rekapan', str(font_root / 'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('Rekapan-Bold', str(font_root / 'DejaVuSans-Bold.ttf')))
ink, muted = '#14244a', '#63728c'
W, H = 1260, 1480
c = canvas.Canvas(str(output), pagesize=(W, H), pageCompression=1)
c.setTitle('Rekapan Mitra · Copy Mobile'); c.setAuthor('Rekapan Mitra BP')

def text(value, x, y, size=12, bold=False, color=ink):
    c.setFont('Rekapan-Bold' if bold else 'Rekapan', size)
    c.setFillColor(HexColor(color)); c.drawString(x, y, value)

def phone(phase, screen, x, y, width, radius=20):
    height = width * 844 / 390
    c.setFillColor(HexColor('#dfe5ef'))
    c.roundRect(x - 2, y - 3, width + 4, height + 6, radius + 2, fill=1, stroke=0)
    c.saveState(); clip = c.beginPath(); clip.roundRect(x, y, width, height, radius)
    c.clipPath(clip, fill=0, stroke=0)
    c.drawImage(str(folder / phase / f'{screen}.png'), x, y, width=width, height=height)
    c.restoreState()

def background(width, height):
    c.setFillColor(HexColor('#f2f4f9')); c.rect(0, 0, width, height, fill=1, stroke=0)

background(W, H)
text('Rekapan Mitra', 36, H - 54, 34, True)
text('Copy ringkas · Bold Fintech · React + Capacitor', 36, H - 82, 13, color=muted)
text('Beranda · Riwayat · Stok · Akun', 36, H - 105, 11, color=muted)
shots = [('home', 'Beranda'), ('orders', 'Riwayat'), ('stock', 'Stok'), ('account', 'Akun'),
         ('order-customer', 'Tambah Order'), ('order-products', 'Rincian Produk'), ('restock', 'Restok Barang'), ('payment', 'Pembayaran')]
for i, (screen, label) in enumerate(shots):
    width = 279; height = width * 844 / 390
    x = 36 + i % 4 * 303; top = H - 147 - i // 4 * (height + 65)
    text(f'{i + 1:02d}  {label}', x + 3, top + 19, 12, True)
    phone('after', screen, x, top - height, width)
text('Prototipe · data contoh · Tidak terhubung ke produksi', 36, 23, 10, color=muted)
c.showPage()

W, H = landscape(A4); c.setPageSize((W, H)); background(W, H)
text('Sebelum dan Sesudah', 28, H - 35, 21, True)
text('Istilah Rekapan Mitra, bantuan yang bisa dibuka, tombol singkat.', 28, H - 56, 10, color=muted)
for i, (phase, screen, label) in enumerate([
    ('before', 'home', 'Sebelum · Beranda'), ('after', 'home', 'Sesudah · Beranda'),
    ('before', 'payment', 'Sebelum · Pembayaran'), ('after', 'payment', 'Sesudah · Pembayaran'),
]):
    x = 28 + i * 200
    text(label, x, H - 88, 10, True)
    phone(phase, screen, x, 69, 184, 16)
text('Data sintetis yang sama. Perbandingan visual, bukan studi partisipan manusia.', 28, 28, 9, color=muted)
c.showPage(); c.save()
subprocess.run(['pdftoppm', '-f', '1', '-singlefile', '-scale-to', '1800', '-png', str(output), str(output.with_suffix(''))], check=True, stdout=subprocess.DEVNULL)
archive = folder.parent / 'Rekapan-Mitra-Mobile-Screens.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for directory in ['after', 'full', 'finance', 'multi']:
        for file in sorted((folder / directory).rglob('*')):
            if file.is_file(): z.write(file, str(file.relative_to(folder)))
print(json.dumps({'pdf': str(output), 'png': str(output.with_suffix('.png')), 'screens': str(archive)}))
