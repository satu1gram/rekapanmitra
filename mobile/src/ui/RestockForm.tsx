import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, Stack } from 'expo-router';
import type { TierType } from '@/types';

import type { StockEntryRow } from '~/data/db';
import { addRestock, updateRestock, type RestockInput } from '~/data/stock';
import { levelLabel } from '~/data/profile';
import { useProfile, useRefreshingMutation, useStock } from '~/hooks/queries';
import { businessDateToISO, formatDate, sameDay } from '~/lib/dates';
import { formatNumberInput, formatRupiah, parseRupiahInput } from '~/lib/money';
import { buyPricePerBottle } from '~/lib/orderMath';
import { errorMessage } from '~/lib/supabase';
import { AppText, Notice, Row } from './components';
import { DateCalendar } from './DateField';
import { ProofPicker } from './ProofPicker';
import { CapsuleButton, RouteCard, SheetHeader, SheetRow, StickyFooter } from './sheet';
import { colors, space } from './theme';
import { showDialog } from './dialog';

const QUICK_SIZES = [5, 10, 20, 40];
type Panel = 'none' | 'date' | 'proof';

/** Create a restock, or edit one when `entry` is given. Laid out like a send form: from upline → to your stock. */
export function RestockForm({ entry, initialQuantity }: { entry?: StockEntryRow; initialQuantity?: number }) {
  const profile = useProfile();
  const stock = useStock();
  const level = profile.data?.mitra_level ?? 'reseller';
  const defaultPrice = buyPricePerBottle(level, profile.data?.custom_buy_price);
  const [quantity, setQuantity] = useState(entry?.quantity ?? initialQuantity ?? 10);
  const [price, setPrice] = useState<number | null>(entry ? (entry.buy_price_per_bottle != null ? Number(entry.buy_price_per_bottle) : null) : defaultPrice || null);
  const [date, setDate] = useState(entry ? new Date(entry.created_at) : new Date());
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [proofUrl, setProofUrl] = useState<string | null>(entry?.transfer_proof_url ?? null);
  const [panel, setPanel] = useState<Panel>('none');
  const [error, setError] = useState<string | null>(null);
  const save = useRefreshingMutation(
    (input: RestockInput) => (entry ? updateRestock(entry.id, entry.quantity, input) : addRestock(input)),
    ['stock'],
  );

  const submit = () => {
    if (!Number.isInteger(quantity) || quantity <= 0) return setError('Jumlah botol harus lebih dari 0.');
    setError(null);
    save.mutate(
      {
        quantity,
        tier: entry ? ((entry.tier as TierType | null) ?? null) : ((level === 'custom' ? null : level) as TierType | null),
        buyPricePerBottle: price,
        notes,
        createdAt: entry && date.getTime() === new Date(entry.created_at).getTime() ? entry.created_at : businessDateToISO(date),
        transferProofUrl: proofUrl,
      },
      { onSuccess: () => router.back(), onError: e => setError(errorMessage(e, 'Restok gagal disimpan.')) },
    );
  };

  const close = () => {
    if (!entry && quantity === (initialQuantity ?? 10) && !notes && !proofUrl) return router.back();
    showDialog('Batalkan?', 'Isian yang belum disimpan akan hilang.', [
      { text: 'Lanjut mengisi', style: 'cancel' },
      { text: 'Batalkan', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const current = stock.data?.currentStock ?? 0;
  const after = current + quantity - (entry?.quantity ?? 0);
  const today = sameDay(date, new Date());
  const toggle = (p: Panel) => setPanel(prev => (prev === p ? 'none' : p));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <SheetHeader title={entry ? 'Ubah restok' : 'Catat restok'} onClose={close} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <Notice tone="danger">{error}</Notice> : null}

        <RouteCard
          stops={[
            { label: 'Dari', value: 'Upline / pusat', marker: 'square' },
            { label: 'Ke', value: `Stok kamu · ${current} → ${after} botol`, marker: 'dot' },
          ]}
        />

        <View style={{ gap: space.md }}>
          <AppText variant="heading" style={{ fontWeight: '800' }}>Berapa botol?</AppText>
          <View style={styles.sizes} accessibilityRole="radiogroup">
            {QUICK_SIZES.map(size => {
              const selected = quantity === size;
              return (
                <Pressable key={size} onPress={() => setQuantity(size)} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${size} botol`} style={[styles.size, selected && styles.sizeSelected]}>
                  <AppText variant="title" color={selected ? colors.brand : colors.text} style={{ fontSize: 20 }}>{size}</AppText>
                  <AppText variant="caption" color={selected ? colors.brand : colors.textMuted} style={{ letterSpacing: 0 }}>botol</AppText>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.field}>
            <AppText variant="body" color={colors.textMuted} style={styles.fieldLabel} numberOfLines={1}>Jumlah lain</AppText>
            <TextInput
              value={quantity ? String(quantity) : ''}
              onChangeText={t => setQuantity(parseInt(t.replace(/[^0-9]/g, ''), 10) || 0)}
              keyboardType="number-pad"
              accessibilityLabel="Jumlah botol"
              style={styles.input}
            />
            <AppText variant="body" color={colors.textMuted}>botol</AppText>
          </View>
        </View>

        <View style={{ gap: space.sm }}>
          <AppText variant="heading" style={{ fontWeight: '800' }}>Detail</AppText>
          <View style={styles.field}>
            <AppText variant="body" color={colors.textMuted} style={styles.fieldLabel}>Modal/botol</AppText>
            <TextInput value={formatNumberInput(price)} onChangeText={t => setPrice(parseRupiahInput(t))} keyboardType="number-pad" placeholder="0" accessibilityLabel="Harga modal per botol" style={styles.input} />
            {profile.data ? <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 0 }}>{levelLabel(profile.data)}</AppText> : null}
          </View>
          <View style={styles.field}>
            <AppText variant="body" color={colors.textMuted} style={styles.fieldLabel}>Catatan</AppText>
            <TextInput value={notes} onChangeText={setNotes} placeholder="Opsional" placeholderTextColor={colors.textSubtle} accessibilityLabel="Catatan" style={styles.input} />
          </View>
          <View style={styles.group}>
            <SheetRow first label="Tanggal terima" value={today ? `Hari ini, ${formatDate(date.toISOString())}` : formatDate(date.toISOString())} onPress={() => toggle('date')} />
            {panel === 'date' ? <View style={{ paddingBottom: space.md }}><DateCalendar value={date} onChange={d => { setDate(d); setPanel('none'); }} /></View> : null}
            <SheetRow label="Bukti / nota" value={proofUrl ? 'Terlampir' : 'Tambah foto'} valueColor={colors.brand} onPress={() => toggle('proof')} />
            {panel === 'proof' ? <View style={{ paddingBottom: space.md }}><ProofPicker value={proofUrl} onChange={setProofUrl} label="Foto bukti transfer atau nota" /></View> : null}
          </View>
        </View>
      </ScrollView>

      <StickyFooter>
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText variant="small" color={colors.textMuted}>Total belanja</AppText>
          <AppText variant="small" style={{ fontWeight: '700' }}>{formatRupiah((price ?? 0) * quantity)}</AppText>
        </Row>
        <CapsuleButton label={entry ? 'Simpan perubahan' : 'Simpan restok'} value={`+${quantity} botol`} onPress={submit} loading={save.isPending} />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  group: { borderRadius: 18, paddingHorizontal: 14, backgroundColor: colors.white },
  sizes: { flexDirection: 'row', gap: space.sm },
  size: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 16, borderWidth: 1.5, borderColor: colors.white, backgroundColor: colors.white },
  sizeSelected: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  field: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 46, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.white },
  fieldLabel: { width: 96, fontSize: 14 },
  input: { flex: 1, minWidth: 0, width: 0, fontSize: 15, color: colors.text, paddingVertical: space.sm },
});
