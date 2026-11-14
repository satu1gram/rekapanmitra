import { useMemo, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance } from 'react-native';
import { router, Stack } from 'expo-router';
import { MITRA_LEVELS, type TierType } from '@/types';
import { getFallbackUnitPrice } from '@/lib/catalogPricing';

import type { CustomerRow } from '~/data/db';
import { recordCustomerPurchase } from '~/data/customers';
import { createOrder, updateOrder } from '~/data/orders';
import { useCatalog, useCustomers, useOrderDetail, useOrders, useProfile, useRefreshingMutation, useStock } from '~/hooks/queries';
import { businessDateToISO, formatDate, sameDay } from '~/lib/dates';
import { formatNumberInput, formatRupiah, formatRupiahShort, parseRupiahInput } from '~/lib/money';
import { computeOrderTotals, mitraCostLookup, priceItems, productCategories, productDisplayName, type DraftExpense, type DraftItem } from '~/lib/orderMath';
import { priceOptions, selectedOption, TIER_LABEL, TIER_MIN_BOTTLES } from '~/lib/priceOptions';
import { errorMessage } from '~/lib/supabase';
import { AppText, Button, ErrorState, Notice, Row, TextField } from './components';
import { OrderFormSkeleton } from './skeleton';
import { DateCalendar } from './DateField';
import { CloseIcon, MinusCircleIcon, MinusIcon, PlusIcon, SearchIcon } from './icons';
import { productImage } from './productMedia';
import { ProofPicker } from './ProofPicker';
import { CapsuleButton, RouteCard, SheetHeader, SheetRow, StickyFooter } from './sheet';
import { colors, radius, space } from './theme';
import { DialogHost, showDialog } from './dialog';

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
  const orders = useOrders();

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
  const [showAll, setShowAll] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Set after a failed save attempt: field errors show from then on and clear as soon as the field is fixed.
  const [submitted, setSubmitted] = useState(false);
  const [expenseTried, setExpenseTried] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);

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

  const touch = () => setPricesTouched(true);
  const setQty = (name: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [name]: Math.max(0, quantity) }));
    touch();
  };
  const setFixedQty = (name: string, quantity: number) => {
    setFixedLines(prev => prev.map(l => (l.productName === name ? { ...l, quantity: Math.max(0, quantity) } : l)));
    touch();
  };
  // Product list shown inline (no extra sheet): saved lines first, then every catalog product.
  const savedPrice = (name: string) => (keepSaved ? initial.savedItems?.find(i => i.productName === name)?.pricePerBottle : undefined);
  const catalogLines = priced?.items ?? items;
  const productRows = [
    ...fixedItems.map(l => ({ name: l.productName, quantity: l.quantity, price: l.pricePerBottle, fixed: true, change: (q: number) => setFixedQty(l.productName, q) })),
    ...catalogLines.map(l => ({ name: l.productName, quantity: l.quantity, price: savedPrice(l.productName) ?? l.pricePerBottle, fixed: false, change: (q: number) => setQty(l.productName, q) })),
  ];
  const q = query.trim().toLowerCase();
  const shownRows = productRows.filter(r => (showAll || r.quantity > 0) && (!q || productDisplayName(r.name).toLowerCase().includes(q)));
  const visibleGroups = [
    { title: 'Propolis & perawatan', rows: shownRows.filter(r => !/^BELGIE/i.test(r.name)) },
    { title: 'Belgie Pro (skincare)', rows: shownRows.filter(r => /^BELGIE/i.test(r.name)) },
  ].filter(g => g.rows.length > 0);

  // "Ulangi order terakhir": the chosen customer's latest order, mapped back to catalog categories.
  const lastOrderId = !isEdit && customerId ? orders.data?.find(o => o.customer_id === customerId)?.id : undefined;
  const lastOrder = useOrderDetail(lastOrderId ?? '');
  const repeatLines = (lastOrderId && lastOrder.data?.items ? lastOrder.data.items : [])
    .map(it => ({ name: catalog.data?.find(p => p.id === it.productId)?.category ?? it.productName, quantity: it.quantity }))
    .filter(l => catalogLines.some(c => c.productName === l.name));
  const repeatLastOrder = () => {
    setQuantities(Object.fromEntries(repeatLines.map(l => [l.name, l.quantity])));
    setPricesTouched(true);
  };

  const suggestions = useMemo(() => {
    const q = customerName.trim().toLowerCase();
    if (!q || customerId) return [];
    return (customers.data ?? []).filter(c => c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q)).slice(0, 6);
  }, [customerName, customerId, customers.data]);

  if (catalog.isPending || profile.isPending) return <OrderFormSkeleton title={isEdit ? 'Ubah order' : 'Order baru'} />;
  if (catalog.isError) return <ErrorState message={errorMessage(catalog.error)} onRetry={() => catalog.refetch()} />;
  if (catalog.data.length === 0) return <ErrorState message="Katalog produk belum tersedia. Hubungi admin." onRetry={() => catalog.refetch()} />;

  const pickTier = (t: TierType) => {
    setTierState(t);
    touch();
  };
  const clearCustomer = () => { setCustomerName(''); setCustomerId(null); setCustomerPhone(''); };
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
      setExpenseTried(true);
      return;
    }
    setExpenses(prev => [...prev, { name: expenseName.trim(), amount: expenseAmount }]);
    setExpenseName('');
    setExpenseAmount(null);
    setExpenseTried(false);
  };

  const customerErr = customerName.trim() ? null : 'Pilih atau ketik nama pelanggan.';
  const productsErr = activeItems.length === 0 ? 'Tambahkan minimal satu produk.' : null;
  const missing = [customerErr && 'Pelanggan', productsErr && 'Produk'].filter(Boolean) as string[];
  const shownCustomerErr = submitted ? customerErr : null;
  const shownProductsErr = submitted ? productsErr : null;

  const submit = () => {
    setError(null);
    if (missing.length) {
      setSubmitted(true);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    showDialog(
      isEdit ? 'Simpan perubahan order?' : 'Simpan order ini?',
      undefined,
      [
        { text: 'Cek lagi', style: 'cancel' },
        { text: isEdit ? 'Ya, simpan perubahan' : 'Ya, simpan order', onPress: doSave },
      ],
      <View style={styles.confirm}>
        <ConfirmLine label="Pelanggan" value={`${customerName.trim()} · ${TIER_DISPLAY[tier]}`} />
        <ConfirmLine label="Tanggal" value={formatDate(date.toISOString())} />
        <ConfirmLine label="Produk" value={activeItems.map(i => `${i.quantity} ${productDisplayName(i.productName)}`).join(', ')} />
        <View style={styles.summarySep} />
        <ConfirmLine label={`Total (${TIER_LABEL[currentOption]})`} value={formatRupiah(totals.totalPrice)} strong />
        <ConfirmLine label={totals.margin < 0 ? 'Rugi' : 'Untung kamu'} value={formatRupiah(Math.abs(totals.margin))} color={totals.margin < 0 ? colors.danger : colors.brand} />
      </View>,
    );
  };

  const doSave = () => {
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
    showDialog(isEdit ? 'Batalkan perubahan?' : 'Batalkan order ini?', 'Isian yang belum disimpan akan hilang.', [
      { text: 'Lanjut mengisi', style: 'cancel' },
      { text: 'Batalkan', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const today = sameDay(date, new Date());

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: !dirty }} />
      <SheetHeader title={isEdit ? 'Ubah order' : 'Order baru'} onClose={confirmLeave} />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {submitted && missing.length ? (
          <Notice tone="danger" title="Order belum bisa disimpan">Isi dulu {missing.join(' dan ')}. Bagian yang masih kosong ditandai merah.</Notice>
        ) : null}
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
        {shownCustomerErr ? <FieldError>{shownCustomerErr}</FieldError> : null}
        {panel === 'date' ? <DateCalendar value={date} onChange={d => { setDate(d); setPanel('none'); }} /> : null}

        <View style={styles.section}>
          <Row style={{ justifyContent: 'space-between' }}>
            <AppText variant="heading" style={{ fontWeight: '800' }}>Produk</AppText>
            {activeItems.length > 0 ? (
              <Pressable onPress={() => setShowAll(v => !v)} hitSlop={8} accessibilityRole="button">
                <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>{showAll ? `Ringkas · ${totals.totalQuantity} botol` : 'Lihat semua produk'}</AppText>
              </Pressable>
            ) : (
              <AppText variant="small" color={colors.textMuted}>Ketuk + untuk menambah</AppText>
            )}
          </Row>
          {shownProductsErr ? <FieldError>{shownProductsErr}</FieldError> : null}

          {repeatLines.length > 0 && activeItems.length === 0 ? (
            <View style={styles.suggest}>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="small" color={colors.brandDark} style={{ fontWeight: '700' }}>Ulangi order terakhir {customerName.trim()}</AppText>
                <AppText variant="small" color={colors.textMuted} numberOfLines={2}>{repeatLines.map(l => `${l.quantity} ${productDisplayName(l.name)}`).join(', ')}</AppText>
              </View>
              <Pressable onPress={repeatLastOrder} accessibilityRole="button" style={({ pressed }) => [styles.suggestBtn, pressed && { opacity: 0.8 }]}>
                <AppText variant="small" color={colors.white} style={{ fontWeight: '700' }}>Pakai</AppText>
              </Pressable>
            </View>
          ) : null}

          {showAll && productRows.length > 6 ? (
            <View style={styles.search}>
              <SearchIcon size={18} color={colors.textMuted} />
              <TextInput value={query} onChangeText={setQuery} placeholder="Cari produk" placeholderTextColor={colors.placeholder} style={styles.searchInput} accessibilityLabel="Cari produk" />
              {query ? <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Hapus pencarian"><CloseIcon size={16} color={colors.textMuted} /></Pressable> : null}
            </View>
          ) : null}

          <View style={styles.box}>
            {visibleGroups.length === 0 ? (
              <View style={{ paddingVertical: 16 }}><AppText variant="small" color={colors.textMuted}>Tidak ada produk yang cocok dengan “{query}”.</AppText></View>
            ) : null}
            {visibleGroups.map((group, gi) => (
              <View key={group.title}>
                {visibleGroups.length > 1 ? <AppText variant="caption" color={colors.textMuted} style={[styles.groupTitle, gi > 0 && styles.sep]}>{group.title}</AppText> : null}
                {group.rows.map((row, i) => {
                  const name = productDisplayName(row.name);
                  const selected = row.quantity > 0;
                  return (
                    <View key={row.name} style={[styles.line, (i > 0 || visibleGroups.length > 1) && styles.sep]}>
                      <ProductThumb name={row.name} size={44} />
                      <View style={{ flex: 1, gap: 1 }}>
                        <AppText variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>{name}</AppText>
                        <AppText variant="small" color={selected ? colors.brandDark : colors.textMuted} style={{ fontSize: 13, fontWeight: selected ? '600' : '400' }} numberOfLines={1}>
                          {selected ? `${row.quantity} × ${formatRupiah(row.price)}` : `${formatRupiah(row.price)}/botol`}{row.fixed ? ' · harga tersimpan' : ''}
                        </AppText>
                      </View>
                      {selected ? (
                        <View style={styles.stepper}>
                          <Pressable onPress={() => row.change(row.quantity - 1)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Kurangi ${name}`} style={styles.stepBtn}><MinusIcon size={16} color={colors.brand} /></Pressable>
                          <AppText variant="bodyStrong" style={{ minWidth: 26, textAlign: 'center' }} accessibilityLabel={`${row.quantity} botol`}>{row.quantity}</AppText>
                          <Pressable onPress={() => row.change(row.quantity + 1)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Tambah ${name}`} style={styles.stepBtn}><PlusIcon size={16} color={colors.brand} /></Pressable>
                        </View>
                      ) : (
                        <Pressable onPress={() => row.change(1)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Tambah ${name}`} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}>
                          <PlusIcon size={18} color={colors.brand} />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
            {!showAll && productRows.length > activeItems.length ? (
              <Pressable onPress={() => setShowAll(true)} accessibilityRole="button" style={({ pressed }) => [styles.line, styles.sep, { minHeight: 46 }, pressed && { opacity: 0.6 }]}>
                <PlusIcon size={18} color={colors.brand} />
                <AppText variant="bodyStrong" color={colors.brand} style={{ fontSize: 14 }}>Tambah produk lain</AppText>
              </Pressable>
            ) : null}
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

        <View style={[styles.box, { paddingHorizontal: 16 }]}>
          <SheetRow first label="Biaya tambahan" value={expenses.length ? `${expenses.length > 1 ? `${expenses.length} biaya` : expenses[0].name} ${formatRupiah(totals.totalExpenses)}` : 'Tidak ada'} valueColor={expenses.length ? colors.text : colors.textMuted} onPress={() => togglePanel('expenses')} />
          {panel === 'expenses' ? (
            <View style={styles.panel}>
              <AppText variant="small" color={colors.textMuted}>Biaya yang kamu tanggung untuk order ini, mis. ongkir, packing, atau infaq. Mengurangi untung, tidak menambah tagihan pelanggan.</AppText>
              {expenses.map((e, i) => (
                <Row key={`${e.name}-${i}`} style={{ justifyContent: 'space-between' }}>
                  <AppText variant="body" style={{ flex: 1 }}>{e.name}</AppText>
                  <AppText variant="bodyStrong">{formatRupiah(e.amount)}</AppText>
                  <Pressable onPress={() => setExpenses(prev => prev.filter((_, j) => j !== i))} accessibilityRole="button" accessibilityLabel={`Hapus biaya tambahan ${e.name}`} hitSlop={10} style={{ padding: 6 }}>
                    <MinusCircleIcon color={colors.danger} />
                  </Pressable>
                </Row>
              ))}
              <Row style={{ alignItems: 'flex-end' }}>
                <View style={{ flex: 1.3 }}><TextField label="Jenis biaya" value={expenseName} onChangeText={setExpenseName} placeholder="mis. Ongkir" error={expenseTried && !expenseName.trim() ? 'Isi jenis biaya.' : null} /></View>
                <View style={{ flex: 1 }}><TextField label="Nominal" value={formatNumberInput(expenseAmount)} onChangeText={t => setExpenseAmount(parseRupiahInput(t))} keyboardType="number-pad" placeholder="mis. 12.000" error={expenseTried && !expenseAmount ? 'Isi nominal.' : null} /></View>
              </Row>
              <Button label="Tambah biaya tambahan" icon="add" tone="secondary" onPress={addExpense} />
            </View>
          ) : null}
          <SheetRow label="Bukti transfer" value={proofUrl ? 'Terlampir' : 'Belum ada'} valueColor={proofUrl ? colors.brand : colors.textMuted} onPress={() => togglePanel('proof')} />
          {panel === 'proof' ? <View style={styles.panel}><ProofPicker value={proofUrl} onChange={setProofUrl} label="Foto bukti transfer" /></View> : null}
        </View>

        {activeItems.length > 0 ? (
          <View style={styles.section}>
            <AppText variant="heading" style={{ fontWeight: '800', fontSize: 18 }}>Ringkasan</AppText>
            <View style={[styles.box, styles.summary]}>
              <SummaryLine label={`Omset · ${totals.totalQuantity} botol`} value={formatRupiah(totals.totalPrice)} />
              <SummaryLine label={`Modal (level ${levelLabel})`} value={`−${formatRupiah(totals.buyPrice)}`} />
              <SummaryLine label="Biaya tambahan" value={totals.totalExpenses ? `−${formatRupiah(totals.totalExpenses)}` : 'Rp0'} />
              <View style={styles.summarySep} />
              <Row style={{ justifyContent: 'space-between' }}>
                <AppText variant="heading" style={{ fontWeight: '800' }}>{totals.margin < 0 ? 'Rugi' : 'Untung kamu'}</AppText>
                <AppText variant="heading" color={totals.margin < 0 ? colors.danger : colors.brand} style={{ fontWeight: '800', fontSize: 18 }}>{formatRupiah(Math.abs(totals.margin))}</AppText>
              </Row>
            </View>
          </View>
        ) : null}

        {isEdit && savedTotal != null && savedTotal !== totals.totalPrice ? (
          <Notice tone="info">Total berubah dari {formatRupiah(savedTotal)} menjadi {formatRupiah(totals.totalPrice)}.</Notice>
        ) : null}
        {totals.margin < 0 && activeItems.length ? <Notice tone="warning">Order ini rugi {formatRupiah(-totals.margin)}. Periksa harga atau biaya tambahan.</Notice> : null}
        {noCost ? <Notice tone="warning">Harga modal level kamu belum diisi. Atur di menu Akun.</Notice> : null}
        {stock.data && totals.totalQuantity > stock.data.currentStock ? <Notice tone="info">Stok tercatat {stock.data.currentStock} botol, lebih sedikit dari order ini.</Notice> : null}
      </ScrollView>

      <StickyFooter>
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText variant="small" color={colors.textMuted} numberOfLines={1} style={{ flex: 1 }}>
            {activeItems.length ? `${totals.totalQuantity} botol · harga ${TIER_LABEL[currentOption]}` : 'Pilih produk untuk melihat untung'}
          </AppText>
          {activeItems.length ? (
            <AppText variant="small" color={totals.margin < 0 ? colors.danger : colors.brand} style={{ fontWeight: '700' }} numberOfLines={1}>
              {totals.margin < 0 ? 'Rugi ' : 'Untung '}{formatRupiahShort(Math.abs(totals.margin))}
            </AppText>
          ) : null}
        </Row>
        <CapsuleButton label={isEdit ? 'Simpan perubahan' : 'Simpan order'} value={formatRupiah(totals.totalPrice)} onPress={submit} loading={save.isPending} />
      </StickyFooter>


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
              error={submitted ? customerErr : null}
              hint={customerName.trim() && customerId ? 'Ketik nama lain untuk mengganti. Pelanggan lama tidak berubah.' : undefined}
            />
            {customerName ? (
              <Pressable onPress={clearCustomer} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center' }}>
                <AppText variant="small" color={colors.danger} style={{ fontWeight: '700' }}>Kosongkan pelanggan</AppText>
              </Pressable>
            ) : null}
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
            <TextField label="No. WhatsApp (opsional)" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" placeholder="mis. 0812 3456 7890" />
          </ScrollView>
          <StickyFooter>
            {!customerName.trim() ? <AppText variant="small" color={colors.textMuted} style={{ textAlign: 'center' }}>Isi nama pelanggan dulu, atau pilih dari daftar di atas.</AppText> : null}
            <CapsuleButton label="Pakai pelanggan ini" onPress={() => setCustomerOpen(false)} disabled={!customerName.trim()} />
          </StickyFooter>
        </View>
      </Modal>
      <DialogHost />
    </KeyboardAvoidingView>
  );
}

/** Red helper line under a field or section that the person has not filled in yet. */
function FieldError({ children }: { children: string }) {
  return <AppText variant="small" color={colors.danger} style={{ fontWeight: '600', paddingHorizontal: 4, marginTop: 6 }} accessibilityLabel={children}>{children}</AppText>;
}

function ConfirmLine({ label, value, strong, color = colors.text }: { label: string; value: string; strong?: boolean; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <AppText variant="small" color={colors.textMuted} style={{ width: 118 }}>{label}</AppText>
      <AppText variant="small" color={color} style={{ flex: 1, textAlign: 'right', fontWeight: strong || color !== colors.text ? '700' : '500' }}>{value}</AppText>
    </View>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <AppText variant="body" color={colors.textMuted} style={{ flex: 1 }}>{label}</AppText>
      <AppText variant="body">{value}</AppText>
    </Row>
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
  content: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.lg, paddingBottom: space.xxl },
  section: { gap: space.sm },
  box: { borderRadius: 18, paddingHorizontal: 14, backgroundColor: colors.white },
  summary: { paddingVertical: 14, gap: 10 },
  confirm: { marginTop: 4, padding: 12, borderRadius: 14, backgroundColor: colors.fill, gap: 8 },
  summarySep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong, marginVertical: 2 },
  priceBox: { paddingVertical: 14, gap: 10 },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, paddingVertical: 8 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.brandTint, borderRadius: radius.pill, padding: 3 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  groupTitle: { paddingTop: 12, paddingBottom: 2, letterSpacing: 0.2, textTransform: 'uppercase' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.white },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15, color: colors.text, paddingVertical: 6 },
  suggest: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.brandTint, borderWidth: 1, borderColor: colors.brandBorder },
  suggestBtn: { minHeight: 34, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.brand, justifyContent: 'center' },
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
