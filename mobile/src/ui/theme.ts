export const colors = {
  brand: '#0A7A52',
  brandDark: '#075C3E',
  brandSoft: '#E3F3EC',
  brandTint: '#F1FAF5',
  brandBorder: '#9FD1B9',
  bg: '#F2F2F7',
  card: '#FFFFFF',
  text: '#1C1C1E',
  textMuted: '#6C6C70',
  textSubtle: '#8A8A8E',
  /** Field label: darker than a placeholder, lighter than typed text. */
  label: '#3A3A3C',
  /** Placeholder / example text in an empty field: clearly lighter than a label or a typed value. */
  placeholder: '#AEAEB2',
  border: '#E5E5EA',
  borderStrong: '#C6C6C8',
  fill: '#F2F2F7',
  danger: '#D70015',
  dangerSoft: '#FDECEA',
  warning: '#C93400',
  warningSoft: '#FFF1E6',
  info: '#0058D0',
  infoSoft: '#E8F1FF',
  violet: '#5145CD',
  violetSoft: '#F1EEFF',
  white: '#FFFFFF',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

export const type = {
  // Density follows the Gojek reference screens: 14 body, 15–16 row titles, 18–20 page titles.
  hero: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.4 },
  title: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.2 },
  heading: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.2 },
};

export const shadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

/** Room a tab screen leaves at the bottom for the floating tab bar (bar 64 + gap + home indicator). */
export const TAB_BAR_SPACE = 120;

/**
 * Supporting colours. Brand green stays the primary colour (buttons, hero cards, active tab); these
 * soft pairs are only for small surfaces: icon tiles, avatars, status pills and stat tiles.
 * Each `fg` reads at 4.6:1 or better on its own `bg` and on white.
 */
export const accents = {
  green: { fg: '#0A7A52', bg: '#E3F3EC' },
  blue: { fg: '#1F5FBF', bg: '#E7EFFC' },
  amber: { fg: '#A55400', bg: '#FFF1DE' },
  violet: { fg: '#6247C8', bg: '#EFEBFD' },
  teal: { fg: '#0B7480', bg: '#E0F4F5' },
  rose: { fg: '#B4234F', bg: '#FCEAF0' },
} as const;
export type Accent = keyof typeof accents;

/** What each part of the app is coloured with, so the same feature looks the same everywhere. */
export const featureAccent = {
  order: 'green',
  restock: 'teal',
  chat: 'violet',
  history: 'blue',
  customers: 'blue',
  finance: 'amber',
  target: 'violet',
  store: 'teal',
  expense: 'rose',
} as const satisfies Record<string, Accent>;

const AVATAR_ACCENTS: Accent[] = ['green', 'blue', 'violet', 'teal', 'amber', 'rose'];
/** Stable avatar colour per name, so a customer always has the same colour. */
export function accentForName(name: string): Accent {
  let h = 0;
  for (const ch of name.trim().toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_ACCENTS[h % AVATAR_ACCENTS.length];
}
