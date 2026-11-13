import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LOW_STOCK_THRESHOLD, type OrderStatus } from '@/types';

import type { OrderRow } from '~/data/db';
import { updateOrderStatus } from '~/data/orders';
import { useGeneralExpenses, useGeneralIncome, useOrders, useProfile, useRefreshingMutation, useStock, useTargets } from '~/hooks/queries';
import { summarizeMonth, targetProgress } from '~/lib/dashboard';
import { currentMonth, formatTime, greeting, isInMonth, MONTH_NAMES, type MonthRef } from '~/lib/dates';
import { formatRupiah, formatRupiahShort } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, Row } from '~/ui/components';
import { ErrorPanel, MonthCard, ON_BRAND_MUTED, OrderListRow } from '~/ui/brand';
import { BoxIcon, ChatIcon, FlagIcon, ListIcon, MoreIcon, PeopleIcon, PlusIcon, SearchIcon, StoreIcon, WalletIcon, type IconProps } from '~/ui/icons';
import { colors, radius, space, TAB_BAR_SPACE } from '~/ui/theme';


const NEXT_STATUS: Record<string, { status: OrderStatus; label: string; stage: number }> = {
  pending: { status: 'terkirim', label: 'Tandai terkirim', stage: 0 },
  terkirim: { status: 'selesai', label: 'Tandai selesai', stage: 1 },
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

  const refreshing = [orders, stock, expenses, income, targets].some(q => q.isRefetching);
  const refresh = () => [profile, orders, stock, expenses, income, targets].forEach(q => q.refetch());

  const summary = useMemo(() => {
    if (!orders.data || !stock.data) return null;
    return summarizeMonth(month, orders.data, expenses.data ?? [], income.data ?? [], stock.data.entries);
  }, [month, orders.data, stock.data, expenses.data, income.data]);

  const name = profile.data?.name?.split(' ')[0] || 'Mitra';
  const header = <Header salutation={orders.data?.length === 0 ? 'Selamat datang,' : `${greeting()},`} name={name} />;

  if (orders.isPending || stock.isPending) return <Shell>{header}<LoadingBody /></Shell>;
  const coreError = orders.error ?? stock.error;
  if (coreError || !summary || !stock.data || !orders.data) {
    return <Shell>{header}<ErrorPanel message={errorMessage(coreError)} onRetry={refresh} retrying={refreshing} /></Shell>;
  }
  if (orders.data.length === 0) return <Shell refreshing={refreshing} onRefresh={refresh}>{header}<EmptyBody /></Shell>;

    const monthName = MONTH_NAMES[month.month];
  const financeMissing = expenses.isError || income.isError;
  const open = orders.data.filter(o => o.status === 'pending' || o.status === 'terkirim').slice(0, 3);
  const lowStock = stock.data.currentStock <= LOW_STOCK_THRESHOLD;
  const recent = orders.data.filter(o => isInMonth(o.created_at, month)).slice(0, 3);
  const target = targets.data?.find(t => t.year === month.year && t.month === month.month) ?? null;
  const progress = targetProgress(summary, target, false);
  const taskCount = open.length + (lowStock ? 1 : 0);

  return (
    <Shell refreshing={refreshing} onRefresh={refresh}>
      {header}

      <MonthCard
        month={month}
        onMonthChange={setMonth}
        label={`Omset ${monthName}`}
        value={formatRupiah(summary.revenue)}
        caption={<>{summary.orderCount} order · <AppText variant="small" color={colors.white} style={{ fontWeight: '700' }}>{summary.quantity} botol</AppText> terjual</>}
        band={[
          { label: 'Untung kotor', value: formatRupiah(summary.grossProfit), note: 'omset dikurangi modal' },
          { label: 'Untung bersih', value: financeMissing ? 'Belum lengkap' : formatRupiah(summary.netProfit), note: 'setelah ongkir & biaya' },
        ]}
      />
      {financeMissing ? <AppText variant="small" color={colors.textMuted}>Data pengeluaran belum termuat, jadi untung bersih belum bisa dihitung. Tarik layar ke bawah untuk memuat ulang.</AppText> : null}

      <View style={styles.tray} accessibilityRole="toolbar" accessibilityLabel="Catat cepat">
        <QuickAction label="Catat order" href="/order/new" primary Icon={PlusIcon} />
        <QuickAction label="Catat restok" href="/restok/new" Icon={BoxIcon} />
        <QuickAction label="Isi dari chat" href="/asisten" Icon={ChatIcon} />
        <QuickAction label="Riwayat" href="/riwayat" navigate Icon={ListIcon} />
      </View>

      {taskCount > 0 ? (
        <View style={{ gap: space.md }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <AppText variant="heading" style={styles.h2}>Perlu dikerjakan</AppText>
            <AppText variant="small" color={colors.textMuted}>{taskCount} hal</AppText>
          </Row>
          {open.map(order => (
            <TaskCard
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
            <Pressable onPress={() => router.push('/restok/new')} accessibilityRole="button" accessibilityLabel={`Stok tinggal ${stock.data.currentStock} botol. Catat restok.`} style={({ pressed }) => [styles.stockAlert, pressed && styles.pressed]}>
              <View style={[styles.iconBox, { backgroundColor: colors.white }]}><BoxIcon color={colors.warning} size={22} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">Stok tinggal {stock.data.currentStock} botol</AppText>
                <AppText variant="small" color={colors.textMuted}>Catat restok begitu barang datang</AppText>
              </View>
              <AppText variant="small" color={colors.warning} style={{ fontWeight: '700' }}>Catat restok</AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.grid} accessibilityRole="toolbar" accessibilityLabel="Fitur lain">
        <MoreFeature label="Pelanggan" href="/pelanggan" Icon={PeopleIcon} />
        <MoreFeature label="Keuangan" href="/keuangan" Icon={WalletIcon} />
        <MoreFeature label="Target" href="/target" Icon={FlagIcon} />
        <MoreFeature label="Toko" href="/toko" Icon={StoreIcon} />
        <MoreFeature label="Lainnya" href="/akun" navigate Icon={MoreIcon} />
      </View>

      {progress ? (
        <View style={styles.target}>
          <Row style={{ justifyContent: 'space-between' }}>
            <AppText variant="heading" style={{ fontWeight: '800', fontSize: 16 }}>Target {monthName}</AppText>
            <Pressable onPress={() => router.push('/target')} accessibilityRole="button" style={styles.textBtn}>
              <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>Ubah target</AppText>
            </Pressable>
          </Row>
          <View style={{ gap: 12 }}>
            <TargetCell label="Untung kotor" pct={progress.profit.pct} value={formatRupiahShort(progress.profit.value)} target={formatRupiahShort(progress.profit.target)} />
            <TargetCell label="Botol terjual" pct={progress.qty.pct} value={`${progress.qty.value}`} target={`${progress.qty.target} botol`} />
            <TargetCell label="Restok" pct={progress.stock.pct} value={`${progress.stock.value}`} target={`${progress.stock.target} botol`} />
          </View>
        </View>
      ) : (
        <Pressable onPress={() => router.push('/target')} accessibilityRole="button" style={[styles.target, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={[styles.iconBox, { backgroundColor: colors.white }]}><FlagIcon color={colors.brand} size={22} /></View>
          <AppText variant="body" style={{ flex: 1, fontSize: 14 }}>Belum ada target untuk {monthName}</AppText>
          <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>Buat target</AppText>
        </Pressable>
      )}

      <View style={{ gap: 4 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText variant="heading" style={styles.h2}>Order terbaru</AppText>
          <Pressable onPress={() => router.navigate('/riwayat')} accessibilityRole="button" style={styles.textBtn}>
            <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>Semua order</AppText>
          </Pressable>
        </Row>
        {recent.length === 0 ? (
          <AppText variant="small" color={colors.textMuted}>Belum ada order di {monthName}.</AppText>
        ) : (
          recent.map((order, i) => <OrderListRow key={order.id} order={order} first={i === 0} />)
        )}
      </View>
    </Shell>
  );
}

function Shell({ children, refreshing, onRefresh }: { children: ReactNode; refreshing?: boolean; onRefresh?: () => void }) {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.brand} /> : undefined}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ salutation, name }: { salutation: string; name: string }) {
  return (
    <Row style={{ gap: space.sm }}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="body" color={colors.textMuted} style={{ fontSize: 14 }}>{salutation}</AppText>
        <AppText variant="title" style={{ fontSize: 22 }} numberOfLines={1}>{name}</AppText>
      </View>
      <Pressable onPress={() => router.push('/pelanggan')} accessibilityRole="button" accessibilityLabel="Cari pelanggan" style={({ pressed }) => [styles.iconBox, { backgroundColor: colors.fill }, pressed && styles.pressed]}>
        <SearchIcon color={colors.text} />
      </Pressable>
      <Pressable onPress={() => router.navigate('/akun')} accessibilityRole="button" accessibilityLabel={`Akun ${name}`} style={({ pressed }) => [styles.iconBox, styles.avatar, pressed && styles.pressed]}>
        <AppText variant="bodyStrong" color={colors.brandDark} style={{ fontSize: 16, fontWeight: '800' }}>{name.slice(0, 1).toUpperCase()}</AppText>
      </Pressable>
    </Row>
  );
}

function go(href: Href, navigate?: boolean) {
  if (navigate) router.navigate(href);
  else router.push(href);
}

function QuickAction({ label, href, Icon, primary, navigate }: { label: string; href: Href; Icon: (p: IconProps) => ReactNode; primary?: boolean; navigate?: boolean }) {
  return (
    <Pressable onPress={() => go(href, navigate)} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.quick, pressed && styles.pressed]}>
      <View style={[styles.iconBox, { backgroundColor: primary ? colors.brand : colors.brandSoft }]}>
        <Icon color={primary ? colors.white : colors.brand} />
      </View>
      <AppText variant="caption" style={styles.quickLabel} numberOfLines={1}>{label}</AppText>
    </Pressable>
  );
}

function MoreFeature({ label, href, Icon, navigate }: { label: string; href: Href; Icon: (p: IconProps) => ReactNode; navigate?: boolean }) {
  return (
    <Pressable onPress={() => go(href, navigate)} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
      <View style={styles.moreIcon}><Icon color={colors.brand} /></View>
      <AppText variant="caption" style={styles.moreLabel} numberOfLines={1}>{label}</AppText>
    </Pressable>
  );
}

/** Identity motif: the three order stages (dicatat, terkirim, selesai) as dots, same as the order status screen. */
const STAGE_LABELS = ['Dicatat', 'Terkirim', 'Selesai'];

/** Three connected steps: done steps and the line up to them are filled, the next step is a ring. */
function StageDots({ stage }: { stage: number }) {
  return (
    <View style={{ width: 156, gap: 4 }} accessibilityLabel={`Tahap ${stage + 1} dari 3: ${STAGE_LABELS[stage]}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
        {[0, 1, 2].map(i => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', flex: i > 0 ? 1 : 0 }}>
            {i > 0 ? <View style={{ flex: 1, height: 3, backgroundColor: i <= stage ? colors.warning : colors.border }} /> : null}
            <View
              style={[
                { width: 12, height: 12, borderRadius: 6 },
                i <= stage ? { backgroundColor: colors.warning } : i === stage + 1 ? { borderWidth: 2.5, borderColor: colors.warning, backgroundColor: colors.white } : { backgroundColor: colors.border },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {STAGE_LABELS.map((label, i) => (
          <AppText key={label} variant="caption" color={i <= stage ? colors.warning : colors.textMuted} style={{ width: 52, textAlign: 'center', letterSpacing: 0, fontWeight: i === stage ? '700' : '500' }}>{label}</AppText>
        ))}
      </View>
    </View>
  );
}

function TaskCard({ order, onAdvance, busy }: { order: OrderRow; onAdvance: () => void; busy: boolean }) {
  const next = NEXT_STATUS[order.status];
  return (
    <View style={styles.task}>
      <Pressable onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })} accessibilityRole="button" accessibilityLabel={`Buka order ${order.customer_name}`} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: space.md }, pressed && styles.pressed]}>
        <View style={styles.taskAvatar}><AppText variant="bodyStrong" color={colors.warning} style={{ fontWeight: '800' }}>{(order.customer_name || '?').slice(0, 1).toUpperCase()}</AppText></View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong" numberOfLines={1}>{order.customer_name} · {order.quantity} botol</AppText>
          <AppText variant="small" color={colors.textMuted}>{order.status === 'pending' ? 'Belum dikirim' : 'Sedang dikirim'} sejak {formatTime(order.created_at)}</AppText>
        </View>
        <AppText variant="bodyStrong">{formatRupiah(Number(order.total_price))}</AppText>
      </Pressable>
      {next ? (
        <Row style={{ justifyContent: 'space-between' }}>
          <StageDots stage={next.stage} />
          <Pressable onPress={onAdvance} disabled={busy} accessibilityRole="button" accessibilityLabel={`${next.label}: ${order.customer_name}`} accessibilityState={{ disabled: busy, busy }} style={({ pressed }) => [styles.smallBtn, (pressed || busy) && styles.pressed]}>
            <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>{busy ? 'Menyimpan' : next.label}</AppText>
          </Pressable>
        </Row>
      ) : null}
    </View>
  );
}

function TargetCell({ label, pct, value, target }: { label: string; pct: number; value: string; target: string }) {
  return (
    <View style={{ gap: 6 }} accessibilityLabel={`${label}: ${value} dari ${target}, ${pct} persen`}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <AppText variant="small" color={colors.textMuted} style={{ flex: 1, fontSize: 13 }} numberOfLines={1}>{label}</AppText>
        <AppText variant="small" style={{ fontSize: 14, fontWeight: '700' }}>{value}</AppText>
        <AppText variant="small" color={colors.textMuted} style={{ fontSize: 13 }}>/ {target}</AppText>
        <AppText variant="small" color={colors.brandDark} style={{ fontSize: 13, fontWeight: '700', minWidth: 38, textAlign: 'right' }}>{pct}%</AppText>
      </View>
      <View style={styles.bar}><View style={[styles.barFill, { width: `${Math.min(100, pct)}%` }]} /></View>
    </View>
  );
}


function EmptyBody() {
  const steps: { label: string; note: string; href: Href; Icon: (p: IconProps) => ReactNode }[] = [
    { label: 'Isi stok yang kamu pegang', note: 'Supaya peringatan stok menipis bekerja', href: '/restok/new', Icon: BoxIcon },
    { label: 'Buka toko online', note: 'Pelanggan bisa pesan sendiri lewat link', href: '/toko', Icon: StoreIcon },
    { label: 'Coba isi order dari chat', note: 'Tempel pesan WhatsApp, draf terisi sendiri', href: '/asisten', Icon: ChatIcon },
  ];
  return (
    <>
      <View style={[styles.card, { padding: space.lg, gap: space.md }]}>
        <AppText variant="title" color={colors.white} style={{ fontSize: 20 }}>Catat order pertamamu</AppText>
        <AppText variant="body" color={ON_BRAND_MUTED} style={{ fontSize: 14, lineHeight: 22 }}>Omset, untung, dan stok di halaman ini terisi otomatis dari order dan restok yang kamu catat.</AppText>
        <Pressable onPress={() => router.push('/order/new')} accessibilityRole="button" style={({ pressed }) => [styles.whiteBtn, pressed && styles.pressed]}>
          <AppText variant="bodyStrong" color={colors.brandDark} style={{ fontWeight: '800' }}>Tambah order</AppText>
        </Pressable>
      </View>
      <View style={{ gap: 4 }}>
        <AppText variant="heading" style={[styles.h2, { marginBottom: 4 }]}>Lengkapi dulu</AppText>
        {steps.map((s, i) => (
          <Pressable key={s.label} onPress={() => router.push(s.href)} accessibilityRole="button" style={({ pressed }) => [styles.recent, i > 0 && styles.recentSep, { minHeight: 64 }, pressed && styles.pressed]}>
            <View style={[styles.iconBox, { backgroundColor: colors.brandSoft }]}><s.Icon color={colors.brand} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong">{s.label}</AppText>
              <AppText variant="small" color={colors.textMuted}>{s.note}</AppText>
            </View>
          </Pressable>
        ))}
      </View>
    </>
  );
}


function LoadingBody() {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (reduce) return;
      loop = Animated.loop(Animated.sequence([
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]));
      loop.start();
    });
    return () => loop?.stop();
  }, [opacity]);
  const bone = (style: object) => <Animated.View style={[styles.bone, style, { opacity }]} />;
  return (
    <View style={{ gap: space.xl }} accessibilityRole="progressbar" accessibilityLabel="Memuat data usaha">
      {bone({ height: 210, borderRadius: radius.xl })}
      <View style={{ flexDirection: 'row', gap: 10 }}>{[0, 1, 2, 3].map(i => <View key={i} style={{ flex: 1 }}>{bone({ height: 76, borderRadius: radius.lg })}</View>)}</View>
      {bone({ height: 18, width: '50%' })}
      {bone({ height: 96, borderRadius: radius.lg })}
      <AppText variant="small" color={colors.textMuted} style={{ textAlign: 'center' }}>Memuat data usaha…</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingTop: 14, paddingBottom: TAB_BAR_SPACE, gap: space.xl },
  pressed: { opacity: 0.6 },
  h2: { fontSize: 18, fontWeight: '800' },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatar: { borderRadius: 22, backgroundColor: colors.brandSoft },
  tray: { flexDirection: 'row', marginTop: -6, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: 6, paddingHorizontal: 4 },
  quick: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 72 },
  quickLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0, textAlign: 'center' },
  task: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14, gap: space.md },
  taskAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.warningSoft, alignItems: 'center', justifyContent: 'center' },
  smallBtn: { minHeight: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: colors.brand, justifyContent: 'center' },
  stockAlert: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: 14, borderRadius: radius.lg, backgroundColor: colors.warningSoft },
  grid: { flexDirection: 'row' },
  more: { flex: 1, alignItems: 'center', gap: 6, minHeight: 72 },
  moreIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  moreLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0, textAlign: 'center' },
  target: { backgroundColor: colors.fill, borderRadius: radius.lg, paddingHorizontal: space.lg, paddingVertical: 14, gap: space.md },
  textBtn: { minHeight: 44, justifyContent: 'center' },
  bar: { height: 6, borderRadius: 3, backgroundColor: '#DADAE0', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.brand },
  whiteBtn: { alignSelf: 'flex-start', minHeight: 48, paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.white, justifyContent: 'center' },
  bone: { backgroundColor: '#ECECF1', borderRadius: 8 },
  card: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.brand },
  recent: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 54 },
  recentSep: { borderTopWidth: 1, borderColor: colors.border },
});
