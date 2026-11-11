import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { saveTarget, type MonthTarget } from '~/data/finance';
import { useGeneralExpenses, useGeneralIncome, useOrders, useRefreshingMutation, useStock, useTargets } from '~/hooks/queries';
import { summarizeMonth, targetProgress } from '~/lib/dashboard';
import { currentMonth, monthLabel, type MonthRef } from '~/lib/dates';
import { formatNumberInput, formatRupiah, parseRupiahInput } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { AppText, Button, Card, ErrorState, LoadingState, Notice, Screen, TextField } from '~/ui/components';
import { MonthSwitcher } from '~/ui/MonthSwitcher';
import { ProgressBar } from '~/ui/ProgressBar';
import { colors } from '~/ui/theme';

export default function TargetScreen() {
  const targets = useTargets();
  const [month, setMonth] = useState<MonthRef>(currentMonth());
  if (targets.isPending) return <LoadingState />;
  if (targets.isError) return <ErrorState message={errorMessage(targets.error)} onRetry={() => targets.refetch()} />;
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <MonthSwitcher value={month} onChange={onMonthChange} />
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
        {progress ? (
          <Card>
            <AppText variant="heading">Capaian {monthLabel(month)}</AppText>
            <ProgressBar label="Untung kotor" valueText={`${formatRupiah(progress.profit.value)} / ${formatRupiah(progress.profit.target)}`} pct={progress.profit.pct} />
            <ProgressBar label="Botol terjual" valueText={`${progress.qty.value} / ${progress.qty.target}`} pct={progress.qty.pct} />
            <ProgressBar label="Restok" valueText={`${progress.stock.value} / ${progress.stock.target}`} pct={progress.stock.pct} />
          </Card>
        ) : null}
        <Card>
          <AppText variant="heading">{existing ? 'Ubah target' : 'Buat target'}</AppText>
          <AppText variant="small" color={colors.textMuted}>Target ini sama dengan yang tampil di Beranda aplikasi dan web.</AppText>
          <TextField label="Target untung (Rp)" value={formatNumberInput(profit)} onChangeText={t => setProfit(parseRupiahInput(t))} keyboardType="number-pad" placeholder="5.000.000" />
          <TextField label="Target botol terjual" value={qty == null ? '' : String(qty)} onChangeText={t => setQty(parseRupiahInput(t))} keyboardType="number-pad" placeholder="100" />
          <TextField label="Target restok (botol)" value={restock == null ? '' : String(restock)} onChangeText={t => setRestock(parseRupiahInput(t))} keyboardType="number-pad" placeholder="100" />
        </Card>
        <Button label="Simpan target" onPress={submit} loading={save.isPending} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
