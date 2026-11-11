import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import type { CustomerRow } from '~/data/db';
import { updateCustomer } from '~/data/customers';
import { ordersForCustomer } from '~/data/orders';
import { useCustomers, useOrders, useRefreshingMutation } from '~/hooks/queries';
import { formatDate } from '~/lib/dates';
import { formatRupiah } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, Badge, Button, Card, Divider, EmptyState, ErrorState, LoadingState, Notice, Row, Screen, SectionTitle, TextField } from '~/ui/components';
import { OrderRow } from '~/ui/OrderRow';
import { colors, space } from '~/ui/theme';

const TIER_LABEL: Record<string, string> = { satuan: 'Satuan', reseller: 'Reseller', agen: 'Agen', agen_plus: 'Agen Plus', sap: 'SAP', se: 'SE' };

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customers = useCustomers();
  const orders = useOrders();
  if (customers.isPending) return <LoadingState />;
  if (customers.isError) return <ErrorState message={errorMessage(customers.error)} onRetry={() => customers.refetch()} />;
  const customer = customers.data.find(c => c.id === id);
  if (!customer) return <ErrorState message="Pelanggan tidak ditemukan." />;
  const history = orders.data ? ordersForCustomer(orders.data, customer) : [];
  return <CustomerDetail customer={customer} history={history} ordersLoading={orders.isPending} />;
}

function CustomerDetail({ customer, history, ordersLoading }: { customer: CustomerRow; history: ReturnType<typeof ordersForCustomer>; ordersLoading: boolean }) {
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState({ name: customer.name, phone: customer.phone ?? '', address: customer.address ?? '', city: customer.city ?? '', province: customer.province ?? '' });
  const [error, setError] = useState<string | null>(null);
  const save = useRefreshingMutation((f: typeof fields) => updateCustomer(customer.id, f), ['customers']);
  const set = (key: keyof typeof fields) => (value: string) => setFields(prev => ({ ...prev, [key]: value }));
  const waNumber = (customer.phone ?? '').replace(/\D/g, '').replace(/^0/, '62');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: customer.name }} />
      <Screen>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Card>
          {editing ? (
            <>
              <TextField label="Nama" value={fields.name} onChangeText={set('name')} />
              <TextField label="No. WhatsApp" value={fields.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
              <TextField label="Alamat" value={fields.address} onChangeText={set('address')} multiline style={{ minHeight: 72, textAlignVertical: 'top', paddingTop: 12 }} />
              <TextField label="Kota" value={fields.city} onChangeText={set('city')} />
              <TextField label="Provinsi" value={fields.province} onChangeText={set('province')} />
              <Button label="Simpan" loading={save.isPending} onPress={() => save.mutate(fields, { onSuccess: () => { setEditing(false); setError(null); }, onError: e => setError(errorMessage(e)) })} />
              <Button label="Batal" tone="ghost" onPress={() => setEditing(false)} />
            </>
          ) : (
            <>
              <AppText variant="title" selectable>{customer.name}</AppText>
              <Badge label={TIER_LABEL[customer.tier] ?? customer.tier} tone="success" />
              {customer.phone ? <AppText variant="body" color={colors.textMuted} selectable>{customer.phone}</AppText> : null}
              {customer.address ? <AppText variant="body" color={colors.textMuted} selectable>{[customer.address, customer.city, customer.province].filter(Boolean).join(', ')}</AppText> : null}
              <Row style={{ gap: space.xl }}>
                <View><AppText variant="caption" color={colors.textMuted}>ORDER</AppText><AppText variant="heading">{customer.total_orders}</AppText></View>
                <View><AppText variant="caption" color={colors.textMuted}>TOTAL BELANJA</AppText><AppText variant="heading">{formatRupiah(Number(customer.total_spent))}</AppText></View>
              </Row>
              <AppText variant="small" color={colors.textSubtle}>Pelanggan sejak {formatDate(customer.created_at)}</AppText>
              <Row>
                {waNumber ? <Button label="WhatsApp" icon="logo-whatsapp" tone="secondary" onPress={() => Linking.openURL(`https://wa.me/${waNumber}`)} style={{ flex: 1 }} /> : null}
                <Button label="Ubah" icon="create-outline" tone="secondary" onPress={() => setEditing(true)} style={{ flex: 1 }} />
              </Row>
              <Button label="Tambah order untuk pelanggan ini" icon="add-circle" onPress={() => router.push({ pathname: '/order/new', params: { draft: JSON.stringify({ customerName: customer.name, customerPhone: customer.phone ?? '', customerId: customer.id, tier: customer.tier }) } })} />
            </>
          )}
        </Card>

        <SectionTitle>Riwayat order</SectionTitle>
        <Card style={{ paddingVertical: space.xs }}>
          {ordersLoading ? (
            <LoadingState />
          ) : history.length === 0 ? (
            <EmptyState icon="receipt-outline" title="Belum ada order tercatat" />
          ) : (
            history.map((o, i) => (
              <View key={o.id}>
                {i > 0 ? <Divider /> : null}
                <View style={{ gap: 2 }}>
                  <AppText variant="small" color={colors.textMuted} style={{ paddingTop: space.sm }}>{formatDate(o.created_at)}</AppText>
                  <OrderRow order={o} showTime={false} />
                </View>
              </View>
            ))
          )}
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}
