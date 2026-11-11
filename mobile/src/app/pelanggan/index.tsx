import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useCustomers } from '~/hooks/queries';
import { formatRupiahShort } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, Divider, EmptyState, ErrorState, Icon, ListItem, LoadingState, Segmented } from '~/ui/components';
import { colors, radius, space } from '~/ui/theme';

type Sort = 'recent' | 'spent' | 'name';

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

  if (customers.isPending) return <LoadingState />;
  if (customers.isError) return <ErrorState message={errorMessage(customers.error)} onRetry={() => customers.refetch()} />;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxxl * 2 }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      data={list}
      keyExtractor={c => c.id}
      refreshControl={<RefreshControl refreshing={customers.isRefetching} onRefresh={() => { customers.refetch(); }} tintColor={colors.brand} />}
      ListHeaderComponent={
        <View style={{ gap: space.md, marginBottom: space.md }}>
          <View style={styles.search}>
            <Icon name="search" size={18} color={colors.textSubtle} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Cari nama atau nomor" placeholderTextColor={colors.textSubtle} style={styles.searchInput} accessibilityLabel="Cari pelanggan" clearButtonMode="while-editing" />
          </View>
          <Segmented value={sort} onChange={setSort} options={[{ value: 'recent', label: 'Terbaru' }, { value: 'spent', label: 'Terbesar' }, { value: 'name', label: 'A–Z' }]} />
          <AppText variant="small" color={colors.textMuted}>{list.length} pelanggan</AppText>
        </View>
      }
      ItemSeparatorComponent={Divider}
      renderItem={({ item }) => (
        <ListItem
          title={item.name}
          subtitle={`${item.total_orders} order${item.phone ? ` · ${item.phone}` : ''}`}
          right={<AppText variant="bodyStrong">{formatRupiahShort(Number(item.total_spent))}</AppText>}
          onPress={() => router.push({ pathname: '/pelanggan/[id]', params: { id: item.id } })}
        />
      )}
      ListEmptyComponent={<EmptyState icon="people-outline" title={query ? 'Tidak ada yang cocok' : 'Belum ada pelanggan'} message="Pelanggan tercatat otomatis saat kamu menambah order." />}
    />
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.md, minHeight: 48 },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: space.sm },
});
