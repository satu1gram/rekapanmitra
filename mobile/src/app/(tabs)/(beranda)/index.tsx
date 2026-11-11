import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LOW_STOCK_THRESHOLD } from '@/types';

import { levelLabel } from '~/data/profile';
import { useGeneralExpenses, useGeneralIncome, useOrders, useProfile, useStock, useTargets } from '~/hooks/queries';
import { summarizeMonth, targetProgress } from '~/lib/dashboard';
import { currentMonth, greeting, isInMonth, monthLabel, type MonthRef } from '~/lib/dates';
import { formatRupiah } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, Badge, Button, Card, Divider, EmptyState, ErrorState, Icon, LoadingState, Notice, Row, Screen, SectionTitle, Segmented } from '~/ui/components';
import { MonthSwitcher } from '~/ui/MonthSwitcher';
import { OrderRow } from '~/ui/OrderRow';
import { ProgressBar } from '~/ui/ProgressBar';
import { colors, radius, space } from '~/ui/theme';

export default function HomeScreen() {
  const profile = useProfile();
  const orders = useOrders();
  const stock = useStock();
  const expenses = useGeneralExpenses();
  const income = useGeneralIncome();
  const targets = useTargets();
  const [month, setMonth] = useState<MonthRef>(currentMonth());
  const [profitMode, setProfitMode] = useState<'kotor' | 'bersih'>('kotor');

  const core = [orders, stock];
  const finance = [expenses, income];
  const refreshing = [...core, ...finance, targets].some(q => q.isRefetching);
  const refresh = () => [profile, orders, stock, expenses, income, targets].forEach(q => q.refetch());

  const summary = useMemo(() => {
    if (!orders.data || !stock.data) return null;
    return summarizeMonth(
      month,
      orders.data,
      expenses.data ?? [],
      income.data ?? [],
      stock.data.entries,
    );
  }, [month, orders.data, stock.data, expenses.data, income.data]);

  if (core.some(q => q.isPending)) return <LoadingState />;
  const coreError = core.find(q => q.isError)?.error;
  if (coreError || !summary || !stock.data || !orders.data) return <ErrorState message={errorMessage(coreError)} onRetry={refresh} />;

  const financeMissing = finance.some(q => q.isError);
  const showNet = profitMode === 'bersih';
  const profit = showNet ? summary.netProfit : summary.grossProfit;
  const target = targets.data?.find(t => t.year === month.year && t.month === month.month) ?? null;
  const progress = targetProgress(summary, target, showNet);
  const recent = orders.data.filter(o => isInMonth(o.created_at, month)).slice(0, 5);
  const lowStock = stock.data.currentStock <= LOW_STOCK_THRESHOLD;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={{ gap: 4 }}>
        <AppText variant="body" color={colors.textMuted}>{greeting()},</AppText>
        <Row>
          <AppText variant="title" numberOfLines={1} style={{ flexShrink: 1 }}>{profile.data?.name || 'Mitra'}</AppText>
          {profile.data ? <Badge label={levelLabel(profile.data)} tone="success" /> : null}
        </Row>
      </View>

      <MonthSwitcher value={month} onChange={setMonth} />

      <Card style={styles.hero}>
        <AppText variant="caption" color="#D1FAE5">OMSET {monthLabel(month).toUpperCase()}</AppText>
        <AppText variant="hero" color={colors.white} selectable>{formatRupiah(summary.revenue)}</AppText>
        <Row style={{ gap: space.xl }}>
          <Stat label="Order" value={String(summary.orderCount)} />
          <Stat label="Botol terjual" value={String(summary.quantity)} />
        </Row>
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText variant="heading">Keuntungan</AppText>
        </Row>
        <Segmented
          value={profitMode}
          onChange={setProfitMode}
          options={[{ value: 'kotor', label: 'Kotor' }, { value: 'bersih', label: 'Setelah biaya' }]}
        />
        <AppText variant="title" color={profit < 0 ? colors.danger : colors.brandDark} selectable>{formatRupiah(profit)}</AppText>
        {showNet ? (
          <View style={{ gap: space.sm }}>
            <Line label="Laba kotor (omset − modal)" value={summary.grossProfit} />
            <Line label="Biaya di order" value={-summary.orderExpenses} />
            <Line label="Pengeluaran umum" value={-summary.generalExpenses} />
            <Line label="Pemasukan lain" value={summary.otherIncome} />
            {financeMissing ? <Notice tone="warning">Data pengeluaran/pemasukan gagal dimuat, angka setelah biaya belum lengkap. Tarik ke bawah untuk memuat ulang.</Notice> : null}
          </View>
        ) : (
          <AppText variant="small" color={colors.textMuted}>Omset dikurangi modal barang. Pilih “Setelah biaya” untuk memasukkan ongkir, pengeluaran, dan pemasukan lain.</AppText>
        )}
      </Card>

      <Row style={{ gap: space.md }}>
        <Button label="Tambah order" icon="add-circle" onPress={() => router.push('/order/new')} style={{ flex: 1 }} />
        <Button label="Restok" icon="cube" tone="secondary" onPress={() => router.push('/restok/new')} style={{ flex: 1 }} />
      </Row>

      <Pressable onPress={() => router.navigate('/stok')} accessibilityRole="button" accessibilityLabel={`Stok saat ini ${stock.data.currentStock} botol. Buka halaman stok.`}>
        <Card style={lowStock ? { borderColor: '#FCD34D' } : undefined}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row>
              <View style={[styles.iconBubble, lowStock && { backgroundColor: colors.warningSoft }]}>
                <Icon name="cube-outline" color={lowStock ? colors.warning : colors.brandDark} />
              </View>
              <View>
                <AppText variant="small" color={colors.textMuted}>Stok saat ini</AppText>
                <AppText variant="heading">{stock.data.currentStock} botol</AppText>
              </View>
            </Row>
            <Icon name="chevron-forward" color={colors.textSubtle} />
          </Row>
          {lowStock ? <Notice tone="warning">Stok menipis. Catat restok setelah barang datang.</Notice> : null}
          <AppText variant="small" color={colors.textMuted}>Restok bulan ini: {summary.restockQuantity} botol</AppText>
        </Card>
      </Pressable>

      {progress ? (
        <Card>
          <AppText variant="heading">Target {monthLabel(month)}</AppText>
          <ProgressBar label={showNet ? 'Untung setelah biaya' : 'Untung kotor'} valueText={`${formatRupiah(progress.profit.value)} / ${formatRupiah(progress.profit.target)}`} pct={progress.profit.pct} />
          <ProgressBar label="Botol terjual" valueText={`${progress.qty.value} / ${progress.qty.target}`} pct={progress.qty.pct} />
          <ProgressBar label="Restok" valueText={`${progress.stock.value} / ${progress.stock.target}`} pct={progress.stock.pct} />
        </Card>
      ) : null}

      <SectionTitle action={<Button label="Semua" tone="ghost" onPress={() => router.navigate('/riwayat')} style={{ minHeight: 40 }} />}>
        Order {monthLabel(month)}
      </SectionTitle>
      <Card style={{ paddingVertical: space.xs }}>
        {recent.length === 0 ? (
          <EmptyState icon="receipt-outline" title="Belum ada order bulan ini" message="Order yang kamu catat akan muncul di sini." />
        ) : (
          recent.map((order, i) => (
            <View key={order.id}>
              {i > 0 ? <Divider /> : null}
              <OrderRow order={order} />
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <AppText variant="caption" color="#D1FAE5">{label.toUpperCase()}</AppText>
      <AppText variant="heading" color={colors.white}>{value}</AppText>
    </View>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <AppText variant="small" color={colors.textMuted} style={{ flex: 1 }}>{label}</AppText>
      <AppText variant="small" style={{ fontWeight: '700' }} color={value < 0 ? colors.danger : colors.text}>{formatRupiah(value)}</AppText>
    </Row>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.brand, borderColor: colors.brandDark, gap: space.sm },
  iconBubble: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
});
