export const KELUHAN_TAG_MAP: Record<string, string[]> = {
    "Susah Tidur": ["susah_tidur", "insomnia"],
    "Nyeri Sendi": ["nyeri_sendi", "asam_urat", "rematik"],
    "Imun Lemah": ["imun", "daya_tahan", "pemulihan"],
    "Mata Lelah": ["mata"],
    "Gula Darah Tinggi": ["gula_darah", "diabetes"],
    "Anak Susah Makan": ["nafsu_makan", "anak"],
    "Rambut Rontok": ["rambut"],
    "Kulit Kusam": ["kulit", "flek"],
    "Sering Flu": ["flu"],           // hanya 'flu', bukan 'imun' — cegah cross-match BP umum
    "Kurang Fokus": ["fokus", "konsentrasi"],
    "Flek Hitam": ["flek", "kulit"],
    "Kurang Stamina": ["stamina", "energi"],
    "Hormon Wanita": ["haid", "hormon", "wanita"],
    "Haid Tidak Teratur": ["haid", "hormon", "wanita"],
};
