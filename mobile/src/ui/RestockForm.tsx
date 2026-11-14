import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, Stack } from 'expo-router';
import type { TierType } from '@/types';

import type { StockEntryRow } from '~/data/db';
import { addRestock, updateRestock, type RestockInput } from '~/data/stock';
import { levelLabel } from '~/data/profile';
import { useProfile, useRefreshingMutation } from '~/hooks/queries';
import { businessDateToISO, formatDate, sameDay } from '~/lib/dates';
import { formatNumberInput, formatRupiah, parseRupiahInput } from '~/lib/money';
import { buyPricePerBottle } from '~/lib/orderMath';
import { errorMessage } from '~/lib/supabase';
import { AppText, Notice } from './components';
import { MinusIcon, PlusIcon } from './icons';
import { DateCalendar } from './DateField';
import { ProofPicker } from './ProofPicker';
import { FieldRow } from './kit';
import { CapsuleButton, SheetHeader, StickyFooter } from './sheet';
import { colors, radius, space } from './theme';
import { DialogHost, showDialog } from './dialog';
import { KeyboardSafeView } from './KeyboardSafeView';

/** A row that opens something when tapped: small label on top, value below, green action word on the right. */
function TapRow({ label, value, action, onPress, first, muted }: { label: string; value: string; action: string; onPress: () => void; first?: boolean; muted?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}. ${action}`} style={({ pressed }) => [styles.tap, !first && styles.sep, pressed && { opacity: 0.6 }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="small" color={colors.textMuted} style={{ fontSize: 12, fontWeight: '600' }}>{label}</AppText>
        <AppText variant="body" color={muted ? colors.placeholder : colors.text} style={{ fontSize: 16, fontWeight: muted ? '400' : '600', paddingVertical: 3 }}>{value}</AppText>
      </View>
      <AppText variant="bodyStrong" color={colors.brand} style={{ fontWeight: '700' }}>{action}</AppText>
    </Pressable>
  );
}

const QUICK_SIZES = [5, 10, 20, 40];
type Panel = 'none' | 'date' | 'proof';

/** Create a restock, or edit one when `entry` is given: how many bottles, buy price, then date, proof and note. */
export function RestockForm({ entry, initialQuantity }: { entry?: StockEntryRow; initialQuantity?: number }) {
  const profile = useProfile();
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

  const today = sameDay(date, new Date());
  const toggle = (p: Panel) => setPanel(prev => (prev === p ? 'none' : p));
  const total = (price ?? 0) * quantity;

  return (
    <KeyboardSafeView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <SheetHeader title={entry ? 'Ubah restok' : 'Catat restok'} onClose={close} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <Notice tone="danger">{error}</Notice> : null}

        <View style={styles.section}>
          <AppText variant="heading" style={styles.h2}>Berapa botol datang?</AppText>
          <View style={[styles.card, { paddingVertical: 14, gap: 12 }]}>
            <View style={styles.bigStepper}>
              <Pressable onPress={() => setQuantity(q => Math.max(1, q - 1))} accessibilityRole="button" accessibilityLabel="Kurangi 1 botol" style={({ pressed }) => [styles.bigBtn, pressed && { opacity: 0.7 }]}>
                <MinusIcon size={20} color={colors.brand} />
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <TextInput
                  value={quantity ? String(quantity) : ''}
                  onChangeText={t => setQuantity(parseInt(t.replace(/[^0-9]/g, ''), 10) || 0)}
                  keyboardType="number-pad"
                  accessibilityLabel="Jumlah botol"
                  style={styles.bigInput}
                  maxLength={4}
                />
                <AppText variant="small" color={colors.textMuted}>botol</AppText>
              </View>
              <Pressable onPress={() => setQuantity(q => q + 1)} accessibilityRole="button" accessibilityLabel="Tambah 1 botol" style={({ pressed }) => [styles.bigBtn, pressed && { opacity: 0.7 }]}>
                <PlusIcon size={20} color={colors.brand} />
              </Pressable>
            </View>
            <View style={styles.sizes} accessibilityRole="radiogroup">
              {QUICK_SIZES.map(size => {
                const selected = quantity === size;
                return (
                  <Pressable key={size} onPress={() => setQuantity(size)} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${size} botol`} style={[styles.size, selected && styles.sizeSelected]}>
                    <AppText variant="bodyStrong" color={selected ? colors.white : colors.text} style={{ fontWeight: '700' }}>{size}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="heading" style={styles.h2}>Harga beli</AppText>
          <View style={styles.card}>
            <FieldRow
              first
              label="Modal per botol (bisa diubah)"
              value={formatNumberInput(price)}
              onChangeText={t => setPrice(parseRupiahInput(t))}
              keyboardType="number-pad"
              placeholder="Isi harga beli per botol"
              suffix={<AppText variant="small" color={colors.textMuted}>Rp / botol</AppText>}
            />
          </View>
          {profile.data ? (
            <AppText variant="small" color={colors.textMuted} style={styles.hint}>
              {price === defaultPrice ? `Terisi otomatis dari level ${levelLabel(profile.data)}. Ketuk angkanya kalau harga belinya berbeda.` : `Harga level ${levelLabel(profile.data)} adalah ${formatRupiah(defaultPrice)}. Angka di atas sudah kamu ubah.`}
            </AppText>
          ) : null}
          <View style={styles.total} accessibilityLabel={`Total belanja ${formatRupiah(total)}`}>
            <View style={{ flex: 1 }}>
              <AppText variant="small" color={colors.brandDark} style={{ fontWeight: '700' }}>Total belanja</AppText>
              <AppText variant="small" color={colors.brandDark}>{quantity} botol × {formatRupiah(price ?? 0)}</AppText>
            </View>
            <AppText variant="title" color={colors.brandDark} style={{ fontSize: 20 }}>{formatRupiah(total)}</AppText>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="heading" style={styles.h2}>Detail</AppText>
          <View style={styles.card}>
            <TapRow first label="Tanggal terima" value={today ? `Hari ini, ${formatDate(date.toISOString())}` : formatDate(date.toISOString())} action="Ubah" onPress={() => toggle('date')} />
            {panel === 'date' ? <View style={{ paddingBottom: space.md }}><DateCalendar value={date} onChange={d => { setDate(d); setPanel('none'); }} /></View> : null}
            <TapRow label="Bukti / nota" value={proofUrl ? 'Foto terlampir' : 'Belum ada foto'} muted={!proofUrl} action={proofUrl ? 'Ganti' : 'Tambah'} onPress={() => toggle('proof')} />
            {panel === 'proof' ? <View style={{ paddingBottom: space.md }}><ProofPicker value={proofUrl} onChange={setProofUrl} label="Foto bukti transfer atau nota" /></View> : null}
            <FieldRow label="Catatan (opsional)" value={notes} onChangeText={setNotes} placeholder="mis. dari upline siapa" />
          </View>
        </View>
      </ScrollView>

      <StickyFooter>
        <CapsuleButton label={entry ? 'Simpan perubahan' : 'Simpan restok'} value={`+${quantity} botol`} onPress={submit} loading={save.isPending} />
      </StickyFooter>
      <DialogHost />
    </KeyboardSafeView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  section: { gap: space.sm },
  h2: { fontSize: 16, fontWeight: '800' },
  card: { borderRadius: 18, paddingHorizontal: 14, backgroundColor: colors.white },
  bigStepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bigBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  bigInput: { fontSize: 34, fontWeight: '800', color: colors.text, textAlign: 'center', minWidth: 90, paddingVertical: 0 },
  sizes: { flexDirection: 'row', gap: space.sm },
  size: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.fill },
  sizeSelected: { backgroundColor: colors.brand },
  field: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  fieldLabel: { width: 104, fontSize: 14, fontWeight: '500', color: colors.label },
  input: { flex: 1, minWidth: 0, width: 0, fontSize: 15, fontWeight: '600', color: colors.text, paddingVertical: space.sm },
  tap: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 60, paddingVertical: 7 },
  hint: { paddingHorizontal: 4, lineHeight: 18 },
  total: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderRadius: 16, backgroundColor: colors.brandSoft, paddingHorizontal: 14, paddingVertical: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.brandSoft },
});
