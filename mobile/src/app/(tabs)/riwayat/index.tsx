import { useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import type { OrderRow as Order } from '~/data/db';
import { useOrders } from '~/hooks/queries';
import { currentMonth, dayKey, formatDayHeading, isInMonth, type MonthRef } from '~/lib/dates';
import { formatRupiah, formatRupiahShort } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, Button, Card, Divider, EmptyState, ErrorState, Icon, LoadingState, Row } from '~/ui/components';
import { MonthSwitcher } from '~/ui/MonthSwitcher';
import { OrderRow } from '~/ui/OrderRow';
import { colors, radius, space } from '~/ui/theme';

interface DaySection {
  key: string;
  title: string;
  revenue: number;
  profit: number;
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
      if (!map.has(key)) map.set(key, { key, title: formatDayHeading(o.created_at), revenue: 0, profit: 0, data: [] });
      const day = map.get(key)!;
      day.revenue += Number(o.total_price);
      day.profit += Number(o.margin);
      day.data.push(o);
    }
    return {
      sections: Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key)),
      totals: {
        count: list.length,
        revenue: list.reduce((s, o) => s + Number(o.total_price), 0),
        profit: list.reduce((s, o) => s + Number(o.margin), 0),
      },
    };
  }, [orders.data, month, query]);

  if (orders.isPending) return <LoadingState />;
  if (orders.isError) return <ErrorState message={errorMessage(orders.error)} onRetry={() => orders.refetch()} />;

  return (
    <SectionList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxxl * 2 }}
      keyboardShouldPersistTaps="handled"
      sections={sections}
      keyExtractor={item => item.id}
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={orders.isRefetching} onRefresh={() => { orders.refetch(); }} tintColor={colors.brand} />}
      ListHeaderComponent={
        <View style={{ gap: space.md, marginBottom: space.md }}>
          <MonthSwitcher value={month} onChange={setMonth} />
          <View style={styles.search}>
            <Icon name="search" size={18} color={colors.textSubtle} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Cari nama atau nomor pelanggan"
              placeholderTextColor={colors.textSubtle}
              style={styles.searchInput}
              accessibilityLabel="Cari order"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Total label="Order" value={String(totals.count)} />
            <Total label="Omset" value={formatRupiahShort(totals.revenue)} />
            <Total label="Untung" value={formatRupiahShort(totals.profit)} color={totals.profit < 0 ? colors.danger : colors.brandDark} />
          </Card>
          <Row>
            <Button label="Tambah order" icon="add-circle" onPress={() => router.push('/order/new')} style={{ flex: 1 }} />
            <Button label="Dari chat" icon="sparkles-outline" tone="secondary" onPress={() => router.push('/asisten')} style={{ flex: 1 }} />
          </Row>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Row style={styles.sectionHeader}>
          <AppText variant="bodyStrong" style={{ flex: 1 }}>{section.title}</AppText>
          <AppText variant="small" color={colors.textMuted}>{formatRupiah(section.revenue)}</AppText>
        </Row>
      )}
      renderItem={({ item, index, section }) => (
        <View style={[styles.item, index === 0 && styles.itemFirst, index === section.data.length - 1 && styles.itemLast]}>
          {index > 0 ? <Divider /> : null}
          <OrderRow order={item} />
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="receipt-outline"
          title={query ? 'Tidak ada order yang cocok' : 'Belum ada order di bulan ini'}
          message={query ? 'Coba kata kunci lain.' : 'Ketuk “Tambah order” untuk mencatat penjualan.'}
        />
      }
    />
  );
}

function Total({ label, value, color = colors.text }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <AppText variant="caption" color={colors.textMuted}>{label.toUpperCase()}</AppText>
      <AppText variant="heading" color={color}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.md, minHeight: 48 },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: space.sm },
  sectionHeader: { marginTop: space.lg, marginBottom: space.sm },
  item: { backgroundColor: colors.white, paddingHorizontal: space.lg, borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  itemFirst: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderTopWidth: StyleSheet.hairlineWidth },
  itemLast: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg, borderBottomWidth: StyleSheet.hairlineWidth },
});
