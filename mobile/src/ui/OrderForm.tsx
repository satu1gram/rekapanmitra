import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TIER_PRICING, type TierType } from '@/types';
import { getFallbackUnitPrice } from '@/lib/catalogPricing';

import type { CustomerRow } from '~/data/db';
import { recordCustomerPurchase } from '~/data/customers';
import { createOrder, updateOrder } from '~/data/orders';
import { useCatalog, useCustomers, useProfile, useRefreshingMutation, useStock } from '~/hooks/queries';
import { businessDateToISO } from '~/lib/dates';
import { formatNumberInput, formatRupiah, parseRupiahInput } from '~/lib/money';
import { buyPricePerBottle, computeOrderTotals, priceItems, productCategories, productDisplayName, type DraftExpense, type DraftItem } from '~/lib/orderMath';
import { errorMessage } from '~/lib/supabase';
import { AppText, Button, Card, Divider, ErrorState, Icon, LoadingState, Notice, Row, Stepper, TextField } from '~/ui/components';
import { DateField } from './DateField';
import { ProofPicker } from './ProofPicker';
import { colors, radius, space } from '~/ui/theme';

type Step = 0 | 1 | 2;
const STEP_TITLES = ['Pelanggan', 'Produk', 'Periksa'];
const TIERS: TierType[] = ['satuan', 'reseller', 'agen', 'agen_plus', 'sap', 'se'];
const TIER_SHORT: Record<TierType, string> = { satuan: 'Satuan', reseller: 'Reseller', agen: 'Agen', agen_plus: 'Agen Plus', sap: 'SAP', se: 'SE' };

/** A line from an existing order that does not match any catalog category; it keeps its saved price. */
export interface FixedLine {
  productName: string;
  pricePerBottle: number;
  quantity: number;
  productId?: string | null;
}

export interface OrderFormInitial {
  date?: Date;
  customerName?: string;
  customerPhone?: string;
  customerId?: string | null;
  tier?: TierType;
  quantities?: Record<string, number>;
  fixedLines?: FixedLine[];
  /** Saved lines of an order being edited, used as-is until products or tier change. */
  savedItems?: DraftItem[];
  expenses?: DraftExpense[];
  transferProofUrl?: string | null;
  /** Shown above the form, e.g. what the AI could not read. */
  notices?: { tone: 'info' | 'warning'; text: string }[];
}

export function OrderForm({ initial = {}, orderId }: { initial?: OrderFormInitial; orderId?: string }) {
  const isEdit = !!orderId;
  const insets = useSafeAreaInsets();
  const catalog = useCatalog();
  const customers = useCustomers();
  const profile = useProfile();
  const stock = useStock();

  const [step, setStep] = useState<Step>(0);
  const [date, setDate] = useState(initial.date ?? new Date());
  const [customerName, setCustomerName] = useState(initial.customerName ?? '');
  const [customerPhone, setCustomerPhone] = useState(initial.customerPhone ?? '');
  const [customerId, setCustomerId] = useState<string | null>(initial.customerId ?? null);
  const [tier, setTierState] = useState<TierType>(initial.tier ?? 'satuan');
  const [quantities, setQuantities] = useState<Record<string, number>>(initial.quantities ?? {});
  const [fixedLines, setFixedLines] = useState<FixedLine[]>(initial.fixedLines ?? []);
  const [pricesTouched, setPricesTouched] = useState(false);
  const [expenses, setExpenses] = useState<DraftExpense[]>(initial.expenses ?? []);
  const [proofUrl, setProofUrl] = useState<string | null>(initial.transferProofUrl ?? null);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = useRefreshingMutation(createOrder, ['orders', 'customers', 'stock']);
  const edit = useRefreshingMutation((input: Parameters<typeof createOrder>[0]) => updateOrder(orderId!, input), ['orders', 'order']);
  const save = isEdit ? edit : create;
  const setTier = (t: TierType) => {
    setTierState(t);
    setPricesTouched(true);
  };

  // One line per catalog category; quantities are the only thing the user edits.
  const items = useMemo<DraftItem[]>(
    () =>
      catalog.data
        ? productCategories(catalog.data).map(name => ({ productName: name, quantity: quantities[name] ?? 0, pricePerBottle: getFallbackUnitPrice(name, 'satuan'), subtotal: 0 }))
        : [],
    [catalog.data, quantities],
  );

  const priced = useMemo(() => (catalog.data ? priceItems(items, tier, catalog.data) : null), [items, tier, catalog.data]);
  const fixedItems: DraftItem[] = fixedLines.map(l => ({ ...l, subtotal: l.pricePerBottle * l.quantity }));
  // When editing, keep the saved prices until the user changes products or the price tier.
  const keepSaved = isEdit && !pricesTouched && !!initial.savedItems;
  const pricedItems = keepSaved ? initial.savedItems! : [...(priced?.items ?? items), ...fixedItems];
  const activeItems = pricedItems.filter(i => i.quantity > 0);
  const level = profile.data?.mitra_level ?? 'reseller';
  const costPerBottle = buyPricePerBottle(level, profile.data?.custom_buy_price);
  const totals = computeOrderTotals(pricedItems, expenses, costPerBottle);
  const missingPrices = priced?.missing.filter(name => activeItems.some(i => i.productName === name)) ?? [];
  const dirty = isEdit || !!customerName || activeItems.length > 0;
  const savedTotal = initial.savedItems?.reduce((s, i) => s + i.subtotal, 0);

  const suggestions = useMemo(() => {
    const q = customerName.trim().toLowerCase();
    if (!q || customerId) return [];
    return (customers.data ?? []).filter(c => c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q)).slice(0, 5);
  }, [customerName, customerId, customers.data]);

  if (catalog.isPending || profile.isPending) return <LoadingState label="Menyiapkan katalog…" />;
  if (catalog.isError) return <ErrorState message={errorMessage(catalog.error)} onRetry={() => catalog.refetch()} />;
  if (catalog.data.length === 0) return <ErrorState message="Katalog produk belum tersedia. Hubungi admin." onRetry={() => catalog.refetch()} />;

  const pickCustomer = (c: CustomerRow) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone ?? '');
    setCustomerId(c.id);
    setTier((TIERS.includes(c.tier as TierType) ? c.tier : 'satuan') as TierType);
  };

  const setQty = (name: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [name]: quantity }));
    setPricesTouched(true);
  };
  const setFixedQty = (name: string, quantity: number) => {
    setFixedLines(prev => prev.map(l => (l.productName === name ? { ...l, quantity } : l)));
    setPricesTouched(true);
  };

  const addExpense = () => {
    if (!expenseName.trim() || !expenseAmount) {
      setError('Isi nama dan nominal biaya.');
      return;
    }
    setExpenses(prev => [...prev, { name: expenseName.trim(), amount: expenseAmount }]);
    setExpenseName('');
    setExpenseAmount(null);
    setError(null);
  };

  const next = () => {
    setError(null);
    if (step === 0) {
      if (!customerName.trim()) return setError('Isi nama pelanggan.');
      setStep(1);
    } else if (step === 1) {
      if (activeItems.length === 0) return setError('Tambahkan minimal satu produk.');
      setStep(2);
    } else {
      submit();
    }
  };

  const submit = () => {
    const payload = {
      customerName,
      customerPhone,
      customerId,
      tier,
      items: activeItems,
      expenses,
      mitraLevel: level,
      customBuyPrice: profile.data?.custom_buy_price ?? null,
      createdAt: isEdit && initial.date && date.getTime() === initial.date.getTime() ? initial.date.toISOString() : businessDateToISO(date),
      transferProofUrl: proofUrl,
    };
    if (isEdit) {
      edit.mutate(payload, {
        onSuccess: () => router.back(),
        onError: e => setError(errorMessage(e, 'Perubahan gagal disimpan. Coba lagi.')),
      });
      return;
    }
    create.mutate(payload, {
      onSuccess: order => {
        // Customer stats are secondary; the order is already saved (same as the web app).
        recordCustomerPurchase(customers.data ?? [], { customerName, customerPhone, tier, totalPrice: totals.totalPrice }).catch(() => undefined);
        router.replace({ pathname: '/order/[id]', params: { id: order.id } });
      },
      onError: e => setError(errorMessage(e, 'Order gagal disimpan. Coba lagi.')),
    });
  };

  const back = () => (step === 0 ? confirmLeave() : setStep((step - 1) as Step));
  const confirmLeave = () => {
    if (!dirty) return router.back();
    Alert.alert(isEdit ? 'Batalkan perubahan?' : 'Batalkan order ini?', 'Isian yang belum disimpan akan hilang.', [
      { text: 'Lanjut mengisi', style: 'cancel' },
      { text: 'Batalkan', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <Stack.Screen
        options={{
          gestureEnabled: !dirty,
          headerLeft: () => (
            <Pressable onPress={confirmLeave} accessibilityRole="button" accessibilityLabel="Tutup" hitSlop={10}>
              <AppText variant="bodyStrong" color={colors.brandDark}>Batal</AppText>
            </Pressable>
          ),
        }}
      />
      <View style={styles.steps}>
        {STEP_TITLES.map((title, i) => (
          <View key={title} style={{ flex: 1, gap: 6 }} accessibilityLabel={`Langkah ${i + 1} dari 3: ${title}${i === step ? ', sedang dibuka' : ''}`}>
            <View style={[styles.stepBar, i <= step && { backgroundColor: colors.brand }]} />
            <AppText variant="caption" color={i === step ? colors.brandDark : colors.textSubtle}>{title.toUpperCase()}</AppText>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {step === 0 ? initial.notices?.map(n => <Notice key={n.text} tone={n.tone}>{n.text}</Notice>) : null}

        {step === 0 ? (
          <>
            <Card>
              <DateField label="Tanggal transaksi" value={date} onChange={setDate} />
              <TextField
                label="Nama pelanggan"
                value={customerName}
                onChangeText={t => { setCustomerName(t); setCustomerId(null); }}
                placeholder="Cari atau ketik nama baru"
                autoCapitalize="words"
              />
              {suggestions.length > 0 ? (
                <View style={styles.suggestions}>
                  {suggestions.map((c, i) => (
                    <View key={c.id}>
                      {i > 0 ? <Divider /> : null}
                      <Pressable onPress={() => pickCustomer(c)} accessibilityRole="button" accessibilityLabel={`Pilih ${c.name}`} style={styles.suggestion}>
                        <Icon name="person-circle-outline" color={colors.brandDark} />
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyStrong">{c.name}</AppText>
                          <AppText variant="small" color={colors.textMuted}>{TIER_SHORT[c.tier as TierType] ?? c.tier}{c.phone ? ` · ${c.phone}` : ''} · {c.total_orders} order</AppText>
                        </View>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
              {customerId ? <Notice tone="success">Pelanggan lama dipilih. Riwayat belanjanya akan diperbarui.</Notice> : null}
              <TextField label="No. WhatsApp (opsional)" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" placeholder="08…" />
            </Card>
            <Card>
              <AppText variant="heading">Harga untuk pelanggan</AppText>
              <AppText variant="small" color={colors.textMuted}>Harga paket otomatis naik jika jumlah botol mencapai paket berikutnya.</AppText>
              <View style={styles.chips}>
                {TIERS.map(t => (
                  <Pressable
                    key={t}
                    onPress={() => setTier(t)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: tier === t }}
                    style={[styles.chip, tier === t && styles.chipActive]}
                  >
                    <AppText variant="small" color={tier === t ? colors.white : colors.text} style={{ fontWeight: '600' }}>
                      {TIER_SHORT[t]}{t === 'satuan' ? '' : ` (${TIER_PRICING[t].bottles}+)`}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </Card>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Card style={{ gap: 0, paddingVertical: space.xs }}>
              {(priced?.items ?? items).map((item, i) => (
                <View key={item.productName}>
                  {i > 0 ? <Divider /> : null}
                  <View style={styles.productRow}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="bodyStrong">{productDisplayName(item.productName)}</AppText>
                      <AppText variant="small" color={colors.textMuted}>
                        {formatRupiah(item.pricePerBottle)} / botol{item.quantity > 0 ? ` · ${formatRupiah(item.subtotal)}` : ''}
                      </AppText>
                    </View>
                    <Stepper label={productDisplayName(item.productName)} value={item.quantity} onChange={q => setQty(item.productName, q)} />
                  </View>
                </View>
              ))}
            </Card>
            {fixedLines.length > 0 ? (
              <Card style={{ gap: 0, paddingVertical: space.xs }}>
                <AppText variant="small" color={colors.textMuted} style={{ paddingTop: space.sm }}>Produk lain di order ini (harga tersimpan)</AppText>
                {fixedLines.map(line => (
                  <View key={line.productName} style={styles.productRow}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="bodyStrong">{line.productName}</AppText>
                      <AppText variant="small" color={colors.textMuted}>{formatRupiah(line.pricePerBottle)} / botol</AppText>
                    </View>
                    <Stepper label={line.productName} value={line.quantity} onChange={q => setFixedQty(line.productName, q)} />
                  </View>
                ))}
              </Card>
            ) : null}
            {keepSaved ? <Notice tone="info">Harga tersimpan dipakai. Jika jumlah produk atau harga pelanggan diubah, harga dihitung ulang dari katalog saat ini.</Notice> : null}
            {priced && !keepSaved && priced.activeTier !== tier ? (
              <Notice tone="success">Harga paket {TIER_SHORT[priced.activeTier]} berlaku untuk {totals.totalQuantity} botol.</Notice>
            ) : null}
            {missingPrices.length > 0 ? (
              <Notice tone="warning" title="Harga katalog belum ada">
                {missingPrices.map(productDisplayName).join(', ')} memakai harga cadangan. Periksa nominalnya sebelum menyimpan.
              </Notice>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Card>
              <AppText variant="small" color={colors.textMuted}>Pelanggan</AppText>
              <AppText variant="heading">{customerName}</AppText>
              {activeItems.map(item => (
                <Row key={item.productName} style={{ justifyContent: 'space-between' }}>
                  <AppText variant="body" style={{ flex: 1 }}>{productDisplayName(item.productName)} × {item.quantity}</AppText>
                  <AppText variant="bodyStrong">{formatRupiah(item.subtotal)}</AppText>
                </Row>
              ))}
            </Card>

            <Card>
              <AppText variant="heading">Biaya order</AppText>
              <AppText variant="small" color={colors.textMuted}>Contoh: ongkir yang kamu tanggung, infaq, packing. Mengurangi untung, bukan omset.</AppText>
              {expenses.map((e, i) => (
                <Row key={`${e.name}-${i}`} style={{ justifyContent: 'space-between' }}>
                  <AppText variant="body" style={{ flex: 1 }}>{e.name}</AppText>
                  <AppText variant="bodyStrong">{formatRupiah(e.amount)}</AppText>
                  <Pressable onPress={() => setExpenses(prev => prev.filter((_, j) => j !== i))} accessibilityRole="button" accessibilityLabel={`Hapus biaya ${e.name}`} hitSlop={10} style={{ padding: 6 }}>
                    <Icon name="close-circle" color={colors.textSubtle} />
                  </Pressable>
                </Row>
              ))}
              <TextField label="Nama biaya" value={expenseName} onChangeText={setExpenseName} placeholder="Ongkir" />
              <TextField label="Nominal" value={formatNumberInput(expenseAmount)} onChangeText={t => setExpenseAmount(parseRupiahInput(t))} keyboardType="number-pad" placeholder="12.000" />
              <Button label="Tambah biaya" icon="add" tone="secondary" onPress={addExpense} />
            </Card>

            <Card>
              <ProofPicker value={proofUrl} onChange={setProofUrl} />
            </Card>

            <Card>
              <AppText variant="heading">Ringkasan</AppText>
              <Line label={`Omset (${totals.totalQuantity} botol)`} value={totals.totalPrice} />
              <Line label={`Modal (${formatRupiah(costPerBottle)}/botol)`} value={-totals.buyPrice} />
              <Line label="Biaya order" value={-totals.totalExpenses} />
              <Divider />
              <Row style={{ justifyContent: 'space-between' }}>
                <AppText variant="bodyStrong">{totals.margin < 0 ? 'Rugi' : 'Untung'}</AppText>
                <AppText variant="title" color={totals.margin < 0 ? colors.danger : colors.brandDark}>{formatRupiah(totals.margin)}</AppText>
              </Row>
              {isEdit && savedTotal != null && savedTotal !== totals.totalPrice ? (
                <Notice tone="info">Total berubah dari {formatRupiah(savedTotal)} menjadi {formatRupiah(totals.totalPrice)}.</Notice>
              ) : null}
              {totals.margin < 0 ? <Notice tone="warning">Order ini rugi. Periksa harga atau biaya sebelum menyimpan.</Notice> : null}
              {costPerBottle === 0 ? <Notice tone="warning">Harga modal level kamu belum diisi, untung akan terlihat sama dengan omset. Atur di menu Akun.</Notice> : null}
              {stock.data && totals.totalQuantity > stock.data.currentStock ? (
                <Notice tone="info">Stok tercatat {stock.data.currentStock} botol, lebih sedikit dari order ini.</Notice>
              ) : null}
            </Card>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        <Button label={step === 0 ? 'Batal' : 'Kembali'} tone="secondary" onPress={back} style={{ flex: 1 }} />
        <Button
          label={step === 2 ? `${isEdit ? 'Simpan perubahan' : 'Simpan'} · ${formatRupiah(totals.totalPrice)}` : 'Lanjut'}
          onPress={next}
          loading={save.isPending}
          style={{ flex: 2 }}
        />
      </View>
    </KeyboardAvoidingView>
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

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.white, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  stepBar: { height: 4, borderRadius: 2, backgroundColor: colors.border },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxxl },
  suggestions: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: space.md },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, paddingVertical: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { minHeight: 40, paddingHorizontal: space.md, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  actions: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
});
