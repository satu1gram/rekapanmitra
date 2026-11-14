import { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { buildCandidates, filterCandidates, type Candidate, type CustomerLike, type OrderLike } from '~/lib/customerCandidates';
import { AppText, Notice, TextField } from './components';
import { CheckIcon, CloseIcon, PlusIcon, SearchIcon } from './icons';
import { Avatar } from './kit';
import { RowsSkeleton } from './skeleton';
import { CapsuleButton, SheetHeader, StickyFooter } from './sheet';
import { colors, radius, space } from './theme';

interface Props<TC extends CustomerLike> {
  name: string;
  phone: string;
  tier: string;
  customerId: string | null;
  tiers: readonly { value: string; label: string }[];
  tierLabel: (tier: string) => string;
  customers: { data?: TC[]; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };
  orders: OrderLike[] | undefined;
  /** Message to show under the search field (e.g. "Pilih atau ketik nama pelanggan."). */
  error?: string | null;
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
  onTierChange: (tier: string) => void;
  onClear: () => void;
  onPick: (c: Candidate) => void;
  onClose: () => void;
}

/**
 * Customer picker drawn over the order form (not a second native sheet, which stacks on top of the
 * order sheet and shows two grab handles). Shows recent customers right away, filters as you type,
 * and offers "add as new customer" when nothing matches.
 */
export function CustomerPicker<TC extends CustomerLike>(p: Props<TC>) {
  const list = useMemo(() => buildCandidates(p.customers.data ?? [], p.orders ?? []), [p.customers.data, p.orders]);
  const query = p.name.trim();
  const matches = useMemo(() => filterCandidates(list, p.name, 8), [list, p.name]);
  const exact = matches.some(c => c.name.trim().toLowerCase() === query.toLowerCase());
  const total = list.length;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SheetHeader title="Pelanggan" onClose={p.onClose} grabber={false} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6 }}>
          <View style={[styles.search, p.error ? { borderColor: colors.danger } : null]}>
            <SearchIcon size={18} color={colors.textMuted} />
            <TextInput
              value={p.name}
              onChangeText={p.onNameChange}
              placeholder="Cari nama atau ketik nama baru"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => query && p.onClose()}
              accessibilityLabel="Nama pelanggan"
              style={styles.searchInput}
            />
            {p.name ? (
              <Pressable onPress={p.onClear} accessibilityRole="button" accessibilityLabel="Hapus nama pelanggan" hitSlop={10} style={({ pressed }) => [styles.clear, pressed && { opacity: 0.6 }]}>
                <CloseIcon size={12} color={colors.white} />
              </Pressable>
            ) : null}
          </View>
          {p.error ? <AppText variant="small" color={colors.danger} style={{ fontWeight: '600', paddingHorizontal: 4 }}>{p.error}</AppText> : null}
        </View>

        {p.customers.isPending ? (
          <RowsSkeleton rows={3} right={false} height={56} />
        ) : p.customers.isError ? (
          <View style={{ gap: 8 }}>
            <Notice tone="warning" title="Daftar pelanggan belum bisa dimuat">Kamu tetap bisa mengetik nama baru. Cek koneksi, lalu coba lagi.</Notice>
            <Pressable onPress={() => p.customers.refetch()} accessibilityRole="button" style={{ alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center', paddingHorizontal: 4 }}>
              <AppText variant="bodyStrong" color={colors.brand} style={{ fontWeight: '700' }}>Coba lagi</AppText>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 4 }}>
            <View style={styles.sectionRow}>
              <AppText variant="small" color={colors.textMuted} style={{ fontWeight: '700' }}>{query ? `Cocok dengan “${query}”` : 'Pelanggan terakhir'}</AppText>
              {total ? <AppText variant="small" color={colors.textMuted}>{total} tersimpan</AppText> : null}
            </View>
            {matches.map(c => {
              const selected = !!p.customerId && c.id === p.customerId;
              return (
                <Pressable key={c.key} onPress={() => p.onPick(c)} accessibilityRole="button" accessibilityLabel={`Pilih ${c.name}`} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.fill }]}>
                  <Avatar name={c.name} size={40} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText variant="bodyStrong" numberOfLines={1}>{c.name}</AppText>
                    <AppText variant="small" color={colors.textMuted} numberOfLines={1}>
                      {p.tierLabel(c.tier)}{c.phone ? ` · ${c.phone}` : ''} · {c.orderCount} order{c.fromOrders ? ' · dari riwayat' : ''}
                    </AppText>
                  </View>
                  {selected ? <CheckIcon size={18} color={colors.brand} /> : null}
                </Pressable>
              );
            })}
            {query && !exact ? (
              <Pressable onPress={p.onClose} accessibilityRole="button" accessibilityLabel={`Tambah ${query} sebagai pelanggan baru`} style={({ pressed }) => [styles.row, styles.newRow, pressed && { opacity: 0.7 }]}>
                <View style={styles.newIcon}><PlusIcon size={18} color={colors.brand} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="bodyStrong" color={colors.brandDark} numberOfLines={1}>Tambah “{query}” sebagai pelanggan baru</AppText>
                  <AppText variant="small" color={colors.textMuted}>Disimpan bersama order ini</AppText>
                </View>
              </Pressable>
            ) : null}
            {!query && matches.length === 0 ? (
              <AppText variant="small" color={colors.textMuted} style={{ paddingVertical: space.md, paddingHorizontal: 4 }}>Belum ada pelanggan tersimpan. Ketik nama untuk menambahkan pelanggan baru.</AppText>
            ) : null}
          </View>
        )}

        {query ? (
          <View style={{ gap: space.md }}>
            <View style={{ gap: 6 }}>
              <AppText variant="small" color={colors.textMuted} style={{ fontWeight: '700' }}>Jenjang pelanggan</AppText>
              <View style={styles.tierWrap} accessibilityRole="radiogroup">
                {p.tiers.map(t => {
                  const on = p.tier === t.value;
                  return (
                    <Pressable key={t.value} onPress={() => p.onTierChange(t.value)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`Jenjang ${t.label}`} style={[styles.tierChip, on && styles.tierChipOn]}>
                      <AppText variant="small" color={on ? colors.white : colors.text} style={{ fontWeight: '700', fontSize: 14 }}>{t.label}</AppText>
                    </Pressable>
                  );
                })}
              </View>
              <AppText variant="small" color={colors.textMuted} style={{ fontSize: 13 }}>Pelanggan yang juga mitra dapat harga sesuai jenjangnya, meski belinya sedikit.</AppText>
            </View>
            <TextField label="No. WhatsApp (opsional)" value={p.phone} onChangeText={p.onPhoneChange} keyboardType="phone-pad" placeholder="mis. 0812 3456 7890" />
          </View>
        ) : null}
      </ScrollView>
      <StickyFooter>
        {!query ? <AppText variant="small" color={colors.textMuted} style={{ textAlign: 'center' }}>Pilih dari daftar, atau ketik nama pelanggan.</AppText> : null}
        <CapsuleButton label="Pakai pelanggan ini" onPress={p.onClose} disabled={!query} />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: colors.white },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.fill, borderWidth: 1, borderColor: 'transparent' },
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, color: colors.text, paddingVertical: 8 },
  clear: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#8E8E93', alignItems: 'center', justifyContent: 'center' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 58, paddingHorizontal: space.sm, borderRadius: radius.md },
  newRow: { backgroundColor: colors.brandSoft, marginTop: 4 },
  newIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  tierWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tierChip: { paddingHorizontal: 12, minHeight: 34, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  tierChipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
});
