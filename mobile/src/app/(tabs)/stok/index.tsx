import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { LOW_STOCK_THRESHOLD } from '@/types';

import type { StockEntryRow } from '~/data/db';
import { deleteStockEntry } from '~/data/stock';
import { useRefreshingMutation, useStock } from '~/hooks/queries';
import { currentMonth, formatDate, isInMonth, type MonthRef } from '~/lib/dates';
import { formatRupiah } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, Badge, Button, Card, Divider, EmptyState, ErrorState, Icon, LoadingState, Notice, Row, Screen, SectionTitle, Segmented } from '~/ui/components';
import { MonthSwitcher } from '~/ui/MonthSwitcher';
import { colors, space } from '~/ui/theme';
import { showDialog } from '~/ui/dialog';

export default function StockScreen() {
  const stock = useStock();
  const [month, setMonth] = useState<MonthRef>(currentMonth());
  const [type, setType] = useState<'in' | 'out' | 'all'>('in');
  const remove = useRefreshingMutation((entry: StockEntryRow) => deleteStockEntry(entry), ['stock']);

  const entries = useMemo(
    () => (stock.data?.entries ?? []).filter(e => isInMonth(e.created_at, month) && (type === 'all' || e.type === type)),
    [stock.data, month, type],
  );

  if (stock.isPending) return <LoadingState />;
  if (stock.isError) return <ErrorState message={errorMessage(stock.error)} onRetry={() => stock.refetch()} />;

  const { currentStock } = stock.data;
  const monthIn = (stock.data.entries ?? []).filter(e => e.type === 'in' && isInMonth(e.created_at, month));
  const monthInQty = monthIn.reduce((s, e) => s + e.quantity, 0);
  const monthInValue = monthIn.reduce((s, e) => s + Number(e.total_buy_price ?? 0), 0);
  const low = currentStock <= LOW_STOCK_THRESHOLD;

  const confirmDelete = (entry: StockEntryRow) =>
    showDialog(
      'Hapus catatan stok?',
      `${entry.type === 'in' ? 'Restok' : 'Stok keluar'} ${entry.quantity} botol pada ${formatDate(entry.created_at)}. Saldo stok akan disesuaikan.`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => remove.mutate(entry, { onError: e => showDialog('Gagal menghapus', errorMessage(e)) }) },
      ],
    );

  return (
    <Screen refreshing={stock.isRefetching} onRefresh={() => stock.refetch()}>
      <Card style={{ alignItems: 'center', paddingVertical: space.xxl }}>
        <AppText variant="caption" color={colors.textMuted}>STOK SAAT INI</AppText>
        <AppText variant="hero" color={low ? colors.warning : colors.text}>{currentStock}</AppText>
        <AppText variant="body" color={colors.textMuted}>botol</AppText>
        {low ? <Badge label="Stok menipis" tone="warning" /> : null}
      </Card>
      <Button label="Catat restok" icon="add-circle" onPress={() => router.push('/restok/new')} />
      <Notice tone="info">Saldo stok bertambah saat kamu mencatat restok. Penjualan belum otomatis mengurangi stok (sama seperti di web).</Notice>

      <MonthSwitcher value={month} onChange={setMonth} />
      <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <AppText variant="caption" color={colors.textMuted}>RESTOK BULAN INI</AppText>
          <AppText variant="heading">{monthInQty} botol</AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="caption" color={colors.textMuted}>NILAI BELANJA</AppText>
          <AppText variant="heading">{formatRupiah(monthInValue)}</AppText>
        </View>
      </Card>

      <SectionTitle>Riwayat stok</SectionTitle>
      <Segmented value={type} onChange={setType} options={[{ value: 'in', label: 'Masuk' }, { value: 'out', label: 'Keluar' }, { value: 'all', label: 'Semua' }]} />
      <Card style={{ paddingVertical: space.xs }}>
        {entries.length === 0 ? (
          <EmptyState icon="cube-outline" title="Belum ada catatan" message="Catatan stok di bulan ini akan muncul di sini." />
        ) : (
          entries.map((entry, i) => (
            <View key={entry.id}>
              {i > 0 ? <Divider /> : null}
              <Row style={{ paddingVertical: space.md, alignItems: 'flex-start' }}>
                <Icon name={entry.type === 'in' ? 'arrow-down-circle' : 'arrow-up-circle'} size={24} color={entry.type === 'in' ? colors.brand : colors.warning} />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyStrong">{entry.type === 'in' ? '+' : '−'}{entry.quantity} botol</AppText>
                  <AppText variant="small" color={colors.textMuted}>
                    {formatDate(entry.created_at)}
                    {entry.buy_price_per_bottle ? ` · ${formatRupiah(Number(entry.buy_price_per_bottle))}/botol` : ''}
                  </AppText>
                  {entry.notes ? <AppText variant="small" color={colors.textMuted}>{entry.notes}</AppText> : null}
                </View>
                {entry.type === 'in' ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Button label="Ubah" tone="ghost" onPress={() => router.push({ pathname: '/restok/[id]', params: { id: entry.id } })} style={{ minHeight: 40, paddingHorizontal: space.sm }} />
                    <Button label="Hapus" tone="ghost" onPress={() => confirmDelete(entry)} style={{ minHeight: 40, paddingHorizontal: space.sm }} />
                  </View>
                ) : null}
              </Row>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
