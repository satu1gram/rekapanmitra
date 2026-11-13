import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useCustomers } from '~/hooks/queries';
import { formatRupiahShort } from '~/lib/money';
import { TIER_LABEL } from '~/lib/priceOptions';
import { errorMessage } from '~/lib/supabase';
import { AppText, ErrorState, LoadingState } from '~/ui/components';
import { ChevronIcon, CloseIcon, PeopleIcon, SearchIcon } from '~/ui/icons';
import { Avatar, kitStyles, PageHeader, PillTabs } from '~/ui/kit';
import { colors, radius, space } from '~/ui/theme';
import type { TierType } from '@/types';

type Sort = 'recent' | 'spent' | 'name';
const SORTS = [
  { value: 'recent', label: 'Terbaru' },
  { value: 'spent', label: 'Belanja terbesar' },
  { value: 'name', label: 'A–Z' },
] as const;

export default function CustomersScreen() {
  const customers = useCustomers();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('recent');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = (customers.data ?? []).filter(c => !q || c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q));
    if (sort === 'spent') return [...filtered].sort((a, b) => Number(b.total_spent) - Number(a.total_spent));
    if (sort === 'name') return [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'id'));
    return filtered;
  }, [customers.data, query, sort]);

  return (
    <View style={kitStyles.page}>
      <PageHeader title="Pelanggan" />
      {customers.isPending ? <LoadingState /> : customers.isError ? <ErrorState message={errorMessage(customers.error)} onRetry={() => customers.refetch()} /> : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xxxl * 2 }}
          keyboardShouldPersistTaps="handled"
          data={list}
          keyExtractor={c => c.id}
          refreshControl={<RefreshControl refreshing={customers.isRefetching} onRefresh={() => { customers.refetch(); }} tintColor={colors.brand} />}
          ListHeaderComponent={
            <View style={{ gap: space.md, marginBottom: space.md }}>
              <View style={styles.search}>
                <SearchIcon size={18} color={colors.textMuted} />
                <TextInput value={query} onChangeText={setQuery} placeholder="Cari nama atau nomor" placeholderTextColor={colors.textSubtle} style={styles.searchInput} accessibilityLabel="Cari pelanggan" />
                {query ? <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Hapus pencarian"><CloseIcon size={14} color={colors.textMuted} /></Pressable> : null}
              </View>
              <PillTabs options={SORTS} value={sort} onChange={setSort} />
              <AppText variant="small" color={colors.textMuted}>{list.length} pelanggan</AppText>
            </View>
          }
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/pelanggan/[id]', params: { id: item.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.total_orders} order, belanja ${formatRupiahShort(Number(item.total_spent))}`}
              style={({ pressed }) => [styles.row, index === 0 && styles.top, index === list.length - 1 && styles.bottom, pressed && { opacity: 0.7 }]}
            >
              <View style={[styles.inner, index > 0 && styles.sep]}>
                <Avatar name={item.name} size={38} />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyStrong" numberOfLines={1}>{item.name}</AppText>
                  <AppText variant="small" color={colors.textMuted} numberOfLines={1}>{TIER_LABEL[item.tier as TierType] ?? item.tier} · {item.total_orders} order{item.phone ? ` · ${item.phone}` : ''}</AppText>
                </View>
                <AppText variant="bodyStrong">{formatRupiahShort(Number(item.total_spent))}</AppText>
                <ChevronIcon direction="right" size={16} color="#AEAEB2" />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><PeopleIcon color={colors.brand} /></View>
              <AppText variant="heading" style={{ textAlign: 'center' }}>{query ? 'Tidak ada yang cocok' : 'Belum ada pelanggan'}</AppText>
              <AppText variant="small" color={colors.textMuted} style={{ textAlign: 'center' }}>{query ? 'Coba nama atau nomor lain.' : 'Pelanggan tercatat otomatis saat kamu menambah order.'}</AppText>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 14, minHeight: 42 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15, color: colors.text, paddingVertical: 8 },
  row: { backgroundColor: colors.white, paddingHorizontal: 14 },
  top: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  bottom: { borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 8 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xxxl },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
});
