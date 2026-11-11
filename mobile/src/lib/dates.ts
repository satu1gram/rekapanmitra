export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export interface MonthRef {
  year: number;
  /** 0-indexed, same as Date.getMonth() and monthly_targets.month */
  month: number;
}

export function currentMonth(now = new Date()): MonthRef {
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function shiftMonth({ year, month }: MonthRef, delta: number): MonthRef {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function monthLabel({ year, month }: MonthRef): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

/** Timestamps parse normally; a plain date ("2026-11-03", e.g. expense_date) is a local calendar day, not UTC midnight. */
export function parseDateLike(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
}

/** Same rule as the web dashboard: the device's local calendar month. */
export function isInMonth(value: string, { year, month }: MonthRef): boolean {
  const d = parseDateLike(value);
  return d.getFullYear() === year && d.getMonth() === month;
}

/** Local calendar date as YYYY-MM-DD (for date-only columns such as expense_date). */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Business date chosen by the user → timestamp. Today keeps the current time; another day uses local noon
 *  so the order never shifts to a neighbouring day across time zones. */
export function businessDateToISO(date: Date, now = new Date()): string {
  if (sameDay(date, now)) return now.toISOString();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0).toISOString();
}

export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDayHeading(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (sameDay(d, now)) return 'Hari ini';
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Kemarin';
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDate(iso: string): string {
  const d = parseDateLike(iso);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`;
}

export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour >= 4 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}
