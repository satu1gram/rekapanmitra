import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import type { OrderRow as Order } from '~/data/db';
import { formatTime } from '~/lib/dates';
import { formatRupiah } from '~/lib/money';
import { STATUS_LABEL } from '~/lib/orderStatus';
import { AppText, Badge } from './components';
import { colors, space } from './theme';


export function OrderRow({ order, showTime = true }: { order: Order; showTime?: boolean }) {
  const status = STATUS_LABEL[order.status] ?? { label: order.status, tone: 'neutral' as const };
  const margin = Number(order.margin);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.customer_name}, ${order.quantity} botol, ${formatRupiah(Number(order.total_price))}, untung ${formatRupiah(margin)}`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#F1F5F9' }]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="bodyStrong" numberOfLines={1}>{order.customer_name || 'Tanpa nama'}</AppText>
        <View style={styles.meta}>
          <AppText variant="small" color={colors.textMuted}>
            {order.quantity} botol{showTime ? ` · ${formatTime(order.created_at)}` : ''}
          </AppText>
          {order.status !== 'selesai' ? <Badge label={status.label} tone={status.tone} /> : null}
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <AppText variant="bodyStrong">{formatRupiah(Number(order.total_price))}</AppText>
        <AppText variant="small" color={margin < 0 ? colors.danger : colors.brandDark}>
          {margin < 0 ? 'Rugi ' : 'Untung '}{formatRupiah(Math.abs(margin))}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, minHeight: 54 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
