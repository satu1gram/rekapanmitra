/**
 * Shared pieces of the home design system (Super app · Beranda): the green summary card with a
 * month switcher and a darker band, order rows, square icon buttons and the error panel.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import type { OrderRow } from '~/data/db';
import { currentMonth, formatTime, monthLabel, shiftMonth, type MonthRef } from '~/lib/dates';
import { formatRupiah } from '~/lib/money';
import { AppText, Row } from './components';
import { ChevronIcon, OfflineIcon } from './icons';
import { colors, radius, space } from './theme';

/** Light green text on the brand card: 4.67:1 on #0A7A52 and 5.86:1 on the darker band. */
export const ON_BRAND_MUTED = '#E4F3EA';
export const BAND = '#096947';

export function MonthCard({ month, onMonthChange, label, value, caption, band }: {
  month: MonthRef;
  onMonthChange: (m: MonthRef) => void;
  label: string;
  value: string;
  caption?: ReactNode;
  band: { label: string; value: string; note?: string }[];
}) {
  const now = currentMonth();
  const isCurrent = month.year === now.year && month.month === now.month;
  return (
    <View style={styles.card} accessibilityLabel={`${label} ${value}`}>
      <View style={styles.cardTop}>
        <Row style={{ justifyContent: 'space-between', marginHorizontal: -8, marginTop: -6 }}>
          <Pressable onPress={() => onMonthChange(shiftMonth(month, -1))} accessibilityRole="button" accessibilityLabel="Bulan sebelumnya" style={styles.monthBtn}>
            <ChevronIcon direction="left" color={colors.white} />
          </Pressable>
          <Pressable onPress={() => onMonthChange(now)} accessibilityRole="button" accessibilityLabel={`${monthLabel(month)}. Ketuk untuk kembali ke bulan ini.`} style={styles.monthLabel}>
            <AppText variant="small" color={ON_BRAND_MUTED} style={{ fontWeight: '600' }}>{monthLabel(month)}</AppText>
          </Pressable>
          <Pressable onPress={() => onMonthChange(shiftMonth(month, 1))} disabled={isCurrent} accessibilityRole="button" accessibilityLabel="Bulan berikutnya" accessibilityState={{ disabled: isCurrent }} style={[styles.monthBtn, isCurrent && { opacity: 0.35 }]}>
            <ChevronIcon direction="right" color={colors.white} />
          </Pressable>
        </Row>
        <AppText variant="small" color={ON_BRAND_MUTED}>{label}</AppText>
        <AppText variant="hero" color={colors.white} style={{ fontSize: 36, lineHeight: 40 }} selectable>{value}</AppText>
        {caption ? <AppText variant="small" color={ON_BRAND_MUTED}>{caption}</AppText> : null}
      </View>
      <View style={styles.band}>
        {band.map((cell, i) => (
          <View key={cell.label} style={[styles.bandCell, i > 0 && styles.bandDivider]}>
            <AppText variant="caption" color={ON_BRAND_MUTED} style={styles.bandLabel}>{cell.label}</AppText>
            <AppText variant="heading" color={colors.white}>{cell.value}</AppText>
            {cell.note ? <AppText variant="caption" color={ON_BRAND_MUTED} style={styles.bandNote}>{cell.note}</AppText> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export function IconButton({ label, onPress, children, tone = 'neutral' }: { label: string; onPress: () => void; children: ReactNode; tone?: 'neutral' | 'brand' | 'soft' }) {
  const bg = tone === 'brand' ? colors.brand : tone === 'soft' ? colors.brandSoft : colors.fill;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.iconBox, { backgroundColor: bg }, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

const STATUS_NOTE: Record<string, string> = { pending: 'belum dikirim', terkirim: 'sedang dikirim' };

export function OrderListRow({ order, first, showTime = true }: { order: OrderRow; first: boolean; showTime?: boolean }) {
  const margin = Number(order.margin);
  const status = STATUS_NOTE[order.status];
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.customer_name}, ${order.quantity} botol, ${formatRupiah(Number(order.total_price))}, ${margin < 0 ? 'rugi' : 'untung'} ${formatRupiah(Math.abs(margin))}`}
      style={({ pressed }) => [styles.row, !first && styles.rowSep, pressed && styles.pressed]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong" style={{ fontWeight: '600' }} numberOfLines={1}>{order.customer_name || 'Tanpa nama'}</AppText>
        <AppText variant="small" color={colors.textMuted} numberOfLines={1}>
          {order.quantity} botol{showTime ? ` · ${formatTime(order.created_at)}` : ''}
          {status ? <AppText variant="small" color={colors.warning} style={{ fontWeight: '600' }}>{` · ${status}`}</AppText> : null}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <AppText variant="bodyStrong" style={{ fontWeight: '600' }}>{formatRupiah(Number(order.total_price))}</AppText>
        <AppText variant="small" color={margin < 0 ? colors.danger : colors.brand} style={{ fontWeight: '600' }}>{margin < 0 ? 'Rugi' : 'Untung'} {formatRupiah(Math.abs(margin))}</AppText>
      </View>
    </Pressable>
  );
}

export function ErrorPanel({ message, onRetry, retrying }: { message: string; onRetry: () => void; retrying: boolean }) {
  return (
    <View style={styles.errorCard} accessibilityRole="alert">
      <View style={[styles.iconBox, { backgroundColor: colors.warningSoft }]}><OfflineIcon color={colors.warning} /></View>
      <AppText variant="title" style={{ fontSize: 20 }}>Data belum bisa dimuat</AppText>
      <AppText variant="body" color={colors.textMuted} style={{ fontSize: 15, lineHeight: 22 }}>
        {/network|koneksi|internet/i.test(message) ? 'Periksa sinyal atau Wi-Fi, lalu coba lagi.' : message}
      </AppText>
      <Pressable onPress={onRetry} disabled={retrying} accessibilityRole="button" accessibilityState={{ busy: retrying }} style={({ pressed }) => [styles.primaryBtn, (pressed || retrying) && styles.pressed]}>
        <AppText variant="bodyStrong" color={colors.white} style={{ fontWeight: '800' }}>{retrying ? 'Memuat ulang' : 'Coba lagi'}</AppText>
      </Pressable>
    </View>
  );
}

export const brandStyles = StyleSheet.create({
  h2: { fontSize: 18, fontWeight: '800' },
  textBtn: { minHeight: 44, justifyContent: 'center' },
});

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.brand },
  cardTop: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: 18, gap: 8 },
  monthBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.sm },
  band: { flexDirection: 'row', backgroundColor: BAND },
  bandCell: { flex: 1, paddingHorizontal: space.lg, paddingVertical: space.md, gap: 2 },
  bandDivider: { borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  bandLabel: { fontSize: 13, fontWeight: '500', letterSpacing: 0 },
  bandNote: { fontSize: 12, fontWeight: '400', letterSpacing: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 60 },
  rowSep: { borderTopWidth: 1, borderColor: colors.border },
  errorCard: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.xl, paddingHorizontal: space.lg, paddingVertical: 20, gap: space.md },
  primaryBtn: { alignSelf: 'flex-start', minHeight: 48, paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.brand, justifyContent: 'center' },
});
