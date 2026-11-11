import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { categoryLabel, type MoneyKind } from '~/data/finance';
import { useGeneralExpenses, useGeneralIncome } from '~/hooks/queries';
import { currentMonth, formatDate, isInMonth, monthLabel, type MonthRef } from '~/lib/dates';
import { formatRupiah } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, Button, Card, Divider, EmptyState, ErrorState, ListItem, LoadingState, Screen, Segmented } from '~/ui/components';
import { MonthSwitcher } from '~/ui/MonthSwitcher';
import { colors, space } from '~/ui/theme';

export default function FinanceScreen() {
  const expenses = useGeneralExpenses();
  const income = useGeneralIncome();
  const [kind, setKind] = useState<MoneyKind>('expense');
  const [month, setMonth] = useState<MonthRef>(currentMonth());
  const query = kind === 'expense' ? expenses : income;

  const entries = useMemo(() => (query.data ?? []).filter(e => isInMonth(e.date, month)), [query.data, month]);
  const total = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <Segmented value={kind} onChange={setKind} options={[{ value: 'expense', label: 'Pengeluaran' }, { value: 'income', label: 'Pemasukan' }]} />
      <MonthSwitcher value={month} onChange={setMonth} />
      <Card>
        <AppText variant="caption" color={colors.textMuted}>{(kind === 'expense' ? 'Total pengeluaran ' : 'Total pemasukan ') + monthLabel(month).toUpperCase()}</AppText>
        <AppText variant="title" color={kind === 'expense' ? colors.danger : colors.brandDark}>{formatRupiah(total)}</AppText>
        <AppText variant="small" color={colors.textMuted}>
          {kind === 'expense'
            ? 'Biaya usaha di luar order, misalnya kemasan atau transport. Mengurangi untung setelah biaya.'
            : 'Pemasukan di luar penjualan, misalnya bonus. Menambah untung setelah biaya.'}
        </AppText>
      </Card>
      <Button
        label={kind === 'expense' ? 'Catat pengeluaran' : 'Catat pemasukan'}
        icon="add-circle"
        onPress={() => router.push({ pathname: '/keuangan/form', params: { kind } })}
      />
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <Card style={{ paddingVertical: space.xs }}>
          {entries.length === 0 ? (
            <EmptyState icon="wallet-outline" title="Belum ada catatan di bulan ini" />
          ) : (
            entries.map((e, i) => (
              <View key={e.id}>
                {i > 0 ? <Divider /> : null}
                <ListItem
                  title={e.name}
                  subtitle={`${formatDate(e.date)} · ${categoryLabel(kind, e.category)}${e.notes ? ` · ${e.notes}` : ''}`}
                  right={<AppText variant="bodyStrong" color={kind === 'expense' ? colors.danger : colors.brandDark}>{formatRupiah(e.amount)}</AppText>}
                  onPress={() => router.push({ pathname: '/keuangan/form', params: { kind, id: e.id } })}
                />
              </View>
            ))
          )}
        </Card>
      )}
    </Screen>
  );
}
