import { useState, type ReactNode } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OrderStatus } from '@/types';

import { deleteOrder, setOrderProof, updateOrderStatus } from '~/data/orders';
import { useOrderDetail, useRefreshingMutation } from '~/hooks/queries';
import { formatDate, formatTime } from '~/lib/dates';
import { formatRupiah } from '~/lib/money';
import { productDisplayName } from '~/lib/orderMath';
import { TIER_LABEL } from '~/lib/priceOptions';
import { errorMessage } from '~/lib/supabase';
import { AppText, Divider, ErrorState, LoadingState, Row } from '~/ui/components';
import { CameraIcon, ChatIcon, CheckIcon, ChevronIcon, ShareIcon, TrashIcon, type IconProps } from '~/ui/icons';
import { productImage } from '~/ui/productMedia';
import { ProofPicker } from '~/ui/ProofPicker';
import { CapsuleButton, StickyFooter } from '~/ui/sheet';
import { colors, radius, space } from '~/ui/theme';

const STAGES: { status: OrderStatus; title: string; headline: string; hint: string }[] = [
  { status: 'pending', title: 'Order dicatat', headline: 'Siap dikirim', hint: 'Tandai terkirim setelah barang diserahkan ke kurir atau pelanggan.' },
  { status: 'terkirim', title: 'Terkirim', headline: 'Dalam pengiriman', hint: 'Tandai selesai setelah pelanggan menerima barang.' },
  { status: 'selesai', title: 'Selesai', headline: 'Order selesai', hint: 'Semua langkah sudah beres. Ketuk tahap untuk mengubah status.' },
];

export default function OrderStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const detail = useOrderDetail(id);
  const [showProof, setShowProof] = useState(false);
  const setStatus = useRefreshingMutation((status: OrderStatus) => updateOrderStatus(id, status), ['orders', 'order']);
  const remove = useRefreshingMutation(() => deleteOrder(id), ['orders', 'stock']);
  const proof = useRefreshingMutation((url: string | null) => setOrderProof(id, url), ['orders', 'order']);

  if (detail.isPending) return <LoadingState />;
  if (detail.isError) return <ErrorState message={errorMessage(detail.error)} onRetry={() => detail.refetch()} />;

  const { order, items, expenses } = detail.data;
  const stageIndex = Math.max(0, STAGES.findIndex(s => s.status === order.status));
  const stage = STAGES[stageIndex];
  const next = STAGES[stageIndex + 1];
  const totalPrice = Number(order.total_price);
  const buyPrice = Number(order.buy_price);
  const margin = Number(order.margin);
  const otherCost = expenses.length === 0 ? totalPrice - buyPrice - margin : 0;
  const waNumber = (order.customer_phone ?? '').replace(/\D/g, '').replace(/^0/, '62');

  const changeStatus = (status: OrderStatus) => setStatus.mutate(status, { onError: e => Alert.alert('Gagal mengubah status', errorMessage(e)) });

  const confirmDelete = () =>
    Alert.alert('Hapus order ini?', `Order ${order.customer_name} senilai ${formatRupiah(totalPrice)} akan dihapus permanen.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => remove.mutate(undefined, { onSuccess: () => router.back(), onError: e => Alert.alert('Gagal menghapus', errorMessage(e)) }) },
    ]);

  const shareReceipt = () => {
    const lines = [
      `Nota pesanan, ${formatDate(order.created_at)}`,
      `Pelanggan: ${order.customer_name}`,
      '',
      ...items.map(i => `${productDisplayName(i.productName)} × ${i.quantity} = ${formatRupiah(i.subtotal)}`),
      '',
      `Total: ${formatRupiah(totalPrice)}`,
    ];
    Share.share({ message: lines.join('\n') });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxxl }}>
        <View style={[styles.hero, { paddingTop: insets.top + 4 }]}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Kembali" hitSlop={8} style={styles.heroBtn}>
              <ChevronIcon direction="left" size={26} color={colors.white} />
            </Pressable>
            <AppText variant="small" color="#CDEBDD">{formatDate(order.created_at)} · {formatTime(order.created_at)}</AppText>
            <Pressable onPress={() => router.push({ pathname: '/order/[id]/edit', params: { id } })} accessibilityRole="button" accessibilityLabel="Ubah order" style={styles.heroBtn}>
              <AppText variant="bodyStrong" color={colors.white}>Ubah</AppText>
            </Pressable>
          </Row>
          <AppText variant="title" color={colors.white} style={{ fontSize: 26 }}>{stage.headline}</AppText>
          <AppText variant="body" color="#CDEBDD" style={{ fontSize: 15 }}>{stage.hint}</AppText>
          <View style={styles.progress} accessibilityLabel={`Tahap ${stageIndex + 1} dari 3`}>
            {STAGES.map((s, i) => <View key={s.status} style={[styles.progressPart, { backgroundColor: i <= stageIndex ? colors.white : 'rgba(255,255,255,0.3)' }]} />)}
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.card, styles.raised, { flexDirection: 'row', alignItems: 'center', gap: space.md }]}>
            <View style={styles.avatar}><AppText variant="title" color={colors.warning} style={{ fontSize: 20 }}>{(order.customer_name || '?').slice(0, 1).toUpperCase()}</AppText></View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="heading">{order.customer_name || 'Tanpa nama'}</AppText>
              <AppText variant="small" color={colors.textMuted}>{[order.customer_phone, TIER_LABEL[order.tier as keyof typeof TIER_LABEL]].filter(Boolean).join(' · ')}</AppText>
            </View>
            {waNumber ? (
              <Pressable onPress={() => Linking.openURL(`https://wa.me/${waNumber}`)} accessibilityRole="button" accessibilityLabel={`Chat WhatsApp ${order.customer_name}`} style={styles.round}>
                <ChatIcon size={22} color={colors.brand} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.card} accessibilityRole="radiogroup">
            {STAGES.map((s, i) => {
              const done = i <= stageIndex;
              const current = i === stageIndex + 1;
              return (
                <Pressable key={s.status} onPress={() => i !== stageIndex && changeStatus(s.status)} accessibilityRole="radio" accessibilityState={{ selected: i === stageIndex }} accessibilityLabel={`${s.title}${i === stageIndex ? ', status sekarang' : ''}`} style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ width: 28, alignItems: 'center' }}>
                    <View style={[styles.stageDot, done ? { backgroundColor: colors.brand } : current ? { borderWidth: 2, borderColor: colors.brand, backgroundColor: colors.white } : { backgroundColor: colors.border }]}>
                      {done ? <CheckIcon color={colors.white} /> : null}
                    </View>
                    {i < STAGES.length - 1 ? <View style={[styles.stageLine, { backgroundColor: i < stageIndex ? colors.brand : colors.border }]} /> : null}
                  </View>
                  <View style={{ paddingTop: 3, paddingBottom: i < STAGES.length - 1 ? 18 : 0, gap: 2 }}>
                    <AppText variant="bodyStrong" color={done || current ? colors.text : colors.textMuted}>{s.title}</AppText>
                    {i === 0 ? <AppText variant="small" color={colors.textMuted}>{formatDate(order.created_at)}, {formatTime(order.created_at)}</AppText> : current ? <AppText variant="small" color={colors.textMuted}>Langkah berikutnya</AppText> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.card}>
            {items.length === 0 ? <AppText variant="small" color={colors.textMuted}>Rincian produk tidak tersedia untuk order ini.</AppText> : null}
            {items.map(item => {
              const image = productImage(item.productName);
              return (
                <Row key={item.id} style={{ gap: space.md }}>
                  {image ? <Image source={image} style={styles.thumb} accessibilityIgnoresInvertColors /> : <View style={[styles.thumb, { backgroundColor: colors.fill }]} />}
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="bodyStrong">{productDisplayName(item.productName)}</AppText>
                    <AppText variant="small" color={colors.textMuted}>{item.quantity} × {formatRupiah(item.pricePerBottle)}</AppText>
                  </View>
                  <AppText variant="bodyStrong">{formatRupiah(item.subtotal)}</AppText>
                </Row>
              );
            })}
            <Divider />
            <Line label={`Omset · ${order.quantity} botol`} value={formatRupiah(totalPrice)} />
            <Line label="Modal" value={`−${formatRupiah(buyPrice)}`} />
            {expenses.map(e => <Line key={e.id} label={e.name} value={`−${formatRupiah(e.amount)}`} />)}
            {Math.round(otherCost) !== 0 ? <Line label="Biaya lain" value={`−${formatRupiah(otherCost)}`} /> : null}
            <Row style={{ justifyContent: 'space-between' }}>
              <AppText variant="bodyStrong">{margin < 0 ? 'Rugi' : 'Untung'}</AppText>
              <AppText variant="heading" color={margin < 0 ? colors.danger : colors.brand} style={{ fontWeight: '800' }}>{formatRupiah(margin)}</AppText>
            </Row>
          </View>

          <View style={styles.tiles}>
            <Tile Icon={CameraIcon} label={order.transfer_proof_url ? 'Bukti terlampir' : 'Bukti'} onPress={() => setShowProof(v => !v)} />
            <Tile Icon={ShareIcon} label="Nota" onPress={shareReceipt} />
            <Tile Icon={TrashIcon} label="Hapus" danger onPress={confirmDelete} />
          </View>
          {showProof ? (
            <View style={styles.card}>
              <ProofPicker value={order.transfer_proof_url} onChange={url => proof.mutate(url, { onError: e => Alert.alert('Bukti gagal disimpan', errorMessage(e)) })} label="Bukti transfer" />
            </View>
          ) : null}
        </View>
      </ScrollView>

      {next ? (
        <StickyFooter>
          <CapsuleButton label={next.status === 'terkirim' ? 'Tandai terkirim' : 'Tandai selesai'} onPress={() => changeStatus(next.status)} loading={setStatus.isPending} />
        </StickyFooter>
      ) : null}
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <AppText variant="body" color={colors.textMuted} style={{ flex: 1, fontSize: 15 }}>{label}</AppText>
      <AppText variant="body" style={{ fontSize: 15 }}>{value}</AppText>
    </Row>
  );
}

function Tile({ Icon, label, onPress, danger }: { Icon: (p: IconProps) => ReactNode; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.7 }]}>
      <Icon size={22} color={danger ? colors.danger : colors.brand} />
      <AppText variant="small" color={danger ? colors.danger : colors.text} style={{ fontWeight: '600', fontSize: 13 }}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.brand, paddingHorizontal: space.lg, paddingBottom: 56, gap: space.md },
  heroBtn: { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', gap: 6 },
  progressPart: { flex: 1, height: 5, borderRadius: 3 },
  body: { marginTop: -36, paddingHorizontal: space.lg, gap: space.md },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: space.lg, gap: space.md },
  raised: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.warningSoft, alignItems: 'center', justifyContent: 'center' },
  round: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stageDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stageLine: { width: 2, flex: 1, minHeight: 22 },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: space.md, borderRadius: radius.lg, backgroundColor: colors.white },
});
