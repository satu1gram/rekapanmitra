import { useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { MITRA_LEVELS, type TierType } from '@/types';
import { getFallbackUnitPrice } from '@/lib/catalogPricing';

import type { CustomerRow } from '~/data/db';
import { recordCustomerPurchase } from '~/data/customers';
import { createOrder, updateOrder } from '~/data/orders';
import { useCatalog, useCustomers, useProfile, useRefreshingMutation, useStock } from '~/hooks/queries';
import { businessDateToISO, formatDate, sameDay } from '~/lib/dates';
import { formatNumberInput, formatRupiah, formatRupiahShort, parseRupiahInput } from '~/lib/money';
import { computeOrderTotals, mitraCostLookup, priceItems, productCategories, productDisplayName, type DraftExpense, type DraftItem } from '~/lib/orderMath';
import { priceOptions, selectedOption, TIER_LABEL, TIER_MIN_BOTTLES } from '~/lib/priceOptions';
import { errorMessage } from '~/lib/supabase';
import { AppText, Button, ErrorState, LoadingState, Notice, Row, TextField } from './components';
import { DateField } from './DateField';
import { MinusCircleIcon, MinusIcon, PlusIcon } from './icons';
import { ProductPicker } from './ProductPicker';
import { productImage } from './productMedia';
import { ProofPicker } from './ProofPicker';
import { CapsuleButton, RouteCard, SheetHeader, SheetRow, StickyFooter } from './sheet';
import { colors, radius, space } from './theme';

const TIERS: TierType[] = ['satuan', 'reseller', 'agen', 'agen_plus', 'sap', 'se'];
/** How a customer's level reads in the form; 'satuan' is an end consumer. */
const TIER_DISPLAY: Record<TierType, string> = { satuan: 'Konsumen', reseller: 'Reseller', agen: 'Agen', agen_plus: 'Agen Plus', sap: 'SAP', se: 'SE' };

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
  const [customerOpen, setCustomerOpen] = useState(false);
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
  const customBuyPrice = profile.data?.custom_buy_price ?? null;
  const costOf = useMemo(() => mitraCostLookup(level, customBuyPrice, catalog.data), [level, customBuyPrice, catalog.data]);
  const totals = computeOrderTotals(pricedItems, expenses, costOf);
  const noCost = activeItems.length > 0 && totals.buyPrice === 0;
  const levelLabel = level === 'custom' ? (profile.data?.custom_level_name || 'Kustom') : MITRA_LEVELS[level]?.label ?? level;
  const fixedNames = new Set(fixedLines.map(l => l.productName));
  const missingPrices = priced?.missing.filter(name => activeItems.some(i => i.productName === name)) ?? [];
  const dirty = isEdit || !!customerName || activeItems.length > 0;
  const savedTotal = initial.savedItems?.reduce((s, i) => s + i.subtotal, 0);
  const currentOption = selectedOption(tier, activeItems);
  const qtyTier = selectedOption('satuan', activeItems);
  const priceReason =
    currentOption === 'satuan'
      ? 'Harga eceran per botol'
      : currentOption === qtyTier
        ? `Otomatis karena ${totals.totalQuantity} botol (min. ${TIER_MIN_BOTTLES[currentOption]})`
        : `Jenjang pelanggan ${TIER_LABEL[currentOption]}`;
  // The next quantity step that would make the price cheaper than what the order gets now.
  const nextTier = TIERS.find(t => TIER_MIN_BOTTLES[t] > totals.totalQuantity && TIERS.indexOf(t) > TIERS.indexOf(currentOption));

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
      customBuyPrice,
      cost: costOf,
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
              value: customerName ? `${customerName} · ${TIER_DISPLAY[tier]}${customerId ? '' : ' · baru'}` : 'Pilih atau ketik nama',
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
        {panel === 'date' ? <DateField label="Tanggal transaksi" value={date} initiallyOpen onChange={d => { setDate(d); setPanel('none'); }} /> : null}

        <View style={styles.section}>
          <Row style={{ justifyContent: 'space-between' }}>
            <AppText variant="heading" style={{ fontWeight: '800' }}>Produk</AppText>
            <AppText variant="small" color={colors.textMuted}>{totals.totalQuantity} botol</AppText>
          </Row>
          <View style={styles.box}>
            {activeItems.map((item, i) => {
              const fixed = fixedNames.has(item.productName);
              const change = (q: number) => (fixed ? setFixedQty(item.productName, q) : setQty(item.productName, q));
              const name = productDisplayName(item.productName);
              return (
                <View key={item.productName} style={[styles.line, i > 0 && styles.sep]}>
                  <ProductThumb name={item.productName} size={40} />
                  <Pressable style={{ flex: 1, gap: 1 }} onPress={() => !fixed && setProductsOpen(true)} accessibilityRole="button" accessibilityLabel={`${name}, ${item.quantity} × ${formatRupiah(item.pricePerBottle)}`}>
                    <AppText variant="bodyStrong" style={{ fontSize: 15 }} numberOfLines={1}>{name}</AppText>
                    <AppText variant="small" color={colors.textMuted} style={{ fontSize: 13 }} numberOfLines={1}>
                      {formatRupiah(item.pricePerBottle)}/botol{fixed ? ' · harga tersimpan' : ''}
                    </AppText>
                  </Pressable>
                  <View style={styles.stepper}>
                    <Pressable onPress={() => change(item.quantity - 1)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Kurangi ${name}`} style={styles.stepBtn}><MinusIcon size={16} color={colors.brand} /></Pressable>
                    <AppText variant="bodyStrong" style={{ minWidth: 26, textAlign: 'center' }} accessibilityLabel={`${item.quantity} botol`}>{item.quantity}</AppText>
                    <Pressable onPress={() => change(item.quantity + 1)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Tambah ${name}`} style={styles.stepBtn}><PlusIcon size={16} color={colors.brand} /></Pressable>
                  </View>
                </View>
              );
            })}
            <Pressable onPress={() => setProductsOpen(true)} accessibilityRole="button" accessibilityLabel={activeItems.length ? 'Tambah produk lain' : 'Pilih produk'} style={({ pressed }) => [styles.line, activeItems.length > 0 && styles.sep, pressed && { opacity: 0.6 }]}>
              <View style={styles.addTile}><PlusIcon size={20} color={colors.brand} /></View>
              <AppText variant="bodyStrong" color={colors.brand} style={{ fontSize: 15 }}>{activeItems.length ? 'Tambah produk lain' : 'Pilih produk'}</AppText>
            </Pressable>
          </View>
          {missingPrices.length > 0 ? (
            <Notice tone="warning" title="Harga katalog belum ada">{missingPrices.map(productDisplayName).join(', ')} memakai harga cadangan. Periksa nominalnya.</Notice>
          ) : null}
        </View>

        {activeItems.length > 0 ? (
          <View style={styles.section}>
            <AppText variant="heading" style={{ fontWeight: '800' }}>Harga</AppText>
            <View style={[styles.box, styles.priceBox]}>
              {keepSaved ? (
                <AppText variant="small" color={colors.textMuted}>Harga tersimpan dipakai. Mengubah produk, jumlah, atau jenjang akan menghitung ulang dari katalog.</AppText>
              ) : (
                <>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, gap: 1 }}>
                      <AppText variant="bodyStrong">Harga {TIER_LABEL[currentOption]}</AppText>
                      <AppText variant="small" color={colors.textMuted} style={{ fontSize: 13 }}>{priceReason}</AppText>
                    </View>
                    <AppText variant="bodyStrong" style={{ fontWeight: '800' }}>{formatRupiah(totals.totalPrice)}</AppText>
                  </Row>
                  {nextTier ? (
                    <View style={{ gap: 6 }}>
                      <View style={styles.track}><View style={[styles.trackFill, { width: `${Math.min(100, Math.round((totals.totalQuantity / TIER_MIN_BOTTLES[nextTier]) * 100))}%` }]} /></View>
                      <AppText variant="small" color={colors.brandDark} style={{ fontSize: 13, fontWeight: '600' }}>
                        Tambah {TIER_MIN_BOTTLES[nextTier] - totals.totalQuantity} botol lagi untuk harga {TIER_LABEL[nextTier]}
                      </AppText>
                    </View>
                  ) : null}
                </>
              )}
              {options.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }} accessibilityRole="radiogroup">
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
                        <AppText variant="small" color={selected ? colors.brandDark : colors.textMuted} style={{ fontSize: 12, fontWeight: '700' }}>{option.label} · {TIER_MIN_BOTTLES[option.tier]}+</AppText>
                        <AppText variant="small" color={colors.text} style={{ fontSize: 14, fontWeight: selected ? '800' : '600' }}>{formatRupiah(option.total)}</AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}
            </View>
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
                    <MinusCircleIcon color={colors.danger} />
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
        {noCost ? <Notice tone="warning">Harga modal level kamu belum diisi. Atur di menu Akun.</Notice> : null}
        {stock.data && totals.totalQuantity > stock.data.currentStock ? <Notice tone="info">Stok tercatat {stock.data.currentStock} botol, lebih sedikit dari order ini.</Notice> : null}
      </ScrollView>

      <StickyFooter>
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText variant="small" color={colors.textMuted} numberOfLines={1} style={{ flex: 1 }}>
            {activeItems.length ? `Modal ${levelLabel} ${formatRupiahShort(totals.buyPrice)} · Biaya ${formatRupiahShort(totals.totalExpenses)}` : 'Pilih produk untuk melihat untung'}
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
            <View style={{ gap: 6 }}>
              <AppText variant="small" color={colors.textMuted} style={{ fontWeight: '600' }}>Jenjang pelanggan</AppText>
              <View style={styles.tierWrap} accessibilityRole="radiogroup">
                {TIERS.map(t => {
                  const on = tier === t;
                  return (
                    <Pressable key={t} onPress={() => pickTier(t)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`Jenjang ${TIER_DISPLAY[t]}`} style={[styles.tierChip, on && styles.tierChipOn]}>
                      <AppText variant="small" color={on ? colors.white : colors.text} style={{ fontWeight: '700', fontSize: 14 }}>{TIER_DISPLAY[t]}</AppText>
                    </Pressable>
                  );
                })}
              </View>
              <AppText variant="small" color={colors.textMuted} style={{ fontSize: 13 }}>Pelanggan yang juga mitra dapat harga sesuai jenjangnya, meski belinya sedikit.</AppText>
            </View>
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
  if (image) return <Image source={image} style={{ width: size, height: size, borderRadius: size / 4 }} accessibilityIgnoresInvertColors />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 4, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="small" color={colors.textMuted} style={{ fontWeight: '700' }}>{productDisplayName(name).slice(0, 2).toUpperCase()}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingTop: space.xs, gap: space.lg, paddingBottom: space.xxl },
  section: { gap: space.sm },
  box: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: 12, backgroundColor: colors.white },
  priceBox: { paddingVertical: 12, gap: 10 },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, paddingVertical: 8 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.brandTint, borderRadius: radius.pill, padding: 3 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  addTile: { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#9DB3A8', alignItems: 'center', justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.fill, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: colors.brand },
  option: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, gap: 1 },
  optionSelected: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  panel: { gap: space.sm, paddingBottom: space.sm },
  tierWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tierChip: { paddingHorizontal: 12, minHeight: 34, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  tierChipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 52, paddingHorizontal: space.sm, borderRadius: radius.md },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
});
