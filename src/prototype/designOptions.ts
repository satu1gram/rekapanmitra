export type DesignTheme = 'current' | 'calm' | 'bold' | 'warm';
export const DESIGN_OPTIONS = [
  { id: 'calm', code: 'A', name: 'Calm Finance', recommended: true, tagline: 'Bersih, tenang, angka mudah dibaca.',
    description: 'Surface putih dan mint ringan, tipografi tegas, tombol emerald, serta ringkasan yang langsung menunjukkan omzet dan hasil usaha.',
    bestFor: 'Mitra 40+ yang ingin cepat memahami angka dan mencatat tanpa banyak distraksi.',
    tradeoff: 'Ekspresi visual lebih tenang; tidak seagresif aplikasi fintech.',
    palette: ['#087f60', '#173b32', '#f5f8f6', '#ffffff'] },
  { id: 'bold', code: 'B', name: 'Bold Fintech', recommended: false, tagline: 'Kontras kuat, modern, berorientasi angka.',
    description: 'Navy dan biru elektrik, aksen lime pada tindakan utama, angka lebih besar, kartu lebih padat dan sudut lebih tegas.',
    bestFor: 'Penjual aktif yang sering memantau transaksi dan menyukai tampilan finansial yang ekspresif.',
    tradeoff: 'Informasi terasa lebih padat; perlu memastikan nyaman untuk pengguna yang baru belajar.',
    palette: ['#3058ed', '#14244a', '#d7f86b', '#f3f5fb'] },
  { id: 'warm', code: 'C', name: 'Warm Companion', recommended: false, tagline: 'Ramah, dekat, mulai dari hal yang perlu dikerjakan.',
    description: 'Cream dan sage, kartu membulat, bahasa pendamping, serta tugas yang perlu diperiksa tampil sebelum ringkasan finansial.',
    bestFor: 'Mitra pemula yang lebih terbantu oleh daftar tindakan daripada dashboard angka di urutan pertama.',
    tradeoff: 'Lebih banyak ruang dan scroll untuk mencapai laporan finansial.',
    palette: ['#486344', '#2d3829', '#faf7f0', '#e9dfca'] },
] as const;
