import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Share, Switch, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { saveStoreSettings, slugify, type PaymentInfo, type StoreSettings } from '~/data/store';
import { useProfile, useRefreshingMutation, useStoreSettings } from '~/hooks/queries';
import { publicWebUrl } from '~/lib/config';
import { errorMessage } from '~/lib/supabase';
import { AppText, Button, Card, Divider, ErrorState, Icon, LoadingState, Notice, Row, Screen, TextField } from '~/ui/components';
import { Chips } from '~/ui/Chips';
import { colors, space } from '~/ui/theme';

const PAYMENT_TYPES = [
  { value: 'bank', label: 'Bank' },
  { value: 'ewallet', label: 'E-wallet' },
  { value: 'cod', label: 'COD / Tunai' },
] as const;

export default function StoreScreen() {
  const store = useStoreSettings();
  const profile = useProfile();
  if (store.isPending || profile.isPending) return <LoadingState />;
  if (store.isError) return <ErrorState message={errorMessage(store.error)} onRetry={() => store.refetch()} />;
  const initial: StoreSettings = store.data ?? {
    slug: slugify(profile.data?.name ?? ''),
    store_name: profile.data?.name ? `Toko ${profile.data.name}` : '',
    is_active: true,
    payment_info: [],
    welcome_message: '',
  };
  return <StoreForm initial={initial} exists={!!store.data} />;
}

function StoreForm({ initial, exists }: { initial: StoreSettings; exists: boolean }) {
  const [s, setS] = useState<StoreSettings>(initial);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const save = useRefreshingMutation((settings: StoreSettings) => saveStoreSettings(settings, exists), ['store']);
  const url = publicWebUrl(`/toko/${slugify(s.slug)}`);
  const update = (patch: Partial<StoreSettings>) => setS(prev => ({ ...prev, ...patch }));
  const setPayment = (i: number, patch: Partial<PaymentInfo>) => update({ payment_info: s.payment_info.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  const submit = () => {
    setMessage(null);
    save.mutate(s, {
      onSuccess: () => setMessage({ tone: 'success', text: 'Pengaturan toko tersimpan.' }),
      onError: e => setMessage({ tone: 'danger', text: errorMessage(e) }),
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <AppText variant="heading">Toko aktif</AppText>
              <AppText variant="small" color={colors.textMuted}>Pelanggan bisa memesan sendiri lewat link toko.</AppText>
            </View>
            <Switch value={s.is_active} onValueChange={v => update({ is_active: v })} trackColor={{ true: colors.brand }} accessibilityLabel="Toko aktif" />
          </Row>
          {exists ? (
            <>
              <Divider />
              <AppText variant="small" color={colors.textMuted}>Link toko</AppText>
              <AppText variant="bodyStrong" selectable>{url}</AppText>
              <Row>
                <Button label="Bagikan" icon="share-outline" tone="secondary" onPress={() => Share.share({ message: `Pesan langsung di ${s.store_name}: ${url}` })} style={{ flex: 1 }} />
                <Button label="Lihat" icon="open-outline" tone="secondary" onPress={() => WebBrowser.openBrowserAsync(url)} style={{ flex: 1 }} />
              </Row>
            </>
          ) : null}
        </Card>

        <Card>
          <TextField label="Nama toko" value={s.store_name} onChangeText={v => update({ store_name: v })} />
          <TextField label="Alamat toko" value={s.slug} onChangeText={v => update({ slug: v.toLowerCase() })} autoCapitalize="none" hint={`Link: ${url}`} />
          <TextField label="Pesan sambutan (opsional)" value={s.welcome_message ?? ''} onChangeText={v => update({ welcome_message: v })} multiline style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }} />
        </Card>

        <Card>
          <AppText variant="heading">Cara pembayaran</AppText>
          <AppText variant="small" color={colors.textMuted}>Tampil di halaman toko setelah pelanggan memesan.</AppText>
          {s.payment_info.map((p, i) => (
            <View key={i} style={{ gap: space.sm }}>
              {i > 0 ? <Divider /> : null}
              <Row style={{ justifyContent: 'space-between' }}>
                <AppText variant="bodyStrong">Pembayaran {i + 1}</AppText>
                <Pressable onPress={() => update({ payment_info: s.payment_info.filter((_, j) => j !== i) })} accessibilityRole="button" accessibilityLabel={`Hapus pembayaran ${i + 1}`} hitSlop={10}>
                  <Icon name="trash-outline" color={colors.danger} />
                </Pressable>
              </Row>
              <Chips options={PAYMENT_TYPES} value={p.type} onChange={type => setPayment(i, { type })} />
              {p.type !== 'cod' ? (
                <>
                  <TextField label={p.type === 'bank' ? 'Nama bank' : 'Nama e-wallet'} value={p.name} onChangeText={v => setPayment(i, { name: v })} placeholder={p.type === 'bank' ? 'BCA' : 'GoPay'} />
                  <TextField label={p.type === 'bank' ? 'Nomor rekening' : 'Nomor HP'} value={p.number} onChangeText={v => setPayment(i, { number: v })} keyboardType="number-pad" />
                  <TextField label="Atas nama" value={p.account_name} onChangeText={v => setPayment(i, { account_name: v })} />
                </>
              ) : null}
            </View>
          ))}
          <Button label="Tambah cara pembayaran" icon="add" tone="secondary" onPress={() => update({ payment_info: [...s.payment_info, { type: 'bank', name: '', account_name: '', number: '' }] })} />
        </Card>

        <Button label="Simpan pengaturan toko" onPress={submit} loading={save.isPending} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
