import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LOW_STOCK_THRESHOLD, type OrderStatus } from '@/types';

import type { OrderRow as Order } from '~/data/db';
import { updateOrderStatus } from '~/data/orders';
import { useGeneralExpenses, useGeneralIncome, useOrders, useProfile, useRefreshingMutation, useStock, useTargets } from '~/hooks/queries';
import { summarizeMonth, targetProgress } from '~/lib/dashboard';
import { currentMonth, formatTime, greeting, isInMonth, monthLabel, shiftMonth, type MonthRef } from '~/lib/dates';
import { formatRupiah } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, Divider, ErrorState, Icon, LoadingState, Notice, Row, type IconName } from '~/ui/components';
import { OrderRow } from '~/ui/OrderRow';
import { ProgressBar } from '~/ui/ProgressBar';
import { colors, radius, space } from '~/ui/theme';

const SERVICES: { label: string; href: Href; icon: IconName; bg: string; fg: string }[] = [
  { label: 'Order', href: '/order/new', icon: 'add', bg: colors.brandSoft, fg: colors.brand },
  { label: 'Restok', href: '/restok/new', icon: 'cube-outline', bg: colors.brandSoft, fg: colors.brand },
  { label: 'Dari chat', href: '/asisten', icon: 'chatbubble-ellipses-outline', bg: colors.infoSoft, fg: colors.info },
  { label: 'Pelanggan', href: '/pelanggan', icon: 'people-outline', bg: colors.infoSoft, fg: colors.info },
  { label: 'Keuangan', href: '/keuangan', icon: 'wallet-outline', bg: colors.warningSoft, fg: '#B23C00' },
  { label: 'Target', href: '/target', icon: 'flag-outline', bg: colors.warningSoft, fg: '#B23C00' },
  { label: 'Toko', href: '/toko', icon: 'storefront-outline', bg: colors.violetSoft, fg: colors.violet },
  { label: 'Lainnya', href: '/akun', icon: 'ellipsis-horizontal', bg: colors.fill, fg: '#3A3A3C' },
];

const NEXT_STATUS: Record<string, { status: OrderStatus; label: string; step: number }> = {
  pending: { status: 'terkirim', label: 'Tandai terkirim', step: 1 },
  terkirim: { status: 'selesai', label: 'Tandai selesai', step: 2 },
};

export default function HomeScreen() {
  const profile = useProfile();
  const orders = useOrders();
  const stock = useStock();
  const expenses = useGeneralExpenses();
  const income = useGeneralIncome();
  const targets = useTargets();
  const [month, setMonth] = useState<MonthRef>(currentMonth());
  const advance = useRefreshingMutation((input: { id: string; status: OrderStatus }) => updateOrderStatus(input.id, input.status), ['orders', 'order']);

  const core = [orders, stock];
  const refreshing = [orders, stock, expenses, income, targets].some(q => q.isRefetching);
  const refresh = () => [profile, orders, stock, expenses, income, targets].forEach(q => q.refetch());

  const summary = useMemo(() => {
    if (!orders.data || !stock.data) return null;
    return summarizeMonth(month, orders.data, expenses.data ?? [], income.data ?? [], stock.data.entries);
  }, [month, orders.data, stock.data, expenses.data, income.data]);

  if (core.some(q => q.isPending)) return <LoadingState />;
  const coreError = core.find(q => q.isError)?.error;
  if (coreError || !summary || !stock.data || !orders.data) return <ErrorState message={errorMessage(coreError)} onRetry={refresh} />;

  const now = currentMonth();
  const isCurrent = month.year === now.year && month.month === now.month;
  const financeMissing = expenses.isError || income.isError;
  const open = orders.data.filter(o => o.status === 'pending' || o.status === 'terkirim').slice(0, 3);
  const recent = orders.data.filter(o => isInMonth(o.created_at, month)).slice(0, 5);
  const lowStock = stock.data.currentStock <= LOW_STOCK_THRESHOLD;
  const target = targets.data?.find(t => t.year === month.year && t.month === month.month) ?? null;
  const progress = targetProgress(summary, target, false);
  const name = profile.data?.name || 'Mitra';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}>
        <Row>
          <Pressable onPress={() => router.push('/pelanggan')} accessibilityRole="search" accessibilityLabel="Cari pelanggan" style={styles.search}>
            <Icon name="search" size={18} color={colors.textMuted} />
            <AppText variant="body" color={colors.textMuted}>Cari pelanggan</AppText>
          </Pressable>
          <Pressable onPress={() => router.navigate('/akun')} accessibilityRole="button" accessibilityLabel="Akun" style={styles.avatar}>
            <AppText variant="bodyStrong" color={colors.brand}>{name.slice(0, 1).toUpperCase()}</AppText>
          </Pressable>
        </Row>

        <AppText variant="title">{greeting()}, {name.split(' ')[0]}</AppText>

        <View style={styles.wallet}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Pressable onPress={() => setMonth(shiftMonth(month, -1))} accessibilityRole="button" accessibilityLabel="Bulan sebelumnya" hitSlop={8} style={styles.monthBtn}>
              <Icon name="chevron-back" size={18} color={colors.white} />
            </Pressable>
            <Pressable onPress={() => setMonth(now)} accessibilityRole="button" accessibilityLabel={`${monthLabel(month)}. Ketuk untuk bulan ini.`}>
              <AppText variant="small" color="#CDEBDD" style={{ fontWeight: '600' }}>{monthLabel(month)}</AppText>
            </Pressable>
            <Pressable onPress={() => setMonth(shiftMonth(month, 1))} disabled={isCurrent} accessibilityRole="button" accessibilityLabel="Bulan berikutnya" hitSlop={8} style={[styles.monthBtn, isCurrent && { opacity: 0.3 }]}>
              <Icon name="chevron-forward" size={18} color={colors.white} />
            </Pressable>
          </Row>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ gap: 2 }}>
              <AppText variant="small" color="#CDEBDD">Omset</AppText>
              <AppText variant="title" color={colors.white} style={{ fontSize: 28 }} selectable>{formatRupiah(summary.revenue)}</AppText>
              <AppText variant="small" color="#CDEBDD">{summary.orderCount} order · {summary.quantity} botol</AppText>
            </View>
          </Row>
          <View style={styles.walletStats}>
            <Stat label="Untung kotor" value={formatRupiah(summary.grossProfit)} />
            <View style={styles.walletDivider} />
            <Stat label="Setelah biaya" value={financeMissing ? '—' : formatRupiah(summary.netProfit)} />
          </View>
          <View style={styles.walletActions}>
            <WalletAction icon="add" label="Order" onPress={() => router.push('/order/new')} />
            <WalletAction icon="cube-outline" label="Restok" onPress={() => router.push('/restok/new')} />
            <WalletAction icon="chatbubble-ellipses-outline" label="Dari chat" onPress={() => router.push('/asisten')} />
            <WalletAction icon="receipt-outline" label="Riwayat" onPress={() => router.navigate('/riwayat')} />
          </View>
        </View>
        {financeMissing ? <Notice tone="warning">Pengeluaran/pemasukan gagal dimuat, untung setelah biaya belum bisa dihitung. Tarik ke bawah untuk memuat ulang.</Notice> : null}

        <View style={styles.grid}>
          {SERVICES.map(s => (
            <Pressable key={s.label} onPress={() => router.push(s.href)} accessibilityRole="button" accessibilityLabel={s.label} style={styles.service}>
              <View style={[styles.serviceIcon, { backgroundColor: s.bg }]}><Icon name={s.icon} size={26} color={s.fg} /></View>
              <AppText variant="caption" style={{ textAlign: 'center', letterSpacing: 0 }}>{s.label}</AppText>
            </Pressable>
          ))}
        </View>

        {open.length > 0 || lowStock ? (
          <View style={{ gap: space.md }}>
            <AppText variant="heading" style={{ fontWeight: '800' }}>Perlu ditindaklanjuti</AppText>
            {open.map(order => (
              <OpenOrderCard
                key={order.id}
                order={order}
                busy={advance.isPending && advance.variables?.id === order.id}
                onAdvance={() => {
                  const next = NEXT_STATUS[order.status];
                  if (next) advance.mutate({ id: order.id, status: next.status });
                }}
              />
            ))}
            {lowStock ? (
              <Pressable onPress={() => router.push('/restok/new')} accessibilityRole="button" accessibilityLabel={`Stok tinggal ${stock.data.currentStock} botol. Catat restok.`} style={[styles.taskCard, { backgroundColor: colors.warningSoft }]}>
                <View style={[styles.taskIcon, { backgroundColor: colors.white }]}><Icon name="alert-circle" size={22} color={colors.warning} /></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyStrong">Stok tinggal {stock.data.currentStock} botol</AppText>
                  <AppText variant="small" color={colors.textMuted}>Catat restok setelah barang datang.</AppText>
                </View>
                <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>Restok</AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Pressable onPress={() => router.navigate('/stok')} accessibilityRole="button" accessibilityLabel={`Stok ${stock.data.currentStock} botol`} style={[styles.taskCard, { backgroundColor: colors.fill }]}>
          <View style={[styles.taskIcon, { backgroundColor: colors.white }]}><Icon name="cube-outline" size={22} color={colors.brand} /></View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyStrong">Stok {stock.data.currentStock} botol</AppText>
            <AppText variant="small" color={colors.textMuted}>
              Restok {monthLabel(month)}: {summary.restockQuantity} botol{target ? ` dari ${target.targetStock}` : ''}
            </AppText>
          </View>
          <Icon name="chevron-forward" size={18} color="#C4C4C7" />
        </Pressable>

        {progress ? (
          <Pressable onPress={() => router.push('/target')} accessibilityRole="button" accessibilityLabel="Target bulan ini. Ketuk untuk mengubah." style={styles.targetCard}>
            <Row style={{ justifyContent: 'space-between' }}>
              <AppText variant="heading" style={{ fontWeight: '800' }}>Target {monthLabel(month)}</AppText>
              <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>Ubah</AppText>
            </Row>
            <ProgressBar label="Untung kotor" valueText={`${formatRupiah(progress.profit.value)} / ${formatRupiah(progress.profit.target)}`} pct={progress.profit.pct} />
            <ProgressBar label="Botol terjual" valueText={`${progress.qty.value} / ${progress.qty.target}`} pct={progress.qty.pct} />
            <ProgressBar label="Restok" valueText={`${progress.stock.value} / ${progress.stock.target}`} pct={progress.stock.pct} />
          </Pressable>
        ) : null}

        <View style={{ gap: space.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <AppText variant="heading" style={{ fontWeight: '800' }}>Order {monthLabel(month)}</AppText>
            <Pressable onPress={() => router.navigate('/riwayat')} accessibilityRole="button" hitSlop={8}>
              <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>Lihat semua</AppText>
            </Pressable>
          </Row>
          {recent.length === 0 ? (
            <AppText variant="small" color={colors.textMuted}>Belum ada order di bulan ini. Ketuk Order untuk mencatat.</AppText>
          ) : (
            recent.map((order, i) => (
              <View key={order.id}>
                {i > 0 ? <Divider /> : null}
                <OrderRow order={order} />
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <AppText variant="caption" color="#CDEBDD" style={{ letterSpacing: 0, fontWeight: '500' }}>{label}</AppText>
      <AppText variant="bodyStrong" color={colors.white} style={{ fontSize: 17, fontWeight: '700' }}>{value}</AppText>
    </View>
  );
}

function WalletAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.walletAction, pressed && { opacity: 0.7 }]}>
      <View style={styles.walletActionIcon}><Icon name={icon} size={22} color={colors.white} /></View>
      <AppText variant="caption" color={colors.white} style={{ letterSpacing: 0 }}>{label}</AppText>
    </Pressable>
  );
}

function OpenOrderCard({ order, onAdvance, busy }: { order: Order; onAdvance: () => void; busy: boolean }) {
  const next = NEXT_STATUS[order.status];
  return (
    <Pressable onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })} accessibilityRole="button" accessibilityLabel={`Order ${order.customer_name}, ${order.status}`} style={styles.openCard}>
      <Row>
        <View style={[styles.taskIcon, { borderRadius: 22, backgroundColor: colors.warningSoft }]}>
          <AppText variant="bodyStrong" color={colors.warning}>{(order.customer_name || '?').slice(0, 1).toUpperCase()}</AppText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong" numberOfLines={1}>{order.customer_name} · {order.quantity} botol</AppText>
          <AppText variant="small" color={colors.textMuted}>{order.status === 'pending' ? 'Belum dikirim' : 'Sedang dikirim'} · {formatTime(order.created_at)}</AppText>
        </View>
        <AppText variant="bodyStrong">{formatRupiah(Number(order.total_price))}</AppText>
      </Row>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[0, 1, 2].map(i => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < (next?.step ?? 3) ? colors.warning : colors.border }} />)}
      </View>
      {next ? (
        <Pressable onPress={onAdvance} disabled={busy} accessibilityRole="button" accessibilityLabel={`${next.label} untuk ${order.customer_name}`} hitSlop={6} style={{ alignSelf: 'flex-start', opacity: busy ? 0.5 : 1 }}>
          <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>{busy ? 'Menyimpan…' : `${next.label} ›`}</AppText>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxxl * 2 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, height: 44, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.fill },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  wallet: { backgroundColor: colors.brand, borderRadius: radius.xl, padding: space.lg, gap: space.md },
  monthBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  walletStats: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: space.md },
  walletDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.4)' },
  walletActions: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.14)', borderRadius: 14, paddingVertical: space.sm },
  walletAction: { flex: 1, alignItems: 'center', gap: 4, minHeight: 64, justifyContent: 'center' },
  walletActionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.lg },
  service: { width: '25%', alignItems: 'center', gap: 6 },
  serviceIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  taskCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: 14, borderRadius: 18 },
  taskIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  openCard: { gap: space.md, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  targetCard: { gap: space.md, padding: space.lg, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
});
