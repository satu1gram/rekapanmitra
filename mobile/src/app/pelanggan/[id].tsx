import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { TierType } from '@/types';

import type { CustomerRow } from '~/data/db';
import { deleteCustomer, updateCustomer } from '~/data/customers';
import { ordersForCustomer } from '~/data/orders';
import { useCustomers, useOrders, useRefreshingMutation } from '~/hooks/queries';
import { formatDate } from '~/lib/dates';
import { formatRupiah } from '~/lib/money';
import { showDialog } from '~/ui/dialog';
import { TIER_LABEL } from '~/lib/priceOptions';
import { errorMessage } from '~/lib/supabase';
import { AppText, ErrorState, Notice } from '~/ui/components';
import { CustomerDetailSkeleton, RowsSkeleton } from '~/ui/skeleton';
import { OrderListRow } from '~/ui/brand';
import { ChatIcon, PencilIcon, TrashIcon } from '~/ui/icons';
import { Avatar, FieldRow, Group, kitStyles, PageHeader, PillButton, SectionLabel } from '~/ui/kit';
import { CapsuleButton, StickyFooter } from '~/ui/sheet';
import { colors, space } from '~/ui/theme';
import { KeyboardSafeView } from '~/ui/KeyboardSafeView';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customers = useCustomers();
  const orders = useOrders();
  if (customers.isPending) return <View style={kitStyles.page}><PageHeader title="Pelanggan" /><CustomerDetailSkeleton /></View>;
  if (customers.isError) return <View style={kitStyles.page}><PageHeader title="Pelanggan" /><ErrorState message={errorMessage(customers.error)} onRetry={() => customers.refetch()} /></View>;
  const customer = customers.data.find(c => c.id === id);
  if (!customer) return <View style={kitStyles.page}><PageHeader title="Pelanggan" /><ErrorState message="Pelanggan tidak ditemukan." /></View>;
  const history = orders.data ? ordersForCustomer(orders.data, customer) : [];
  return <CustomerDetail customer={customer} history={history} ordersLoading={orders.isPending} />;
}

function CustomerDetail({ customer, history, ordersLoading }: { customer: CustomerRow; history: ReturnType<typeof ordersForCustomer>; ordersLoading: boolean }) {
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState({ name: customer.name, phone: customer.phone ?? '', address: customer.address ?? '', city: customer.city ?? '', province: customer.province ?? '' });
  const [error, setError] = useState<string | null>(null);
  const save = useRefreshingMutation((f: typeof fields) => updateCustomer(customer.id, f), ['customers']);
  const remove = useRefreshingMutation(() => deleteCustomer(customer.id), ['customers', 'orders']);
  const confirmDelete = () => showDialog(
    `Hapus ${customer.name}?`,
    'Data pelanggan dihapus. Order yang pernah dicatat tetap ada di Riwayat, tanpa tautan ke pelanggan ini.',
    [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus pelanggan', style: 'destructive', onPress: () => remove.mutate(undefined, { onSuccess: () => router.back(), onError: e => showDialog('Gagal menghapus', errorMessage(e)) }) },
    ],
  );
  const set = (key: keyof typeof fields) => (value: string) => setFields(prev => ({ ...prev, [key]: value }));
  const waNumber = (customer.phone ?? '').replace(/\D/g, '').replace(/^0/, '62');
  const address = [customer.address, customer.city, customer.province].filter(Boolean).join(', ');
  const newOrder = () => router.push({ pathname: '/order/new', params: { draft: JSON.stringify({ customerName: customer.name, customerPhone: customer.phone ?? '', customerId: customer.id, tier: customer.tier }) } });

  return (
    <KeyboardSafeView style={kitStyles.page}>
      <PageHeader title={customer.name} />
      <ScrollView contentContainerStyle={[kitStyles.content, { paddingBottom: space.xxl }]} keyboardShouldPersistTaps="handled">
        {error ? <Notice tone="danger">{error}</Notice> : null}

        {editing ? (
          <View style={{ gap: space.sm }}>
            <SectionLabel>Ubah data pelanggan</SectionLabel>
            <Group>
              <FieldRow first label="Nama" value={fields.name} onChangeText={set('name')} autoCapitalize="words" />
              <FieldRow label="No. WhatsApp" value={fields.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="mis. 0812 3456 7890" />
              <FieldRow label="Alamat" value={fields.address} onChangeText={set('address')} multiline placeholder="mis. Jl. Melati No. 5" />
              <FieldRow label="Kota" value={fields.city} onChangeText={set('city')} />
              <FieldRow label="Provinsi" value={fields.province} onChangeText={set('province')} />
            </Group>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PillButton label="Batal" tone="outline" onPress={() => setEditing(false)} style={{ flex: 1 }} />
              <PillButton
                label="Simpan"
                tone="brand"
                loading={save.isPending}
                style={{ flex: 1 }}
                onPress={() => save.mutate(fields, { onSuccess: () => { setEditing(false); setError(null); }, onError: e => setError(errorMessage(e)) })}
              />
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={customer.name} size={52} />
              <View style={{ flex: 1, gap: 3 }}>
                <AppText variant="heading" style={{ fontSize: 18, fontWeight: '800' }} selectable numberOfLines={1}>{customer.name}</AppText>
                <View style={styles.badge}><AppText variant="caption" color={colors.brandDark} style={{ letterSpacing: 0 }}>{TIER_LABEL[customer.tier as TierType] ?? customer.tier}</AppText></View>
              </View>
            </View>
            {customer.phone || address ? (
              <View style={{ gap: 2 }}>
                {customer.phone ? <AppText variant="body" selectable>{customer.phone}</AppText> : null}
                {address ? <AppText variant="small" color={colors.textMuted} selectable>{address}</AppText> : null}
              </View>
            ) : null}
            <View style={styles.stats}>
              <View style={styles.stat}><AppText variant="small" color={colors.textMuted}>Order</AppText><AppText variant="heading" style={{ fontWeight: '800' }}>{customer.total_orders}</AppText></View>
              <View style={styles.stat}><AppText variant="small" color={colors.textMuted}>Total belanja</AppText><AppText variant="heading" style={{ fontWeight: '800' }}>{formatRupiah(Number(customer.total_spent))}</AppText></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {waNumber ? <PillButton label="WhatsApp" Icon={ChatIcon} onPress={() => Linking.openURL(`https://wa.me/${waNumber}`)} style={{ flex: 1 }} /> : null}
              <PillButton label="Ubah data" Icon={PencilIcon} tone="outline" onPress={() => setEditing(true)} style={{ flex: 1 }} />
            </View>
            <AppText variant="small" color={colors.textMuted}>Pelanggan sejak {formatDate(customer.created_at)}</AppText>
            <PillButton label="Hapus pelanggan" Icon={TrashIcon} tone="danger" onPress={confirmDelete} style={{ alignSelf: 'flex-start' }} />
          </View>
        )}

        <View style={{ gap: space.sm }}>
          <SectionLabel right={history.length ? <AppText variant="small" color={colors.textMuted}>{history.length} order</AppText> : undefined}>Riwayat order</SectionLabel>
          <View style={styles.list}>
            {ordersLoading ? <RowsSkeleton rows={2} /> : history.length === 0 ? (
              <View style={{ paddingVertical: space.lg }}><AppText variant="small" color={colors.textMuted}>Belum ada order tercatat untuk pelanggan ini.</AppText></View>
            ) : history.map((o, i) => <OrderListRow key={o.id} order={o} first={i === 0} showTime={false} showDate />)}
          </View>
        </View>
      </ScrollView>
      {!editing ? (
        <StickyFooter>
          <CapsuleButton label="Tambah order untuk pelanggan ini" onPress={newOrder} />
        </StickyFooter>
      ) : null}
    </KeyboardSafeView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 14, gap: 12 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: colors.brandSoft },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.fill, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  list: { backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 14 },
});
