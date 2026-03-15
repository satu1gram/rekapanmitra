# Prompt: Redesign Halaman Tambah Order (Full Flow)
> Target: Antigravity / Windsurf — React + Tailwind + Supabase

---

## KONTEKS

Refactor komponen halaman **Tambah Order** yang sudah ada. Ubah menjadi flow 3 langkah (stepper) dengan UI yang lebih padat, informatif, dan mobile-first. Jangan hapus logika Supabase yang sudah ada — hanya refactor tampilan dan struktur komponen.

---

## DESIGN SYSTEM (WAJIB DIIKUTI)

```
Warna:
  --green-primary : #059669   → tombol aksi utama, harga, profit, status aktif
  --navy-dark     : #1E293B   → judul, teks utama, summary bar, checkout button
  --bg-page       : #F4F6F9   → background layar utama
  --bg-card       : #FFFFFF   → background semua kartu
  --bg-green-soft : #F0FDF4   → state terpilih, chip aktif
  --border-green  : #059669   → border kartu terpilih
  --text-secondary: #64748B   → label sekunder, subteks
  --text-muted    : #94A3B8   → placeholder, hint, label uppercase
  --yellow-accent : #FBBF24   → badge Favorit, ikon cart
  --red-danger    : #DC2626   → aksi hapus, swipe delete

Font: Plus Jakarta Sans (sudah di-import) — fallback: system sans-serif
Border radius kartu: 18–20px
Box shadow kartu: 0 2px 8px rgba(30,41,59,0.06)
```

---

## STRUKTUR KOMPONEN

Buat atau refactor file berikut:

```
src/
  components/
    order/
      TambahOrderFlow.tsx        ← komponen induk, handle state step
      StepIndicator.tsx          ← progress bar 3 langkah
      step1/
        PilihPelanggan.tsx       ← layout step 1
        CustomerChips.tsx        ← chip horizontal terakhir & favorit
        CustomerCard.tsx         ← kartu pelanggan di list
      step2/
        PilihProduk.tsx          ← layout step 2
        ProductCard.tsx          ← kartu produk dengan qty control
        OrderSummaryBar.tsx      ← summary total + profit
      step3/
        KonfirmasiOrder.tsx      ← review sebelum simpan
      shared/
        BottomActionBar.tsx      ← bottom bar konsisten lintas step
```

---

## STEP INDICATOR

Komponen `StepIndicator.tsx`:
- 3 step: **Pelanggan → Produk → Konfirmasi**
- State per dot: `idle` | `active` | `done`
- `done`: lingkaran hijau #059669 + ikon centang putih
- `active`: lingkaran hijau + ring 4px #D1FAE5
- `idle`: lingkaran abu #E2E8F0 + angka abu
- Garis penghubung antar step: hijau jika sudah done, abu jika belum
- Label di bawah dot, font 11px semibold uppercase

```tsx
interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
}
```

---

## STEP 1 — PILIH PELANGGAN

### Layout `PilihPelanggan.tsx`

```
[← Back]                    [Langkah 1 / 3]
Pilih Pelanggan              ← h1, 28px, font-weight 800

[🔍 Cari nama pelanggan...          ] [+]
   ← input search, flex-1              ← tombol hijau #059669, radius 12px

Terakhir & Favorit           ← section label 12px uppercase muted
[ Juan · Agen ] [ Udin · Satuan ★ ] [ Bari · Satuan ★ ]
  ← horizontal scroll chips, overflow-x: auto, no scrollbar

Semua Pelanggan              ← section label
[ Avatar | Nama           | Tag  Tag | ✓ ]
[ Avatar | Subtipe        | N order  |   ]
  ← list vertikal, gap 10px

──────────────────────────────
  Juan · Agen           [ Pilih Produk → ]
──────────────────────────────
```

### Komponen `CustomerChips.tsx`

Props:
```tsx
interface CustomerChipsProps {
  customers: Customer[]        // hanya yang tag 'terakhir' atau favorit
  selectedId: string | null
  onSelect: (id: string) => void
}
```

Style chip:
- Default: `bg-white border-2 border-[#E2E8F0] rounded-full px-3 py-2`
- Selected: `border-[#059669] bg-[#F0FDF4]`
- Isi: avatar bulat 28px + nama + tipe singkat + dot kuning jika favorit
- Avatar selected: bg #059669, teks putih

### Komponen `CustomerCard.tsx`

Props:
```tsx
interface CustomerCardProps {
  customer: Customer
  isSelected: boolean
  onSelect: (id: string) => void
}
```

Style kartu:
- Default: `bg-white rounded-[18px] p-4 border-2 border-transparent shadow-sm`
- Selected: `border-[#059669] bg-[#F0FDF4]`
- Kiri: avatar kotak 46px, radius 14px — selected: bg hijau teks putih
- Tengah: nama (15px bold), tipe (12px muted), row tag + jumlah order
- Kanan: ikon centang lingkaran hijau, `opacity-0` → `opacity-100` saat selected

**Tags:**
- `Terakhir` → badge hijau muda
- `Favorit` → badge kuning + ikon bintang kecil
- `Agen` → badge biru muda
- `Satuan` → badge oranye muda

### Data Supabase untuk Step 1

Query yang dibutuhkan (gunakan hook yang sudah ada, hanya tambahkan field):

```ts
// Ambil semua pelanggan milik mitra yang login
const { data: customers } = await supabase
  .from('customers')
  .select('id, name, customer_type, is_favorite, last_ordered_at, total_orders')
  .eq('mitra_id', mitraId)
  .order('last_ordered_at', { ascending: false })

// Tentukan tag di frontend:
// - is_favorite === true → chip favorit
// - last_ordered_at paling recent → chip 'Terakhir' (index 0 setelah sort)
```

---

## STEP 2 — PILIH PRODUK

### Layout `PilihProduk.tsx`

```
[← Back]                    [Langkah 2 / 3]
Pilih Produk                 ← h1, 28px, 800

[ Pelanggan: Juan · Agen              Ganti ]
  ← kartu ringkas pelanggan terpilih, bg #F0FDF4, border hijau

[ emoji | NAMA PRODUK      | − 0 + ]
         Subtipe
         Rp 195.000
  ← list produk, gap 14px, swipe-to-delete di mobile

[ + Tambah Produk Lain ]    ← dashed border button

Ongkos Kirim:                               Rp 0
──────────────────────────────────────────────
  Rp 390.000                    [ Review Order → ]
  +Profit Rp 90.000 (chip)
──────────────────────────────────────────────
```

### Komponen `ProductCard.tsx`

Props:
```tsx
interface ProductCardProps {
  product: Product
  quantity: number
  onChangeQty: (id: string, delta: number) => void
  onDelete: (id: string) => void
}
```

Style:
- Default: `bg-white rounded-[20px] p-4 border-2 border-transparent shadow-sm flex items-center gap-4`
- Qty > 0: `border-[#059669] bg-[#F0FDF4]`
- Gambar/emoji area: 68×68px, radius 16px, bg `#F0FDF4`
- Tombol minus: bulat 30px, bg `#F1F5F9`, teks abu
- Tombol plus: bulat 30px, bg `#059669`, teks putih
- Swipe-to-delete: translasi -80px reveal merah `#FEE2E2` di belakang kartu

### Komponen `OrderSummaryBar.tsx`

Props:
```tsx
interface OrderSummaryBarProps {
  totalHarga: number
  totalProfit: number
  onNext: () => void
  disabled: boolean
}
```

Tampilan:
- Wrapper `bg-white border-t border-[#F1F5F9] px-6 py-4`
- Kiri: label "Total Harga" (12px muted) + nilai (24px 800) + chip profit hijau
- Kanan: tombol `bg-[#1E293B]` rounded-full, hover `bg-[#059669]`, dengan ikon cart kuning
- Disabled: `bg-[#E2E8F0] text-[#94A3B8]` jika belum ada produk dipilih

### Data Supabase untuk Step 2

```ts
// Ambil produk milik mitra
const { data: products } = await supabase
  .from('products')
  .select('id, name, product_type, selling_price, modal_price, stock_qty, image_url')
  .eq('mitra_id', mitraId)
  .gt('stock_qty', 0)
  .order('total_sold', { ascending: false })

// State qty dikelola lokal di frontend dengan useReducer atau useState map:
// { [productId]: number }
```

---

## STEP 3 — KONFIRMASI ORDER

Layout ringkas review sebelum simpan:

```
Detail Order                 ← h1

[ Info Pesanan ]
  Pelanggan   : Juan · Agen
  Tanggal     : 14 Mar 2026
  Status      : [ BARU ]

[ Rincian Produk ]           ← kartu per item
  STEFFI          1 × Rp 195.000      Rp 195.000
                                      +Rp 45.000
  ─────────────────────────────────────────
  [ TOTAL      Rp 195.000   Profit +Rp 45.000 ]  ← navy bar

[ ← Edit Produk ]   [ Simpan Order ✓ ]
```

### Submit ke Supabase

```ts
// Buat order baru
const { data: order } = await supabase
  .from('orders')
  .insert({
    mitra_id: mitraId,
    customer_id: selectedCustomer.id,
    order_date: selectedDate,
    status: 'baru',
    total_harga: totalHarga,
    total_profit: totalProfit,
  })
  .select()
  .single()

// Insert order items
const orderItems = cartItems.map(item => ({
  order_id: order.id,
  product_id: item.product_id,
  quantity: item.quantity,
  selling_price: item.selling_price,
  modal_price: item.modal_price,
  subtotal: item.quantity * item.selling_price,
}))

await supabase.from('order_items').insert(orderItems)
```

---

## STATE MANAGEMENT (`TambahOrderFlow.tsx`)

```tsx
interface OrderFlowState {
  currentStep: 1 | 2 | 3
  selectedCustomer: Customer | null
  orderDate: string                    // default: today ISO string
  cart: Record<string, number>         // { [productId]: qty }
}

// Computed values (useMemo):
// - cartItems: Product[] dengan qty > 0
// - totalHarga: sum(qty * selling_price)
// - totalProfit: sum(qty * (selling_price - modal_price))
// - totalQty: sum(qty)
```

Navigasi antar step:
- Step 1 → 2: hanya jika `selectedCustomer !== null`
- Step 2 → 3: hanya jika `totalQty > 0`
- Step 3 → submit: panggil fungsi `handleSubmitOrder()`

---

## SUCCESS STATE

Setelah order tersimpan, tampilkan dalam area konten yang sama:

```
[ ✓ ikon lingkaran hijau 72px ]
Order Tersimpan!
Untuk Juan · senilai Rp 195.000
[ Profit card: +Rp 45.000 ]
[ + Tambah Order Lain ]   ← reset state ke step 1
```

---

## CATATAN IMPLEMENTASI

1. **Jangan** buat file CSS baru — gunakan Tailwind utility classes saja. Untuk nilai di luar preset Tailwind (misal `rounded-[18px]`, `border-[#059669]`), gunakan arbitrary values.
2. Gunakan `useCallback` untuk handler `onChangeQty` dan `onSelect` agar tidak re-render tidak perlu.
3. Swipe-to-delete di `ProductCard` gunakan `onTouchStart` / `onTouchEnd` dengan `translateX` via inline style + `transition-transform duration-200`.
4. Bottom action bar (`BottomActionBar`) harus **sticky bottom** dengan `sticky bottom-0 bg-white z-10`.
5. Semua angka Rupiah format: `new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)`
6. Komponen ini hanya digunakan dalam modal/sheet yang sudah ada — tidak perlu buat routing baru.