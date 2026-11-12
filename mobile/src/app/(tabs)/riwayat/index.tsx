import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { OrderRow as Order } from '~/data/db';
import { useOrders } from '~/hooks/queries';
import { currentMonth, dayKey, formatDayHeading, isInMonth, MONTH_NAMES, type MonthRef } from '~/lib/dates';
import { formatRupiah } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, LoadingState, Row } from '~/ui/components';
import { brandStyles, ErrorPanel, IconButton, MonthCard, OrderListRow } from '~/ui/brand';
import { ChatIcon, CloseIcon, ListIcon, PlusIcon, SearchIcon } from '~/ui/icons';
import { colors, radius, space } from '~/ui/theme';

interface DaySection {
  key: string;
  title: string;
  revenue: number;
  data: Order[];
}

export default function HistoryScreen() {
  const orders = useOrders();
  const [month, setMonth] = useState<MonthRef>(currentMonth());
  const [query, setQuery] = useState('');

  const { sections, totals } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (orders.data ?? []).filter(
      o => isInMonth(o.created_at, month) && (!q || o.customer_name?.toLowerCase().includes(q) || o.customer_phone?.includes(q)),
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
      totals: {
        count: list.length,
        quantity: list.reduce((s, o) => s + o.quantity, 0),
        revenue: list.reduce((s, o) => s + Number(o.total_price), 0),
        profit: list.reduce((s, o) => s + Number(o.margin), 0),
        open: list.filter(o => o.status === 'pending' || o.status === 'terkirim').length,
      },
    };
  }, [orders.data, month, query]);

  const monthName = MONTH_NAMES[month.month];
  const header = (
    <Row style={{ gap: space.sm }}>
      <AppText variant="title" style={{ flex: 1, fontSize: 24 }}>Riwayat order</AppText>
      <IconButton label="Isi order dari chat" tone="soft" onPress={() => router.push('/asisten')}><ChatIcon color={colors.brand} /></IconButton>
      <IconButton label="Catat order" tone="brand" onPress={() => router.push('/order/new')}><PlusIcon color={colors.white} /></IconButton>
    </Row>
  );

  if (orders.isPending) return <SafeAreaView edges={['top']} style={styles.safe}><View style={styles.pad}>{header}<LoadingState label="Memuat order…" /></View></SafeAreaView>;
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
        refreshControl={<RefreshControl refreshing={orders.isRefetching} onRefresh={() => { orders.refetch(); }} tintColor={colors.brand} />}
        ListHeaderComponent={
          <View style={{ gap: space.xl, marginBottom: space.sm }}>
            {header}
            <MonthCard
              month={month}
              onMonthChange={setMonth}
              label={`Omset ${monthName}`}
              value={formatRupiah(totals.revenue)}
              caption={`${totals.count} order · ${totals.quantity} botol${totals.open ? ` · ${totals.open} belum selesai` : ''}`}
              band={[
                { label: totals.profit < 0 ? 'Rugi dari order' : 'Untung dari order', value: formatRupiah(Math.abs(totals.profit)), note: 'setelah modal & biaya di order' },
              ]}
            />
            <View style={styles.search}>
              <SearchIcon color={colors.textMuted} size={20} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Cari nama atau nomor pelanggan"
                placeholderTextColor={colors.textMuted}
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
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Row style={styles.sectionHeader}>
            <AppText variant="heading" style={[brandStyles.h2, { flex: 1 }]}>{section.title}</AppText>
            <AppText variant="small" color={colors.textMuted}>{formatRupiah(section.revenue)}</AppText>
          </Row>
        )}
        renderItem={({ item, index }) => <OrderListRow order={item} first={index === 0} />}
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
  safe: { flex: 1, backgroundColor: colors.white },
  pad: { paddingHorizontal: space.lg, paddingTop: 14, paddingBottom: space.xxxl * 2 },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 48, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.fill },
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, color: colors.text, paddingVertical: space.sm },
  clear: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E3E3E8', alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { marginTop: space.lg, marginBottom: 2 },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xxxl },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { minHeight: 48, paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.brand, justifyContent: 'center' },
});
