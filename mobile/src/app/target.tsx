import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { saveTarget, type MonthTarget } from '~/data/finance';
import { useGeneralExpenses, useGeneralIncome, useOrders, useRefreshingMutation, useStock, useTargets } from '~/hooks/queries';
import { summarizeMonth, targetProgress } from '~/lib/dashboard';
import { currentMonth, MONTH_NAMES, monthLabel, type MonthRef } from '~/lib/dates';
import { formatNumberInput, formatRupiahShort, parseRupiahInput } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, ErrorState, Notice } from '~/ui/components';
import { ProgressCardSkeleton, TargetSkeleton } from '~/ui/skeleton';
import { FieldRow, Group, kitStyles, PageHeader, SectionLabel } from '~/ui/kit';
import { MonthSwitcher } from '~/ui/MonthSwitcher';
import { CapsuleButton, StickyFooter } from '~/ui/sheet';
import { colors, space } from '~/ui/theme';

export default function TargetScreen() {
  const targets = useTargets();
  const [month, setMonth] = useState<MonthRef>(currentMonth());
  if (targets.isPending) return <View style={kitStyles.page}><PageHeader title="Target bulanan" /><TargetSkeleton /></View>;
  if (targets.isError) return <View style={kitStyles.page}><PageHeader title="Target bulanan" /><ErrorState message={errorMessage(targets.error)} onRetry={() => targets.refetch()} /></View>;
  const existing = targets.data.find(t => t.year === month.year && t.month === month.month) ?? null;
  // Remount the form per month so its fields start from that month's target.
  return <TargetForm key={`${month.year}-${month.month}`} month={month} onMonthChange={setMonth} existing={existing} />;
}

function TargetForm({ month, onMonthChange, existing }: { month: MonthRef; onMonthChange: (m: MonthRef) => void; existing: MonthTarget | null }) {
  const orders = useOrders();
  const stock = useStock();
  const expenses = useGeneralExpenses();
  const income = useGeneralIncome();
  const [profit, setProfit] = useState<number | null>(existing?.targetProfit ?? null);
  const [qty, setQty] = useState<number | null>(existing?.targetQty ?? null);
  const [restock, setRestock] = useState<number | null>(existing?.targetStock ?? null);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const save = useRefreshingMutation(saveTarget, ['targets']);

  const summary = orders.data && stock.data ? summarizeMonth(month, orders.data, expenses.data ?? [], income.data ?? [], stock.data.entries) : null;
  const progress = summary && existing ? targetProgress(summary, existing, false) : null;

  const submit = () => {
    setMessage(null);
    save.mutate(
      { year: month.year, month: month.month, targetProfit: profit ?? 0, targetQty: qty ?? 0, targetStock: restock ?? 0 },
      { onSuccess: () => setMessage({ tone: 'success', text: `Target ${monthLabel(month)} tersimpan.` }), onError: e => setMessage({ tone: 'danger', text: errorMessage(e) }) },
    );
  };

  return (
    <KeyboardAvoidingView style={kitStyles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PageHeader title="Target bulanan" />
      <ScrollView contentContainerStyle={[kitStyles.content, { paddingBottom: space.xxl }]} keyboardShouldPersistTaps="handled">
        <MonthSwitcher value={month} onChange={onMonthChange} />
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

        {progress ? (
          <View style={{ gap: space.sm }}>
            <SectionLabel>Capaian {MONTH_NAMES[month.month]}</SectionLabel>
            <View style={styles.progressCard}>
              <Progress label="Untung kotor" value={formatRupiahShort(progress.profit.value)} target={formatRupiahShort(progress.profit.target)} pct={progress.profit.pct} />
              <Progress label="Botol terjual" value={`${progress.qty.value}`} target={`${progress.qty.target} botol`} pct={progress.qty.pct} />
              <Progress label="Restok" value={`${progress.stock.value}`} target={`${progress.stock.target} botol`} pct={progress.stock.pct} />
            </View>
          </View>
        ) : existing && !orders.isError && !stock.isError ? (
          <ProgressCardSkeleton />
        ) : null}

        <View style={{ gap: space.sm }}>
          <SectionLabel>{existing ? 'Ubah target' : 'Buat target'}</SectionLabel>
          <Group>
            <FieldRow first label="Untung kotor" value={formatNumberInput(profit)} onChangeText={t => setProfit(parseRupiahInput(t))} keyboardType="number-pad" placeholder="5.000.000" suffix={<AppText variant="small" color={colors.textMuted}>Rp</AppText>} />
            <FieldRow label="Botol terjual" value={qty == null ? '' : String(qty)} onChangeText={t => setQty(parseRupiahInput(t))} keyboardType="number-pad" placeholder="100" suffix={<AppText variant="small" color={colors.textMuted}>botol</AppText>} />
            <FieldRow label="Restok" value={restock == null ? '' : String(restock)} onChangeText={t => setRestock(parseRupiahInput(t))} keyboardType="number-pad" placeholder="100" suffix={<AppText variant="small" color={colors.textMuted}>botol</AppText>} />
          </Group>
          <AppText variant="small" color={colors.textMuted}>Target ini sama dengan yang tampil di Beranda aplikasi dan web.</AppText>
        </View>
      </ScrollView>
      <StickyFooter>
        <CapsuleButton label={existing ? 'Simpan perubahan target' : 'Simpan target'} onPress={submit} loading={save.isPending} />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}

function Progress({ label, value, target, pct }: { label: string; value: string; target: string; pct: number }) {
  return (
    <View style={{ gap: 6 }} accessibilityLabel={`${label}: ${value} dari ${target}, ${pct} persen`}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <AppText variant="small" color={colors.textMuted} style={{ flex: 1 }}>{label}</AppText>
        <AppText variant="small" style={{ fontWeight: '700', fontSize: 14 }}>{value}</AppText>
        <AppText variant="small" color={colors.textMuted}>/ {target}</AppText>
        <AppText variant="small" color={colors.brandDark} style={{ fontWeight: '700', minWidth: 38, textAlign: 'right' }}>{pct}%</AppText>
      </View>
      <View style={styles.bar}><View style={[styles.barFill, { width: `${Math.min(100, pct)}%` }]} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressCard: { backgroundColor: colors.white, borderRadius: 18, padding: 14, gap: 14 },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.fill, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.brand },
});
