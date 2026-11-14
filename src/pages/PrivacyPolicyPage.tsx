import { useEffect } from "react";

// Kontak pengelola. Isi VITE_PRIVACY_CONTACT_EMAIL saat build agar tampil di halaman ini.
const CONTACT_EMAIL = (import.meta.env.VITE_PRIVACY_CONTACT_EMAIL as string | undefined)?.trim();
const UPDATED = "14 November 2026";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Tentang Rekapan Mitra",
    body: (
      <p>
        Rekapan Mitra adalah aplikasi pencatatan order, stok, pelanggan, dan keuangan untuk mitra penjual produk. Tersedia sebagai aplikasi iOS, aplikasi Android, dan
        aplikasi web di mitrabp.biz.id. Ketiganya memakai satu akun dan satu database, jadi data yang sama muncul di semua perangkat.
      </p>
    ),
  },
  {
    title: "2. Data yang kami simpan",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li><b>Akun:</b> nama, alamat email, dan kata sandi (disimpan terenkripsi oleh penyedia autentikasi, kami tidak bisa membacanya).</li>
        <li><b>Profil usaha:</b> nomor WhatsApp, lokasi, level mitra, harga modal per botol, dan target bulanan.</li>
        <li><b>Data usaha yang kamu catat:</b> order, produk dalam order, pelanggan (nama, nomor telepon, kota atau alamat bila diisi), stok masuk dan keluar, biaya, pemasukan lain, serta pengaturan toko online.</li>
        <li><b>Foto bukti transfer atau nota</b> yang kamu unggah dari kamera atau galeri.</li>
        <li><b>Teks yang kamu kirim ke fitur AI</b> (isi order dari chat dan konsultasi).</li>
        <li><b>Data teknis dasar</b> yang diperlukan agar aplikasi berjalan, misalnya token sesi masuk.</li>
      </ul>
    ),
  },
  {
    title: "3. Izin pada perangkat",
    body: (
      <p>
        Aplikasi hanya meminta akses <b>kamera</b> dan <b>galeri foto</b>, dan hanya saat kamu memilih melampirkan bukti transfer atau nota. Kami tidak meminta lokasi,
        kontak, mikrofon, maupun pelacakan lintas aplikasi, dan tidak menampilkan iklan.
      </p>
    ),
  },
  {
    title: "4. Cara kami memakai data",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Menampilkan dan menghitung order, stok, laba, dan target milikmu.</li>
        <li>Menyinkronkan data antar perangkat dan menjaga akunmu tetap aman.</li>
        <li>Menjalankan fitur AI atas permintaanmu.</li>
        <li>Mengirim email yang diperlukan, yaitu verifikasi akun dan reset kata sandi.</li>
      </ul>
    ),
  },
  {
    title: "5. Pihak ketiga yang memproses data",
    body: (
      <>
        <p className="mb-2">Kami tidak menjual datamu. Data diproses oleh penyedia layanan berikut hanya untuk menjalankan aplikasi:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Supabase</b> untuk autentikasi, database, dan penyimpanan foto bukti.</li>
          <li><b>Penyedia model AI</b> menerima teks yang kamu kirim ke fitur "Isi order dari chat" dan konsultasi AI. Hindari menulis data sensitif di fitur ini.</li>
          <li><b>Telegram</b> hanya bila kamu sendiri menghubungkan bot Telegram ke akunmu.</li>
        </ul>
      </>
    ),
  },
  {
    title: "6. Toko online publik",
    body: (
      <p>
        Bila kamu mengaktifkan halaman toko (mitrabp.biz.id/toko/nama-tokomu), nama toko, pesan sambutan, dan info pembayaran yang kamu isi di pengaturan toko dapat dilihat
        siapa saja yang memiliki tautannya. Data lain tidak ditampilkan. Kamu bisa menonaktifkan toko kapan saja.
      </p>
    ),
  },
  {
    title: "7. Penyimpanan dan keamanan",
    body: (
      <p>
        Data dikirim lewat koneksi terenkripsi (HTTPS) dan disimpan di database dengan aturan akses per pengguna, sehingga akunmu hanya dapat membaca dan mengubah
        datamu sendiri. Tidak ada sistem yang sepenuhnya bebas risiko, tetapi kami menjaga akses seketat mungkin.
      </p>
    ),
  },
  {
    title: "8. Menghapus akun dan data",
    body: (
      <>
        <p className="mb-2">
          Kamu bisa menghapus akun kapan saja dari aplikasi: <b>Akun → Hapus akun</b>, lalu ketik konfirmasi. Penghapusan berlangsung seketika dan permanen. Yang ikut terhapus:
          profil, pelanggan, order, stok, biaya, target, pengaturan toko, dan semua foto bukti. Data tidak dapat dikembalikan.
        </p>
        <p>
          Hal yang sama berlaku di aplikasi web. Kamu juga dapat meminta penghapusan atau salinan datamu lewat kontak di bawah.
        </p>
      </>
    ),
  },
  {
    title: "9. Anak-anak",
    body: <p>Aplikasi ini ditujukan untuk pelaku usaha dewasa. Kami tidak dengan sengaja mengumpulkan data anak di bawah 13 tahun.</p>,
  },
  {
    title: "10. Perubahan kebijakan",
    body: <p>Bila kebijakan ini berubah secara berarti, kami memperbarui tanggal di bagian atas halaman dan memberi tahu lewat aplikasi.</p>,
  },
  {
    title: "11. Kontak",
    body: CONTACT_EMAIL ? (
      <p>Pertanyaan tentang privasi atau permintaan data: <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    ) : (
      <p>Pertanyaan tentang privasi atau permintaan data dapat disampaikan lewat menu Akun di aplikasi.</p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Kebijakan Privasi — Rekapan Mitra";
    return () => { document.title = prev; };
  }, []);

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10">
      <article className="mx-auto max-w-2xl rounded-2xl bg-background p-6 shadow-sm sm:p-10">
        <header className="mb-8 border-b pb-6">
          <p className="text-sm font-semibold text-primary">Rekapan Mitra</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Kebijakan Privasi</h1>
          <p className="mt-2 text-sm text-muted-foreground">Terakhir diperbarui {UPDATED}</p>
        </header>
        <div className="space-y-7 text-[15px] leading-relaxed text-foreground/90">
          {sections.map(s => (
            <section key={s.title}>
              <h2 className="mb-2 text-lg font-semibold text-foreground">{s.title}</h2>
              {s.body}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
