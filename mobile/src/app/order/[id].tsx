import { Alert, Share, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import type { OrderStatus } from '@/types';

import { deleteOrder, updateOrderStatus } from '~/data/orders';
import { useOrderDetail, useRefreshingMutation } from '~/hooks/queries';
import { formatDate, formatTime } from '~/lib/dates';
import { formatRupiah } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, Button, Card, Divider, ErrorState, LoadingState, Row, Screen, Segmented } from '~/ui/components';
import { STATUS_LABEL } from '~/lib/orderStatus';
import { colors, space } from '~/ui/theme';

const STATUSES: OrderStatus[] = ['pending', 'terkirim', 'selesai'];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useOrderDetail(id);
  const setStatus = useRefreshingMutation((status: OrderStatus) => updateOrderStatus(id, status), ['orders', 'order']);
  const remove = useRefreshingMutation(() => deleteOrder(id), ['orders', 'stock']);

  if (detail.isPending) return <LoadingState />;
  if (detail.isError) return <ErrorState message={errorMessage(detail.error)} onRetry={() => detail.refetch()} />;

  const { order, items, expenses } = detail.data;
  const totalPrice = Number(order.total_price);
  const buyPrice = Number(order.buy_price);
  const margin = Number(order.margin);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);

  const confirmDelete = () =>
    Alert.alert('Hapus order ini?', `Order ${order.customer_name} senilai ${formatRupiah(totalPrice)} akan dihapus permanen.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () =>
          remove.mutate(undefined, {
            onSuccess: () => router.back(),
            onError: e => Alert.alert('Gagal menghapus', errorMessage(e)),
          }),
      },
    ]);

  const shareReceipt = () => {
    const lines = [
      `Nota pesanan — ${formatDate(order.created_at)}`,
      `Pelanggan: ${order.customer_name}`,
      '',
      ...items.map(i => `${i.productName} × ${i.quantity} = ${formatRupiah(i.subtotal)}`),
      '',
      `Total: ${formatRupiah(totalPrice)}`,
    ];
    Share.share({ message: lines.join('\n') });
  };

  return (
    <Screen refreshing={detail.isRefetching} onRefresh={() => detail.refetch()}>
      <Stack.Screen options={{ title: order.customer_name || 'Detail order' }} />
      <Card>
        <AppText variant="small" color={colors.textMuted}>{formatDate(order.created_at)} · {formatTime(order.created_at)}</AppText>
        <AppText variant="title" selectable>{order.customer_name || 'Tanpa nama'}</AppText>
        {order.customer_phone ? <AppText variant="body" color={colors.textMuted} selectable>{order.customer_phone}</AppText> : null}
        <AppText variant="small" color={colors.textMuted}>Status</AppText>
        <Segmented
          value={(STATUSES.includes(order.status as OrderStatus) ? order.status : 'selesai') as OrderStatus}
          onChange={status => setStatus.mutate(status, { onError: e => Alert.alert('Gagal mengubah status', errorMessage(e)) })}
          options={STATUSES.map(s => ({ value: s, label: STATUS_LABEL[s].label }))}
        />
      </Card>

      <Card>
        <AppText variant="heading">Produk</AppText>
        {items.length === 0 ? <AppText variant="small" color={colors.textMuted}>Rincian produk tidak tersedia untuk order ini.</AppText> : null}
        {items.map((item, i) => (
          <View key={item.id} style={{ gap: space.sm }}>
            {i > 0 ? <Divider /> : null}
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{item.productName}</AppText>
                <AppText variant="small" color={colors.textMuted}>{item.quantity} × {formatRupiah(item.pricePerBottle)}</AppText>
              </View>
              <AppText variant="bodyStrong">{formatRupiah(item.subtotal)}</AppText>
            </Row>
          </View>
        ))}
      </Card>

      <Card>
        <AppText variant="heading">Perhitungan</AppText>
        <Line label={`Omset (${order.quantity} botol)`} value={totalPrice} />
        <Line label="Modal barang" value={-buyPrice} />
        {expenses.map(e => <Line key={e.id} label={e.name} value={-e.amount} />)}
        {expenses.length === 0 && Math.round(totalPrice - buyPrice - margin) !== 0 ? (
          <Line label="Biaya lain" value={-(totalPrice - buyPrice - margin)} />
        ) : null}
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText variant="bodyStrong">{margin < 0 ? 'Rugi' : 'Untung'}</AppText>
          <AppText variant="heading" color={margin < 0 ? colors.danger : colors.brandDark}>{formatRupiah(margin)}</AppText>
        </Row>
        {expenseTotal > 0 ? <AppText variant="small" color={colors.textMuted}>Total biaya di order: {formatRupiah(expenseTotal)}</AppText> : null}
      </Card>

      <Button label="Bagikan nota" icon="share-outline" tone="secondary" onPress={shareReceipt} />
      <Button label="Hapus order" icon="trash-outline" tone="danger" onPress={confirmDelete} loading={remove.isPending} />
      <AppText variant="small" color={colors.textSubtle} style={{ textAlign: 'center' }}>
        Ubah isi order (produk, harga, biaya) untuk saat ini lewat aplikasi web.
      </AppText>
    </Screen>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <AppText variant="body" color={colors.textMuted} style={{ flex: 1 }}>{label}</AppText>
      <AppText variant="bodyStrong" color={value < 0 ? colors.danger : colors.text}>{formatRupiah(value)}</AppText>
    </Row>
  );
}
