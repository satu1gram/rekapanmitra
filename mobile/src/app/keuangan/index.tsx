import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { categoryLabel, type MoneyKind } from '~/data/finance';
import { useGeneralExpenses, useGeneralIncome } from '~/hooks/queries';
import { currentMonth, formatDate, isInMonth, MONTH_NAMES, type MonthRef } from '~/lib/dates';
import { formatRupiah } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, ErrorState } from '~/ui/components';
import { FinanceSkeleton, FinanceTotalSkeleton } from '~/ui/skeleton';
import { ChevronIcon, WalletIcon } from '~/ui/icons';
import { kitStyles, PageHeader, PillTabs } from '~/ui/kit';
import { MonthSwitcher } from '~/ui/MonthSwitcher';
import { CapsuleButton, StickyFooter } from '~/ui/sheet';
import { colors, space } from '~/ui/theme';

const KINDS = [
  { value: 'expense', label: 'Pengeluaran' },
  { value: 'income', label: 'Pemasukan' },
] as const;

export default function FinanceScreen() {
  const expenses = useGeneralExpenses();
  const income = useGeneralIncome();
  const [kind, setKind] = useState<MoneyKind>('expense');
  const [month, setMonth] = useState<MonthRef>(currentMonth());
  const query = kind === 'expense' ? expenses : income;

  const entries = useMemo(() => (query.data ?? []).filter(e => isInMonth(e.date, month)), [query.data, month]);
  const total = entries.reduce((s, e) => s + e.amount, 0);
  const isExpense = kind === 'expense';
  const add = () => router.push({ pathname: '/keuangan/form', params: { kind } });

  return (
    <View style={kitStyles.page}>
      <PageHeader title="Pengeluaran & pemasukan" />
      <ScrollView
        contentContainerStyle={[kitStyles.content, { paddingBottom: space.xxl }]}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => { query.refetch(); }} tintColor={colors.brand} />}
      >
        <PillTabs options={KINDS} value={kind} onChange={setKind} />
        <MonthSwitcher value={month} onChange={setMonth} />

        {query.isPending ? <FinanceTotalSkeleton /> : (
          <View style={[styles.total, { backgroundColor: isExpense ? colors.dangerSoft : colors.brandSoft }]}>
            <AppText variant="small" color={isExpense ? colors.danger : colors.brandDark} style={{ fontWeight: '700' }}>
              Total {isExpense ? 'pengeluaran' : 'pemasukan'} {MONTH_NAMES[month.month]}
            </AppText>
            <AppText variant="title" color={isExpense ? colors.danger : colors.brandDark} style={{ fontSize: 26 }}>{formatRupiah(total)}</AppText>
            <AppText variant="small" color={colors.textMuted}>
              {isExpense
                ? 'Biaya di luar order, mis. kemasan atau transport. Mengurangi untung bersih.'
                : 'Pemasukan di luar penjualan, mis. bonus. Menambah untung bersih.'}
            </AppText>
          </View>
        )}

        {query.isPending ? <FinanceSkeleton /> : query.isError ? <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} /> : (
          <View style={{ gap: space.sm }}>
            <AppText variant="heading" style={{ fontWeight: '800' }}>{entries.length} catatan</AppText>
            <View style={styles.list}>
              {entries.length === 0 ? (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}><WalletIcon color={colors.brand} /></View>
                  <AppText variant="small" color={colors.textMuted} style={{ textAlign: 'center' }}>Belum ada catatan {isExpense ? 'pengeluaran' : 'pemasukan'} di {MONTH_NAMES[month.month]}.</AppText>
                </View>
              ) : (
                entries.map((e, i) => (
                  <Pressable
                    key={e.id}
                    onPress={() => router.push({ pathname: '/keuangan/form', params: { kind, id: e.id } })}
                    accessibilityRole="button"
                    accessibilityLabel={`${e.name}, ${formatRupiah(e.amount)}, ${formatDate(e.date)}`}
                    style={({ pressed }) => [styles.row, i > 0 && styles.sep, pressed && { opacity: 0.6 }]}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="bodyStrong" numberOfLines={1}>{e.name}</AppText>
                      <AppText variant="small" color={colors.textMuted} numberOfLines={1}>{formatDate(e.date)} · {categoryLabel(kind, e.category)}{e.notes ? ` · ${e.notes}` : ''}</AppText>
                    </View>
                    <AppText variant="bodyStrong" color={isExpense ? colors.danger : colors.brandDark}>{isExpense ? '−' : '+'}{formatRupiah(e.amount)}</AppText>
                    <ChevronIcon direction="right" size={16} color="#AEAEB2" />
                  </Pressable>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
      <StickyFooter>
        <CapsuleButton label={isExpense ? 'Catat pengeluaran' : 'Catat pemasukan'} onPress={add} />
      </StickyFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  total: { borderRadius: 18, padding: 14, gap: 4 },
  list: { backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 58, paddingVertical: 8 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xl },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
});
