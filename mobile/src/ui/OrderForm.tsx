import { useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import type { TierType } from '@/types';
import { getFallbackUnitPrice } from '@/lib/catalogPricing';

import type { CustomerRow } from '~/data/db';
import { recordCustomerPurchase } from '~/data/customers';
import { createOrder, updateOrder } from '~/data/orders';
import { useCatalog, useCustomers, useProfile, useRefreshingMutation, useStock } from '~/hooks/queries';
import { businessDateToISO, formatDate, sameDay } from '~/lib/dates';
import { formatNumberInput, formatRupiah, formatRupiahShort, parseRupiahInput } from '~/lib/money';
import { buyPricePerBottle, computeOrderTotals, priceItems, productCategories, productDisplayName, type DraftExpense, type DraftItem } from '~/lib/orderMath';
import { priceOptions, selectedOption, TIER_LABEL, TIER_MIN_BOTTLES } from '~/lib/priceOptions';
import { errorMessage } from '~/lib/supabase';
import { AppText, Button, ErrorState, Icon, LoadingState, Notice, Row, TextField } from './components';
import { DateField } from './DateField';
import { ProductPicker } from './ProductPicker';
import { productImage } from './productMedia';
import { ProofPicker } from './ProofPicker';
import { CapsuleButton, RouteCard, SheetHeader, SheetRow, StickyFooter } from './sheet';
import { colors, radius, space } from './theme';

const TIERS: TierType[] = ['satuan', 'reseller', 'agen', 'agen_plus', 'sap', 'se'];

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

type Panel = 'none' | 'date' | 'expenses' | 'proof';

/** Add or edit an order as one sheet: customer → date, products, price option, costs, proof. */
export function OrderForm({ initial = {}, orderId }: { initial?: OrderFormInitial; orderId?: string }) {
  const isEdit = !!orderId;
  const catalog = useCatalog();
  const customers = useCustomers();
  const profile = useProfile();
  const stock = useStock();

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
  const [panel, setPanel] = useState<Panel>('none');
  const [customerOpen, setCustomerOpen] = useState(!isEdit && !initial.customerName);
  const [productsOpen, setProductsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useRefreshingMutation(createOrder, ['orders', 'customers', 'stock']);
  const editId = orderId ?? '';
  const edit = useRefreshingMutation((input: Parameters<typeof createOrder>[0]) => updateOrder(editId, input), ['orders', 'order']);
  const save = isEdit ? edit : create;

  // One line per catalog category; quantities are the only thing the user edits.
  const items = useMemo<DraftItem[]>(
    () =>
      catalog.data
        ? productCategories(catalog.data).map(name => ({ productName: name, quantity: quantities[name] ?? 0, pricePerBottle: getFallbackUnitPrice(name, 'satuan'), subtotal: 0 }))
        : [],
    [catalog.data, quantities],
  );
  const priced = useMemo(() => (catalog.data ? priceItems(items, tier, catalog.data) : null), [items, tier, catalog.data]);
  const options = useMemo(() => (catalog.data ? priceOptions(items, catalog.data) : []), [items, catalog.data]);
  const fixedItems: DraftItem[] = fixedLines.map(l => ({ ...l, subtotal: l.pricePerBottle * l.quantity }));
  // When editing, keep the saved prices until the user changes products or the price tier.
  const keepSaved = isEdit && !pricesTouched && !!initial.savedItems;
  const pricedItems = keepSaved && initial.savedItems ? initial.savedItems : [...(priced?.items ?? items), ...fixedItems];
  const activeItems = pricedItems.filter(i => i.quantity > 0);
  const level = profile.data?.mitra_level ?? 'reseller';
  const costPerBottle = buyPricePerBottle(level, profile.data?.custom_buy_price);
  const totals = computeOrderTotals(pricedItems, expenses, costPerBottle);
  const missingPrices = priced?.missing.filter(name => activeItems.some(i => i.productName === name)) ?? [];
  const dirty = isEdit || !!customerName || activeItems.length > 0;
  const savedTotal = initial.savedItems?.reduce((s, i) => s + i.subtotal, 0);
  const currentOption = selectedOption(tier, activeItems);

  const suggestions = useMemo(() => {
    const q = customerName.trim().toLowerCase();
    if (!q || customerId) return [];
    return (customers.data ?? []).filter(c => c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q)).slice(0, 6);
  }, [customerName, customerId, customers.data]);

  if (catalog.isPending || profile.isPending) return <LoadingState label="Menyiapkan katalog…" />;
  if (catalog.isError) return <ErrorState message={errorMessage(catalog.error)} onRetry={() => catalog.refetch()} />;
  if (catalog.data.length === 0) return <ErrorState message="Katalog produk belum tersedia. Hubungi admin." onRetry={() => catalog.refetch()} />;

  const touch = () => setPricesTouched(true);
  const setQty = (name: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [name]: Math.max(0, quantity) }));
    touch();
  };
  const setFixedQty = (name: string, quantity: number) => {
    setFixedLines(prev => prev.map(l => (l.productName === name ? { ...l, quantity: Math.max(0, quantity) } : l)));
    touch();
  };
  const pickTier = (t: TierType) => {
    setTierState(t);
    touch();
  };
  const pickCustomer = (c: CustomerRow) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone ?? '');
    setCustomerId(c.id);
    setTierState((TIERS.includes(c.tier as TierType) ? c.tier : 'satuan') as TierType);
    touch();
    setCustomerOpen(false);
  };
  const togglePanel = (p: Panel) => setPanel(prev => (prev === p ? 'none' : p));

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

  const submit = () => {
    setError(null);
    if (!customerName.trim()) {
      setCustomerOpen(true);
      return setError('Isi nama pelanggan.');
    }
    if (activeItems.length === 0) {
      setProductsOpen(true);
      return setError('Tambahkan minimal satu produk.');
    }
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
      edit.mutate(payload, { onSuccess: () => router.back(), onError: e => setError(errorMessage(e, 'Perubahan gagal disimpan. Coba lagi.')) });
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

  const confirmLeave = () => {
    if (!dirty) return router.back();
    Alert.alert(isEdit ? 'Batalkan perubahan?' : 'Batalkan order ini?', 'Isian yang belum disimpan akan hilang.', [
      { text: 'Lanjut mengisi', style: 'cancel' },
      { text: 'Batalkan', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const today = sameDay(date, new Date());
  const pickerLines = (priced?.items ?? items).map(i => ({ productName: i.productName, quantity: i.quantity, pricePerBottle: i.pricePerBottle }));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: !dirty }} />
      <SheetHeader title={isEdit ? 'Ubah order' : 'Order baru'} onClose={confirmLeave} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {initial.notices?.map(n => <Notice key={n.text} tone={n.tone}>{n.text}</Notice>)}
        {error ? <Notice tone="danger">{error}</Notice> : null}

        <RouteCard
          stops={[
            {
              label: 'Pelanggan',
              value: customerName ? `${customerName}${customerId ? '' : ' · baru'}` : 'Pilih atau ketik nama',
              marker: 'dot',
              action: customerName ? 'Ganti' : 'Isi',
              onPress: () => setCustomerOpen(true),
            },
            {
              label: 'Tanggal',
              value: today ? `Hari ini, ${formatDate(date.toISOString())}` : formatDate(date.toISOString()),
              marker: 'square',
              action: 'Ubah',
              onPress: () => togglePanel('date'),
            },
          ]}
        />
        {panel === 'date' ? <DateField label="Tanggal transaksi" value={date} onChange={d => { setDate(d); setPanel('none'); }} /> : null}

        <View style={{ gap: space.md }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <AppText variant="heading" style={{ fontWeight: '800' }}>Produk</AppText>
            <AppText variant="small" color={colors.textMuted}>{totals.totalQuantity} botol</AppText>
          </Row>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {activeItems.map(item => (
              <Pressable key={item.productName} onPress={() => setProductsOpen(true)} accessibilityRole="button" accessibilityLabel={`${productDisplayName(item.productName)}, ${item.quantity} botol. Ketuk untuk mengubah.`} style={styles.chip}>
                <View>
                  <ProductThumb name={item.productName} size={72} />
                  <View style={styles.badge}><AppText variant="caption" color={colors.white} style={{ fontSize: 13, fontWeight: '800', letterSpacing: 0 }}>{item.quantity}</AppText></View>
                </View>
                <AppText variant="caption" style={{ textAlign: 'center', letterSpacing: 0 }} numberOfLines={2}>{productDisplayName(item.productName)}</AppText>
              </Pressable>
            ))}
            <Pressable onPress={() => setProductsOpen(true)} accessibilityRole="button" accessibilityLabel="Tambah produk" style={styles.chip}>
              <View style={styles.addTile}><Icon name="add" size={28} color={colors.brand} /></View>
              <AppText variant="caption" color={colors.brand} style={{ textAlign: 'center', letterSpacing: 0 }}>{activeItems.length ? 'Tambah' : 'Pilih produk'}</AppText>
            </Pressable>
          </ScrollView>
          {fixedLines.length > 0 ? (
            <View style={{ gap: space.sm }}>
              <AppText variant="small" color={colors.textMuted}>Produk lain di order ini (harga tersimpan)</AppText>
              {fixedLines.map(line => (
                <Row key={line.productName} style={{ justifyContent: 'space-between' }}>
                  <AppText variant="body" style={{ flex: 1 }}>{line.productName} · {formatRupiah(line.pricePerBottle)}</AppText>
                  <Pressable onPress={() => setFixedQty(line.productName, line.quantity - 1)} accessibilityRole="button" accessibilityLabel={`Kurangi ${line.productName}`} style={styles.miniBtn}><Icon name="remove" size={18} color={colors.brand} /></Pressable>
                  <AppText variant="bodyStrong">{line.quantity}</AppText>
                  <Pressable onPress={() => setFixedQty(line.productName, line.quantity + 1)} accessibilityRole="button" accessibilityLabel={`Tambah ${line.productName}`} style={styles.miniBtn}><Icon name="add" size={18} color={colors.brand} /></Pressable>
                </Row>
              ))}
            </View>
          ) : null}
          {missingPrices.length > 0 ? (
            <Notice tone="warning" title="Harga katalog belum ada">{missingPrices.map(productDisplayName).join(', ')} memakai harga cadangan. Periksa nominalnya.</Notice>
          ) : null}
        </View>

        {options.length > 0 ? (
          <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
            <AppText variant="heading" style={{ fontWeight: '800' }}>Pilih harga</AppText>
            {keepSaved ? <Notice tone="info">Harga tersimpan dipakai. Mengubah produk atau harga akan menghitung ulang dari katalog.</Notice> : null}
            {options.map(option => {
              const selected = !keepSaved && option.tier === currentOption;
              return (
                <Pressable
                  key={option.tier}
                  onPress={() => pickTier(option.tier)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Harga ${option.label}, ${formatRupiah(option.total)}`}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <View style={[styles.optionIcon, selected && { backgroundColor: colors.brand }]}>
                    <AppText variant="caption" color={selected ? colors.white : '#3A3A3C'} style={{ fontSize: 13, fontWeight: '800', letterSpacing: 0 }}>{TIER_MIN_BOTTLES[option.tier]}+</AppText>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="bodyStrong">{option.label}</AppText>
                    <AppText variant="small" color={option.byQuantity ? colors.brand : colors.textMuted} style={{ fontSize: 13, fontWeight: option.byQuantity ? '600' : '400' }}>
                      {option.byQuantity ? 'Sesuai jumlah botol' : `Untuk pelanggan level ${option.label}`}
                    </AppText>
                  </View>
                  <AppText variant="bodyStrong" style={{ fontWeight: selected ? '800' : '600' }}>{formatRupiah(option.total)}</AppText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View>
          <SheetRow first label="Biaya order" value={expenses.length ? `${expenses.length > 1 ? `${expenses.length} biaya` : expenses[0].name} ${formatRupiah(totals.totalExpenses)}` : 'Tidak ada'} valueColor={expenses.length ? colors.text : colors.textMuted} onPress={() => togglePanel('expenses')} />
          {panel === 'expenses' ? (
            <View style={styles.panel}>
              <AppText variant="small" color={colors.textMuted}>Ongkir yang kamu tanggung, infaq, packing. Mengurangi untung, bukan omset.</AppText>
              {expenses.map((e, i) => (
                <Row key={`${e.name}-${i}`} style={{ justifyContent: 'space-between' }}>
                  <AppText variant="body" style={{ flex: 1 }}>{e.name}</AppText>
                  <AppText variant="bodyStrong">{formatRupiah(e.amount)}</AppText>
                  <Pressable onPress={() => setExpenses(prev => prev.filter((_, j) => j !== i))} accessibilityRole="button" accessibilityLabel={`Hapus biaya ${e.name}`} hitSlop={10} style={{ padding: 6 }}>
                    <Icon name="remove-circle" size={22} color={colors.danger} />
                  </Pressable>
                </Row>
              ))}
              <Row style={{ alignItems: 'flex-end' }}>
                <View style={{ flex: 1.3 }}><TextField label="Nama biaya" value={expenseName} onChangeText={setExpenseName} placeholder="Ongkir" /></View>
                <View style={{ flex: 1 }}><TextField label="Nominal" value={formatNumberInput(expenseAmount)} onChangeText={t => setExpenseAmount(parseRupiahInput(t))} keyboardType="number-pad" placeholder="12.000" /></View>
              </Row>
              <Button label="Tambah biaya" icon="add" tone="secondary" onPress={addExpense} />
            </View>
          ) : null}
          <SheetRow label="Bukti transfer" value={proofUrl ? 'Terlampir' : 'Belum ada'} valueColor={proofUrl ? colors.brand : colors.textMuted} onPress={() => togglePanel('proof')} />
          {panel === 'proof' ? <View style={styles.panel}><ProofPicker value={proofUrl} onChange={setProofUrl} label="Foto bukti transfer" /></View> : null}
        </View>

        {isEdit && savedTotal != null && savedTotal !== totals.totalPrice ? (
          <Notice tone="info">Total berubah dari {formatRupiah(savedTotal)} menjadi {formatRupiah(totals.totalPrice)}.</Notice>
        ) : null}
        {totals.margin < 0 && activeItems.length ? <Notice tone="warning">Order ini rugi {formatRupiah(-totals.margin)}. Periksa harga atau biaya.</Notice> : null}
        {costPerBottle === 0 ? <Notice tone="warning">Harga modal level kamu belum diisi. Atur di menu Akun.</Notice> : null}
        {stock.data && totals.totalQuantity > stock.data.currentStock ? <Notice tone="info">Stok tercatat {stock.data.currentStock} botol, lebih sedikit dari order ini.</Notice> : null}
      </ScrollView>

      <StickyFooter>
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText variant="small" color={colors.textMuted} numberOfLines={1} style={{ flex: 1 }}>
            {activeItems.length ? `Modal ${formatRupiahShort(totals.buyPrice)} · Biaya ${formatRupiahShort(totals.totalExpenses)}` : 'Pilih produk untuk melihat untung'}
          </AppText>
          {activeItems.length ? (
            <AppText variant="small" color={totals.margin < 0 ? colors.danger : colors.brand} style={{ fontWeight: '700' }} numberOfLines={1}>
              {totals.margin < 0 ? 'Rugi ' : 'Untung '}{formatRupiah(Math.abs(totals.margin))}
            </AppText>
          ) : null}
        </Row>
        <CapsuleButton label={isEdit ? 'Simpan perubahan' : 'Simpan order'} value={formatRupiah(totals.totalPrice)} onPress={submit} loading={save.isPending} />
      </StickyFooter>

      <ProductPicker
        visible={productsOpen}
        lines={pickerLines}
        onChange={setQty}
        onClose={() => setProductsOpen(false)}
        totalLabel={`${totals.totalQuantity} botol · ${formatRupiah(totals.totalPrice)}`}
      />

      <Modal visible={customerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCustomerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.white }}>
          <SheetHeader title="Pelanggan" onClose={() => setCustomerOpen(false)} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <TextField
              label="Nama pelanggan"
              value={customerName}
              onChangeText={t => { setCustomerName(t); setCustomerId(null); }}
              placeholder="Cari atau ketik nama baru"
              autoCapitalize="words"
              autoFocus
            />
            {suggestions.map(c => (
              <Pressable key={c.id} onPress={() => pickCustomer(c)} accessibilityRole="button" accessibilityLabel={`Pilih ${c.name}`} style={({ pressed }) => [styles.suggestion, pressed && { backgroundColor: colors.fill }]}>
                <View style={styles.avatar}><AppText variant="bodyStrong" color={colors.brand}>{c.name.slice(0, 1).toUpperCase()}</AppText></View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{c.name}</AppText>
                  <AppText variant="small" color={colors.textMuted}>{TIER_LABEL[c.tier as TierType] ?? c.tier}{c.phone ? ` · ${c.phone}` : ''} · {c.total_orders} order</AppText>
                </View>
              </Pressable>
            ))}
            {customerName.trim() && !customerId && suggestions.length === 0 ? (
              <Notice tone="info">Pelanggan baru “{customerName.trim()}” akan disimpan bersama order.</Notice>
            ) : null}
            <TextField label="No. WhatsApp (opsional)" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" placeholder="08…" />
          </ScrollView>
          <StickyFooter>
            <CapsuleButton label="Pakai pelanggan ini" onPress={() => setCustomerOpen(false)} disabled={!customerName.trim()} />
          </StickyFooter>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function ProductThumb({ name, size }: { name: string; size: number }) {
  const image = productImage(name);
  if (image) return <Image source={image} style={{ width: size, height: size, borderRadius: 16 }} accessibilityIgnoresInvertColors />;
  return (
    <View style={{ width: size, height: size, borderRadius: 16, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="heading" color={colors.textMuted}>{productDisplayName(name).slice(0, 2).toUpperCase()}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxxl },
  chips: { gap: space.sm, paddingTop: 6 },
  chip: { width: 84, alignItems: 'center', gap: 6 },
  badge: { position: 'absolute', top: -6, right: -6, minWidth: 26, height: 26, paddingHorizontal: 6, borderRadius: 13, backgroundColor: colors.brand, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  addTile: { width: 72, height: 72, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#9DB3A8', alignItems: 'center', justifyContent: 'center' },
  miniBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white },
  optionSelected: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  optionIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  panel: { gap: space.md, paddingBottom: space.md },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 60, paddingHorizontal: space.sm, borderRadius: radius.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
});
