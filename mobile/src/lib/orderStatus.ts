export const STATUS_LABEL: Record<string, { label: string; tone: 'success' | 'warning' | 'info' | 'neutral' }> = {
  selesai: { label: 'Selesai', tone: 'success' },
  pending: { label: 'Belum selesai', tone: 'warning' },
  // Status lama dari web. Aplikasi mobile tidak lagi memakainya; order itu dianggap belum selesai.
  terkirim: { label: 'Belum selesai', tone: 'warning' },
};

/** Order yang masih berjalan. 'terkirim' hanya ada pada order lama dan diperlakukan sama dengan 'pending'. */
export const isOpenStatus = (status: string) => status === 'pending' || status === 'terkirim';
