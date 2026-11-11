import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import type { TierType } from '@/types';

import { addRestock } from '~/data/stock';
import { levelLabel } from '~/data/profile';
import { useProfile, useRefreshingMutation, useStock } from '~/hooks/queries';
import { businessDateToISO } from '~/lib/dates';
import { formatNumberInput, formatRupiah, parseRupiahInput } from '~/lib/money';
import { buyPricePerBottle } from '~/lib/orderMath';
import { errorMessage } from '~/lib/supabase';
import { AppText, Button, Card, Divider, Notice, Row, Screen, Stepper, TextField } from '~/ui/components';
import { DateField } from '~/ui/DateField';
import { colors } from '~/ui/theme';

export default function RestockScreen() {
  const profile = useProfile();
  const stock = useStock();
  const level = profile.data?.mitra_level ?? 'reseller';
  const defaultPrice = buyPricePerBottle(level, profile.data?.custom_buy_price);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<number | null>(defaultPrice || null);
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const save = useRefreshingMutation(addRestock, ['stock']);

  const submit = () => {
    if (quantity <= 0) return setError('Jumlah botol harus lebih dari 0.');
    setError(null);
    save.mutate(
      {
        quantity,
        tier: (level === 'custom' ? null : level) as TierType | null,
        buyPricePerBottle: price,
        notes,
        createdAt: businessDateToISO(date),
      },
      { onSuccess: () => router.back(), onError: e => setError(errorMessage(e, 'Restok gagal disimpan.')) },
    );
  };

  const current = stock.data?.currentStock ?? 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Card>
          <DateField label="Tanggal barang diterima" value={date} onChange={setDate} />
          <Row style={{ justifyContent: 'space-between' }}>
            <AppText variant="bodyStrong">Jumlah botol</AppText>
            <Stepper label="jumlah restok" value={quantity} min={1} onChange={setQuantity} />
          </Row>
          <TextField
            label="Harga modal per botol"
            value={formatNumberInput(price)}
            onChangeText={t => setPrice(parseRupiahInput(t))}
            keyboardType="number-pad"
            hint={profile.data ? `Default level ${levelLabel(profile.data)}` : undefined}
          />
          <TextField label="Catatan (opsional)" value={notes} onChangeText={setNotes} placeholder="Contoh: dari upline Bu Rina" multiline style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }} />
        </Card>
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <AppText variant="body" color={colors.textMuted}>Total belanja</AppText>
            <AppText variant="bodyStrong">{formatRupiah((price ?? 0) * quantity)}</AppText>
          </Row>
          <Divider />
          <Row style={{ justifyContent: 'space-between' }}>
            <AppText variant="body" color={colors.textMuted}>Stok setelah restok</AppText>
            <AppText variant="heading">{current} → {current + quantity} botol</AppText>
          </Row>
        </Card>
        <Button label="Simpan restok" onPress={submit} loading={save.isPending} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
