import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { saveStoreSettings, slugify, type PaymentInfo, type StoreSettings } from '~/data/store';
import { useProfile, useRefreshingMutation, useStoreSettings } from '~/hooks/queries';
import { publicWebUrl } from '~/lib/config';
import { errorMessage } from '~/lib/supabase';
import { AppText, ErrorState, LoadingState, Notice } from '~/ui/components';
import { GlobeIcon, PlusIcon, ShareIcon, StoreIcon, TrashIcon } from '~/ui/icons';
import { FieldRow, Group, kitStyles, PageHeader, PillButton, SectionLabel } from '~/ui/kit';
import { CapsuleButton, StickyFooter } from '~/ui/sheet';
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
  if (store.isPending || profile.isPending) return <View style={kitStyles.page}><PageHeader title="Toko online" /><LoadingState /></View>;
  if (store.isError) return <View style={kitStyles.page}><PageHeader title="Toko online" /><ErrorState message={errorMessage(store.error)} onRetry={() => store.refetch()} /></View>;
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
    <KeyboardAvoidingView style={kitStyles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PageHeader title="Toko online" />
      <ScrollView contentContainerStyle={[kitStyles.content, { paddingBottom: space.xxl }]} keyboardShouldPersistTaps="handled">
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

        <View style={[styles.hero, !s.is_active && { backgroundColor: colors.textMuted }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.heroIcon}><StoreIcon size={22} color={colors.white} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="heading" color={colors.white} style={{ fontWeight: '800' }} numberOfLines={1}>{s.store_name || 'Toko kamu'}</AppText>
              <AppText variant="small" color="#E4F3EA">{s.is_active ? 'Aktif, pelanggan bisa pesan sendiri' : 'Nonaktif, link toko ditutup'}</AppText>
            </View>
            <Switch value={s.is_active} onValueChange={v => update({ is_active: v })} trackColor={{ true: '#5FC296', false: '#C7C7CC' }} thumbColor={colors.white} accessibilityLabel="Toko aktif" />
          </View>
          {exists ? (
            <>
              <View style={styles.link}><AppText variant="small" color={colors.white} selectable numberOfLines={1}>{url}</AppText></View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <PillButton label="Bagikan link" Icon={ShareIcon} tone="outline" onPress={() => Share.share({ message: `Pesan langsung di ${s.store_name}: ${url}` })} style={{ flex: 1 }} />
                <PillButton label="Lihat toko" Icon={GlobeIcon} tone="outline" onPress={() => WebBrowser.openBrowserAsync(url)} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <AppText variant="small" color="#E4F3EA">Simpan pengaturan dulu untuk mendapatkan link toko.</AppText>
          )}
        </View>

        <View style={{ gap: space.sm }}>
          <SectionLabel>Info toko</SectionLabel>
          <Group>
            <FieldRow first label="Nama toko" value={s.store_name} onChangeText={v => update({ store_name: v })} />
            <FieldRow label="Alamat link" value={s.slug} onChangeText={v => update({ slug: v.toLowerCase() })} autoCapitalize="none" autoCorrect={false} />
            <FieldRow label="Sambutan" value={s.welcome_message ?? ''} onChangeText={v => update({ welcome_message: v })} multiline placeholder="Opsional, tampil di atas daftar produk" />
          </Group>
          <AppText variant="small" color={colors.textMuted}>Link: {url}</AppText>
        </View>

        <View style={{ gap: space.sm }}>
          <SectionLabel>Cara pembayaran</SectionLabel>
          <AppText variant="small" color={colors.textMuted}>Tampil di halaman toko setelah pelanggan memesan.</AppText>
          {s.payment_info.map((p, i) => (
            <View key={i} style={styles.payment}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppText variant="bodyStrong" style={{ flex: 1 }}>Pembayaran {i + 1}</AppText>
                <Pressable onPress={() => update({ payment_info: s.payment_info.filter((_, j) => j !== i) })} accessibilityRole="button" accessibilityLabel={`Hapus pembayaran ${i + 1}`} hitSlop={10} style={styles.trash}>
                  <TrashIcon size={18} color={colors.danger} />
                </Pressable>
              </View>
              <Chips options={PAYMENT_TYPES} value={p.type} onChange={type => setPayment(i, { type })} />
              {p.type !== 'cod' ? (
                <View style={styles.paymentFields}>
                  <FieldRow first label={p.type === 'bank' ? 'Bank' : 'E-wallet'} value={p.name} onChangeText={v => setPayment(i, { name: v })} placeholder={p.type === 'bank' ? 'BCA' : 'GoPay'} />
                  <FieldRow label={p.type === 'bank' ? 'No. rekening' : 'No. HP'} value={p.number} onChangeText={v => setPayment(i, { number: v })} keyboardType="number-pad" />
                  <FieldRow label="Atas nama" value={p.account_name} onChangeText={v => setPayment(i, { account_name: v })} />
                </View>
              ) : null}
            </View>
          ))}
          <Pressable onPress={() => update({ payment_info: [...s.payment_info, { type: 'bank', name: '', account_name: '', number: '' }] })} accessibilityRole="button" style={({ pressed }) => [styles.addPayment, pressed && { opacity: 0.7 }]}>
            <PlusIcon size={18} color={colors.brand} />
            <AppText variant="bodyStrong" color={colors.brand}>Tambah cara pembayaran</AppText>
          </Pressable>
        </View>
      </ScrollView>
      <StickyFooter>
        <CapsuleButton label="Simpan pengaturan toko" onPress={submit} loading={save.isPending} />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.brand, borderRadius: 18, padding: 14, gap: 12 },
  heroIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  link: { backgroundColor: 'rgba(0,0,0,0.16)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  payment: { backgroundColor: colors.white, borderRadius: 18, padding: 14, gap: 10 },
  paymentFields: { backgroundColor: colors.fill, borderRadius: 14, paddingHorizontal: 12 },
  trash: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  addPayment: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#9DB3A8' },
});
