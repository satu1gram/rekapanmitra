export const STATUS_LABEL: Record<string, { label: string; tone: 'success' | 'warning' | 'info' | 'neutral' }> = {
  selesai: { label: 'Selesai', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  terkirim: { label: 'Terkirim', tone: 'info' },
};
