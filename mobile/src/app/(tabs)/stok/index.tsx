import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LOW_STOCK_THRESHOLD } from '@/types';

import type { StockEntryRow } from '~/data/db';
import { deleteStockEntry } from '~/data/stock';
import { useRefreshingMutation, useStock } from '~/hooks/queries';
import { currentMonth, formatDate, isInMonth, MONTH_NAMES, type MonthRef } from '~/lib/dates';
import { formatRupiah, formatRupiahShort } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, Row } from '~/ui/components';
import { StockSkeleton } from '~/ui/skeleton';
import { ErrorPanel, IconButton, ON_BRAND_MUTED } from '~/ui/brand';
import { showDialog } from '~/ui/dialog';
import { BoxIcon, ChevronIcon, PlusIcon } from '~/ui/icons';
import { PillTabs } from '~/ui/kit';
import { MonthSwitcher } from '~/ui/MonthSwitcher';
import { colors, radius, space, TAB_BAR_SPACE } from '~/ui/theme';

type Kind = 'in' | 'out' | 'all';
const KINDS = [
  { value: 'all', label: 'Semua' },
  { value: 'in', label: 'Masuk' },
  { value: 'out', label: 'Keluar' },
] as const;

export default function StockScreen() {
  const stock = useStock();
  const [month, setMonth] = useState<MonthRef>(currentMonth());
  const [kind, setKind] = useState<Kind>('all');
  const remove = useRefreshingMutation((entry: StockEntryRow) => deleteStockEntry(entry), ['stock']);

  const all = useMemo(() => stock.data?.entries ?? [], [stock.data]);
  const inMonth = useMemo(() => all.filter(e => isInMonth(e.created_at, month)), [all, month]);
  const entries = kind === 'all' ? inMonth : inMonth.filter(e => e.type === kind);

  const header = (
    <Row style={{ gap: space.sm }}>
      <AppText variant="title" style={{ flex: 1, fontSize: 22 }}>Stok</AppText>
      <IconButton label="Catat restok" tone="brand" onPress={() => router.push('/restok/new')}><PlusIcon color={colors.white} /></IconButton>
    </Row>
  );

  if (stock.isPending) return <SafeAreaView edges={['top']} style={styles.safe}><View style={[styles.pad, { gap: space.lg }]}>{header}<StockSkeleton /></View></SafeAreaView>;
  if (stock.isError) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.pad, { gap: space.xl }]}>{header}<ErrorPanel message={errorMessage(stock.error)} onRetry={() => stock.refetch()} retrying={stock.isRefetching} /></View>
      </SafeAreaView>
    );
  }

  const { currentStock } = stock.data;
  const low = currentStock <= LOW_STOCK_THRESHOLD;
  const lastIn = all.find(e => e.type === 'in');
  const monthIn = inMonth.filter(e => e.type === 'in');
  const monthOut = inMonth.filter(e => e.type === 'out');
  const inQty = monthIn.reduce((s, e) => s + e.quantity, 0);
  const outQty = monthOut.reduce((s, e) => s + e.quantity, 0);
  const inValue = monthIn.reduce((s, e) => s + Number(e.total_buy_price ?? 0), 0);

  const openEntry = (entry: StockEntryRow) => {
    const what = `${entry.type === 'in' ? 'Restok' : 'Stok keluar'} ${entry.quantity} botol`;
    const askDelete = () =>
      showDialog('Hapus catatan stok?', `${what} pada ${formatDate(entry.created_at)}. Saldo stok akan disesuaikan.`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => remove.mutate(entry, { onError: e => showDialog('Gagal menghapus', errorMessage(e)) }) },
      ]);
    if (entry.type !== 'in') return askDelete();
    showDialog(what, formatDate(entry.created_at), [
      { text: 'Ubah catatan', onPress: () => router.push({ pathname: '/restok/[id]', params: { id: entry.id } }) },
      { text: 'Hapus', style: 'destructive', onPress: askDelete },
      { text: 'Tutup', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.pad, { gap: space.lg }]}
        refreshControl={<RefreshControl refreshing={stock.isRefetching} onRefresh={() => { stock.refetch(); }} tintColor={colors.brand} />}
      >
        {header}

        <View style={styles.hero} accessibilityLabel={`Stok di tangan ${currentStock} botol${low ? ', menipis' : ''}`}>
          <View style={styles.heroTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="small" color={ON_BRAND_MUTED}>Stok di tangan</AppText>
              <View style={[styles.status, low && { backgroundColor: colors.warningSoft }]}>
                <View style={[styles.statusDot, { backgroundColor: low ? colors.warning : '#5FC296' }]} />
                <AppText variant="caption" color={low ? colors.warning : colors.white} style={{ letterSpacing: 0, fontWeight: '700' }}>{low ? 'Menipis' : 'Aman'}</AppText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <AppText variant="hero" color={colors.white} style={{ fontSize: 40, lineHeight: 46 }}>{currentStock}</AppText>
              <AppText variant="heading" color={ON_BRAND_MUTED}>botol</AppText>
            </View>
            <AppText variant="small" color={ON_BRAND_MUTED}>
              {lastIn ? `Restok terakhir ${formatDate(lastIn.created_at)} · ${lastIn.quantity} botol` : 'Belum ada restok tercatat'}
            </AppText>
          </View>
          <Pressable onPress={() => router.push('/restok/new')} accessibilityRole="button" style={({ pressed }) => [styles.heroAction, pressed && { opacity: 0.85 }]}>
            <View style={styles.heroActionIcon}><BoxIcon size={20} color={colors.brand} /></View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" color={colors.white}>Catat restok</AppText>
              <AppText variant="small" color={ON_BRAND_MUTED}>{low ? `Stok tinggal ${currentStock} botol, saatnya isi ulang` : 'Catat begitu barang dari upline datang'}</AppText>
            </View>
            <ChevronIcon direction="right" size={18} color={colors.white} />
          </Pressable>
        </View>

        <AppText variant="small" color={colors.textMuted} style={{ marginTop: -6 }}>
          Stok bertambah saat kamu mencatat restok. Penjualan belum otomatis mengurangi stok, sama seperti di web.
        </AppText>

        <View style={{ gap: space.md }}>
          <AppText variant="heading" style={{ fontSize: 18, fontWeight: '800' }}>Riwayat stok</AppText>
          <MonthSwitcher value={month} onChange={setMonth} />
          <View style={styles.tiles}>
            <Tile label="Masuk" value={`${inQty} botol`} tone="brand" />
            <Tile label="Keluar" value={`${outQty} botol`} tone={outQty ? 'warning' : undefined} />
            <Tile label="Nilai belanja" value={formatRupiahShort(inValue)} />
          </View>
          <PillTabs options={KINDS} value={kind} onChange={setKind} />

          <View style={styles.list}>
            {entries.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}><BoxIcon color={colors.brand} /></View>
                <AppText variant="small" color={colors.textMuted} style={{ textAlign: 'center' }}>
                  Belum ada catatan {kind === 'in' ? 'stok masuk' : kind === 'out' ? 'stok keluar' : 'stok'} di {MONTH_NAMES[month.month]} {month.year}.
                </AppText>
              </View>
            ) : (
              entries.map((entry, i) => {
                const isIn = entry.type === 'in';
                const price = entry.buy_price_per_bottle ? Number(entry.buy_price_per_bottle) : null;
                return (
                  <Pressable
                    key={entry.id}
                    onPress={() => openEntry(entry)}
                    accessibilityRole="button"
                    accessibilityLabel={`${isIn ? 'Masuk' : 'Keluar'} ${entry.quantity} botol, ${formatDate(entry.created_at)}`}
                    style={({ pressed }) => [styles.row, i > 0 && styles.sep, pressed && { opacity: 0.6 }]}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: isIn ? colors.brandSoft : colors.warningSoft }]}>
                      <AppText variant="bodyStrong" color={isIn ? colors.brandDark : colors.warning} style={{ fontWeight: '800' }}>{isIn ? '+' : '−'}</AppText>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="bodyStrong">{isIn ? 'Restok' : 'Stok keluar'} {entry.quantity} botol</AppText>
                      <AppText variant="small" color={colors.textMuted} numberOfLines={1}>
                        {formatDate(entry.created_at)}{price ? ` · ${formatRupiah(price)}/botol` : ''}{entry.notes ? ` · ${entry.notes}` : ''}
                      </AppText>
                    </View>
                    {entry.total_buy_price ? <AppText variant="bodyStrong">{formatRupiahShort(Number(entry.total_buy_price))}</AppText> : null}
                    <ChevronIcon direction="right" size={16} color="#AEAEB2" />
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'brand' | 'warning' }) {
  const color = tone === 'brand' ? colors.brandDark : tone === 'warning' ? colors.warning : colors.text;
  return (
    <View style={styles.tile}>
      <AppText variant="small" color={colors.textMuted}>{label}</AppText>
      <AppText variant="bodyStrong" color={color} style={{ fontWeight: '800' }} numberOfLines={1}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: space.lg, paddingTop: 14, paddingBottom: TAB_BAR_SPACE },
  hero: { backgroundColor: colors.brand, borderRadius: radius.xl, overflow: 'hidden' },
  heroTop: { paddingHorizontal: space.lg, paddingTop: 14, paddingBottom: 14, gap: 4 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.16)' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  heroAction: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.lg, paddingVertical: 12, backgroundColor: '#096947' },
  heroActionIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, backgroundColor: colors.white, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  list: { backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 8 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xl },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
});
