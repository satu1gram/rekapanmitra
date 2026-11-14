import { useMemo, useState } from 'react';
import { isOpenStatus } from '~/lib/orderStatus';
import { Pressable, RefreshControl, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { OrderRow as Order } from '~/data/db';
import { useOrders } from '~/hooks/queries';
import { currentMonth, dayKey, formatDayHeading, isInMonth, MONTH_NAMES, type MonthRef } from '~/lib/dates';
import { formatRupiah } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, Row } from '~/ui/components';
import { HistorySkeleton } from '~/ui/skeleton';
import { ErrorPanel, IconButton, MonthCard, OrderListRow } from '~/ui/brand';
import { ChatIcon, CloseIcon, ListIcon, PlusIcon, SearchIcon } from '~/ui/icons';
import { colors, radius, space, TAB_BAR_SPACE } from '~/ui/theme';
import { usePullRefresh } from '~/ui/usePullRefresh';

type Filter = 'all' | 'open' | 'selesai';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'open', label: 'Belum selesai' },
  { key: 'selesai', label: 'Selesai' },
];
const isOpen = (o: Order) => isOpenStatus(o.status);

interface DaySection {
  key: string;
  title: string;
  revenue: number;
  data: Order[];
}

export default function HistoryScreen() {
  const orders = useOrders();
  const pull = usePullRefresh(() => orders.refetch());
  const [month, setMonth] = useState<MonthRef>(currentMonth());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const { sections, totals, shown } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inMonth = (orders.data ?? []).filter(o => isInMonth(o.created_at, month));
    const list = inMonth.filter(
      o => (!q || o.customer_name?.toLowerCase().includes(q) || o.customer_phone?.includes(q)) && (filter === 'all' || (filter === 'open' ? isOpen(o) : !isOpen(o))),
    );
    const map = new Map<string, DaySection>();
    for (const o of list) {
      const key = dayKey(o.created_at);
      if (!map.has(key)) map.set(key, { key, title: formatDayHeading(o.created_at), revenue: 0, data: [] });
      const day = map.get(key)!;
      day.revenue += Number(o.total_price);
      day.data.push(o);
    }
    return {
      sections: Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key)),
      // The month card always shows the whole month; search and filter only narrow the list.
      totals: {
        count: inMonth.length,
        quantity: inMonth.reduce((s, o) => s + o.quantity, 0),
        revenue: inMonth.reduce((s, o) => s + Number(o.total_price), 0),
        profit: inMonth.reduce((s, o) => s + Number(o.margin), 0),
        open: inMonth.filter(isOpen).length,
      },
      shown: list.length,
    };
  }, [orders.data, month, query, filter]);

  const monthName = MONTH_NAMES[month.month];
  const header = (
    <Row style={{ gap: space.sm }}>
      <AppText variant="title" style={{ flex: 1, fontSize: 22 }}>Riwayat order</AppText>
      <IconButton label="Isi order dari chat" tone="soft" onPress={() => router.push('/asisten')}><ChatIcon color={colors.brand} /></IconButton>
      <IconButton label="Catat order" tone="brand" onPress={() => router.push('/order/new')}><PlusIcon color={colors.white} /></IconButton>
    </Row>
  );

  if (orders.isPending) return <SafeAreaView edges={['top']} style={styles.safe}><View style={[styles.pad, { gap: space.md }]}>{header}<HistorySkeleton /></View></SafeAreaView>;
  if (orders.isError) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.pad, { gap: space.xl }]}>{header}<ErrorPanel message={errorMessage(orders.error)} onRetry={() => orders.refetch()} retrying={orders.isRefetching} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <SectionList
        contentContainerStyle={styles.pad}
        keyboardShouldPersistTaps="handled"
        sections={sections}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.brand} />}
        ListHeaderComponent={
          <View style={{ gap: space.md, marginBottom: 2 }}>
            {header}
            <MonthCard
              month={month}
              onMonthChange={setMonth}
              label={`Omset ${monthName}`}
              value={formatRupiah(totals.revenue)}
              caption={`${totals.count} order · ${totals.quantity} botol${totals.open ? ` · ${totals.open} belum selesai` : ''}`}
              band={[
                { label: totals.profit < 0 ? 'Rugi dari order' : 'Untung dari order', value: formatRupiah(Math.abs(totals.profit)), note: 'omset dikurangi modal & biaya tambahan' },
              ]}
            />
            <View style={styles.search}>
              <SearchIcon color={colors.textMuted} size={20} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Cari nama atau nomor pelanggan"
                placeholderTextColor={colors.placeholder}
                style={styles.searchInput}
                accessibilityLabel="Cari order berdasarkan pelanggan"
                returnKeyType="search"
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Hapus pencarian" hitSlop={8} style={styles.clear}>
                  <CloseIcon color={colors.textMuted} size={14} />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.filters} accessibilityRole="radiogroup">
              {FILTERS.map(f => {
                const on = filter === f.key;
                const count = f.key === 'open' ? totals.open : null;
                return (
                  <Pressable key={f.key} onPress={() => setFilter(f.key)} accessibilityRole="radio" accessibilityState={{ selected: on }} style={[styles.chip, on && styles.chipOn]}>
                    <AppText variant="small" color={on ? colors.white : colors.text} style={{ fontWeight: '700' }}>{f.label}{count ? ` · ${count}` : ''}</AppText>
                  </Pressable>
                );
              })}
            </View>
            {query || filter !== 'all' ? <AppText variant="small" color={colors.textMuted}>{shown} order ditemukan</AppText> : null}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Row style={styles.sectionHeader}>
            <AppText variant="heading" style={{ flex: 1, fontSize: 15, fontWeight: '800' }}>{section.title}</AppText>
            <AppText variant="small" color={colors.textMuted}>{section.data.length} order · {formatRupiah(section.revenue)}</AppText>
          </Row>
        )}
        renderItem={({ item, index, section }) => (
          <View style={[styles.cardRow, index === 0 && styles.cardTop, index === section.data.length - 1 && styles.cardBottom]}>
            <OrderListRow order={item} first={index === 0} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><ListIcon color={colors.brand} /></View>
            <AppText variant="heading" style={{ textAlign: 'center' }}>{query ? 'Tidak ada order yang cocok' : `Belum ada order di ${monthName}`}</AppText>
            <AppText variant="small" color={colors.textMuted} style={{ textAlign: 'center' }}>
              {query ? 'Coba nama atau nomor lain.' : 'Order yang kamu catat akan muncul di sini, dikelompokkan per hari.'}
            </AppText>
            {!query ? (
              <Pressable onPress={() => router.push('/order/new')} accessibilityRole="button" style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.6 }]}>
                <AppText variant="bodyStrong" color={colors.white} style={{ fontWeight: '800' }}>Catat order</AppText>
              </Pressable>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: space.lg, paddingTop: 14, paddingBottom: TAB_BAR_SPACE },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 42, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.white },
  filters: { flexDirection: 'row', gap: 8 },
  chip: { minHeight: 34, paddingHorizontal: 14, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.text },
  cardRow: { backgroundColor: colors.white, paddingHorizontal: 14 },
  cardTop: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  cardBottom: { borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15, color: colors.text, paddingVertical: 6 },
  clear: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E3E3E8', alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { marginTop: space.lg, marginBottom: 8, paddingHorizontal: 2 },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xxxl },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { minHeight: 48, paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.brand, justifyContent: 'center' },
});
