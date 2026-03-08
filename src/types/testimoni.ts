// src/types/testimoni.ts

export interface Testimoni {
    id: string;
    content: string;
    sender: string;
    created_at: string;
    foto_url: string | null;
    is_testimoni: boolean;
    is_featured: boolean;
    nama_pengirim: string | null;
    kota: string | null;
    produk: string | null;
    bintang: number;
    status: string;
}

// Helper: tampilkan nama yang paling representatif
export function getDisplayName(t: Testimoni): string | null {
    const name = t.nama_pengirim || t.sender;
    if (!name || name === 'QM - Testimoni BP Group' || name === 'Pengguna Anonim') {
        return null;
    }
    return name;
}

// Helper: generate inisial untuk avatar fallback
export function getInitials(name: string): string {
    if (!name) return '👤';
    return name
        .split(' ')
        .slice(0, 2)
        .map(n => n[0]?.toUpperCase() || '')
        .join('');
}
